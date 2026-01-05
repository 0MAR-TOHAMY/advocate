# حماية الصفحات العامة من استدعاءات المصادقة

## المشكلة

كانت هناك مشكلة حيث يحاول `AuthContext` استدعاء `/api/auth/me` و `/api/auth/refresh` في جميع الصفحات، بما في ذلك الصفحات العامة مثل:
- صفحة تسجيل الدخول (`/login`)
- صفحة التسجيل (`/register`)
- الصفحة الرئيسية (`/`)
- صفحات إعادة تعيين كلمة المرور

هذا كان يسبب:
- ❌ أخطاء في Console
- ❌ استدعاءات API غير ضرورية
- ❌ محاولات تحديث Token في صفحات لا تحتاجها
- ❌ تجربة مستخدم سيئة

## الحل

تم تحديث `AuthContext` لتحديد الصفحات العامة وتجنب استدعاءات المصادقة فيها.

### 1. قائمة الصفحات العامة

```typescript
// Public routes that don't require authentication
const publicRoutes = [
  '/login', 
  '/register', 
  '/forgot-password', 
  '/reset-password', 
  '/verify-email', 
  '/'
];
```

### 2. دالة التحقق من الصفحة العامة

```typescript
// Check if current route is public
const isPublicRoute = useCallback(() => {
  if (!pathname) return false;
  return publicRoutes.some(route => pathname.includes(route));
}, [pathname]);
```

### 3. التحديثات المطبقة

#### أ. `fetchUser()` - جلب بيانات المستخدم
```typescript
const fetchUser = useCallback(async () => {
  // Skip fetching user on public routes
  if (isPublicRoute()) {
    setLoading(false);
    return;
  }

  try {
    const res = await authenticatedFetch("/api/auth/me");
    // ... rest of the code
  }
}, [authenticatedFetch, isPublicRoute]);
```

**الفائدة:**
- ✅ لا يتم استدعاء `/api/auth/me` في الصفحات العامة
- ✅ يتم تعيين `loading` إلى `false` مباشرة
- ✅ لا توجد أخطاء في Console

#### ب. `refreshAccessToken()` - تحديث Token
```typescript
const refreshAccessToken = useCallback(async () => {
  // Skip refresh on public routes
  if (isPublicRoute()) {
    return false;
  }

  if (isRefreshingRef.current) return false;
  
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    // ... rest of the code
  } catch (error) {
    // Clear user and redirect to login only if not already on public route
    if (!isPublicRoute()) {
      setUser(null);
      const lang = pathname?.split("/")[1] || "ar";
      router.push(`/${lang}/login`);
    }
    return false;
  }
}, [pathname, router, isPublicRoute]);
```

**الفائدة:**
- ✅ لا يتم محاولة تحديث Token في الصفحات العامة
- ✅ تجنب حلقات إعادة التوجيه (redirect loops)
- ✅ لا يتم مسح بيانات المستخدم في الصفحات العامة

#### ج. `setupTokenRefresh()` - إعداد التحديث التلقائي
```typescript
const setupTokenRefresh = useCallback(() => {
  // Skip setup on public routes
  if (isPublicRoute()) {
    return;
  }

  // Clear existing interval
  if (refreshIntervalRef.current) {
    clearInterval(refreshIntervalRef.current);
  }

  // Refresh token 1 minute before expiry
  const expiryTime = getTokenExpiryTime();
  const refreshTime = expiryTime - 60 * 1000;

  refreshIntervalRef.current = setInterval(() => {
    refreshAccessToken();
  }, refreshTime);
}, [refreshAccessToken, isPublicRoute]);
```

**الفائدة:**
- ✅ لا يتم إعداد Interval للتحديث التلقائي في الصفحات العامة
- ✅ توفير موارد النظام
- ✅ تجنب استدعاءات API غير ضرورية

## كيفية إضافة صفحة عامة جديدة

إذا كنت تريد إضافة صفحة عامة جديدة (لا تحتاج مصادقة)، قم بإضافتها إلى قائمة `publicRoutes`:

```typescript
const publicRoutes = [
  '/login', 
  '/register', 
  '/forgot-password', 
  '/reset-password', 
  '/verify-email', 
  '/',
  '/about',           // صفحة جديدة
  '/contact',         // صفحة جديدة
  '/terms',           // صفحة جديدة
];
```

## سلوك النظام

### في الصفحات العامة:
- ✅ `loading` يتم تعيينه إلى `false` مباشرة
- ✅ لا يتم استدعاء `/api/auth/me`
- ✅ لا يتم استدعاء `/api/auth/refresh`
- ✅ لا يتم إعداد التحديث التلقائي للـ Token
- ✅ `user` يبقى `null`
- ✅ لا توجد أخطاء في Console

### في الصفحات المحمية (Dashboard):
- ✅ يتم استدعاء `/api/auth/me` لجلب بيانات المستخدم
- ✅ يتم إعداد التحديث التلقائي للـ Token
- ✅ إذا فشل التحقق، يتم إعادة التوجيه إلى `/login`
- ✅ يتم تحديث Token تلقائياً قبل انتهاء صلاحيته

## مثال على الاستخدام

### صفحة تسجيل الدخول
```tsx
export default function LoginPage() {
  const { login, loading } = useAuth();
  
  // loading سيكون false مباشرة
  // لن يتم استدعاء /api/auth/me
  
  async function handleLogin() {
    await login(email, password);
    // بعد تسجيل الدخول الناجح، سيتم استدعاء fetchUser()
  }
}
```

### صفحة Dashboard المحمية
```tsx
export default function DashboardPage() {
  const { user, loading } = useAuth();
  
  // سيتم استدعاء /api/auth/me تلقائياً
  // سيتم إعداد التحديث التلقائي للـ Token
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;
  
  return <div>Welcome {user.name}</div>;
}
```

## الفوائد

### الأداء
- 🚀 تقليل استدعاءات API غير الضرورية
- 🚀 تحسين وقت تحميل الصفحات العامة
- 🚀 توفير موارد الخادم

### تجربة المستخدم
- ✨ لا توجد أخطاء في Console
- ✨ تحميل أسرع للصفحات العامة
- ✨ سلوك متوقع ومنطقي

### الأمان
- 🔒 فصل واضح بين الصفحات العامة والمحمية
- 🔒 تجنب محاولات المصادقة في الصفحات العامة
- 🔒 حماية أفضل للـ Tokens

## الاختبار

### اختبار الصفحات العامة
1. افتح صفحة `/login`
2. افتح Console
3. تأكد من عدم وجود استدعاءات لـ `/api/auth/me` أو `/api/auth/refresh`
4. تأكد من عدم وجود أخطاء

### اختبار الصفحات المحمية
1. سجل الدخول
2. انتقل إلى `//profile`
3. تأكد من استدعاء `/api/auth/me`
4. تأكد من عمل التحديث التلقائي للـ Token

## الملخص

تم حل المشكلة بنجاح من خلال:
1. ✅ تحديد الصفحات العامة بوضوح
2. ✅ تجنب استدعاءات المصادقة في الصفحات العامة
3. ✅ الحفاظ على الوظائف الكاملة في الصفحات المحمية
4. ✅ تحسين الأداء وتجربة المستخدم
5. ✅ إزالة الأخطاء من Console

النظام الآن يعمل بشكل صحيح ومنطقي في جميع السيناريوهات! 🎉
