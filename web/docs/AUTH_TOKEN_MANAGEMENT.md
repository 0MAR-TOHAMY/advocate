# Authentication Token Management

## Overview
This document describes the automatic token management system implemented in the application. The system ensures that all authenticated API calls automatically check for valid tokens and refresh them when needed.

## Key Features

### 1. Automatic Token Refresh
- Access tokens are automatically refreshed 1 minute before expiration
- Default token lifetime: 15 minutes
- Refresh happens in the background without user interaction

### 2. Smart API Wrapper: `authenticatedFetch`
All authenticated API calls should use the `authenticatedFetch` method from `useAuth()` hook instead of the native `fetch`.

#### How It Works
```typescript
const { authenticatedFetch } = useAuth();

// Instead of:
const response = await fetch("/api/user/profile", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
  credentials: "include"
});

// Use:
const response = await authenticatedFetch("/api/user/profile", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
});
```

#### What `authenticatedFetch` Does
1. **Ensures credentials are included**: Automatically adds `credentials: "include"` to all requests
2. **Makes the API call**: Attempts the request with the current access token
3. **Checks for 401 (Unauthorized)**: If the token is expired
4. **Refreshes the token**: Calls `/api/auth/refresh` to get a new access token
5. **Retries the request**: Automatically retries the original request with the new token
6. **Returns the response**: Returns the final response to the caller

### 3. Token Refresh Flow

```
User makes API call
    ↓
authenticatedFetch()
    ↓
First attempt with current token
    ↓
Response 401? ──No──→ Return response
    ↓ Yes
Refresh access token
    ↓
Success? ──No──→ Redirect to login
    ↓ Yes
Retry original request
    ↓
Return response
```

### 4. Automatic Background Refresh
In addition to on-demand refresh, tokens are proactively refreshed:
- Interval set to (token lifetime - 1 minute)
- For 15-minute tokens: refreshes every 14 minutes
- Prevents token expiration during user activity
- Runs silently in the background

## Implementation Details

### AuthContext Structure
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}
```

### Usage in Components

#### Basic Usage
```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { authenticatedFetch } = useAuth();

  async function updateData() {
    const response = await authenticatedFetch("/api/endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: "value" })
    });

    if (response.ok) {
      const data = await response.json();
      // Handle success
    }
  }
}
```

#### With Error Handling
```typescript
async function saveProfile() {
  try {
    const response = await authenticatedFetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    const data = await response.json();
    // Handle success
  } catch (error) {
    // Handle error
    console.error("Update failed:", error);
  }
}
```

## Benefits

### For Developers
- **No manual token management**: Forget about checking token expiration
- **Consistent API calls**: Single method for all authenticated requests
- **Automatic retry logic**: Failed requests are automatically retried after refresh
- **Type-safe**: Full TypeScript support

### For Users
- **Seamless experience**: No interruptions due to expired tokens
- **Stay logged in**: Automatic refresh keeps sessions alive
- **No unexpected logouts**: Tokens refresh before expiration
- **Fast responses**: Proactive refresh prevents delays

## Security Considerations

1. **Refresh Token Storage**: Refresh tokens are stored in HTTP-only cookies
2. **Access Token Lifetime**: Short-lived (15 minutes) for security
3. **Automatic Logout**: If refresh fails, user is redirected to login
4. **Credentials Included**: All requests include credentials for cookie-based auth

## Configuration

### Token Expiration Time
Set in environment variables:
```env
JWT_ACCESS_EXPIRES=15m  # Access token lifetime
JWT_REFRESH_EXPIRES=7d  # Refresh token lifetime
```

### Client-Side Configuration
For the automatic refresh interval to work correctly, expose the access token lifetime:
```env
NEXT_PUBLIC_JWT_ACCESS_EXPIRES=15m
```

## API Endpoints

### `/api/auth/refresh` (POST)
Refreshes the access token using the refresh token from cookies.

**Request**: No body required (uses HTTP-only cookie)

**Response**:
```json
{
  "message": "Token refreshed"
}
```

**Cookies Set**:
- `access_token`: New access token (HTTP-only)
- `refresh_token`: New refresh token (HTTP-only)

## Migration Guide

### Updating Existing Code

**Before:**
```typescript
const response = await fetch("/api/user/profile", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
  credentials: "include"
});
```

**After:**
```typescript
const { authenticatedFetch } = useAuth();

const response = await authenticatedFetch("/api/user/profile", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
});
```

### Checklist
- [ ] Import `useAuth` hook
- [ ] Destructure `authenticatedFetch`
- [ ] Replace `fetch` with `authenticatedFetch`
- [ ] Remove `credentials: "include"` (automatically added)
- [ ] Test the API call

## Troubleshooting

### Token Not Refreshing
1. Check that refresh token exists in cookies
2. Verify `/api/auth/refresh` endpoint is working
3. Check browser console for error messages
4. Ensure `REDIS_URL` is configured correctly

### Infinite Redirect Loop
1. Check that login endpoint sets cookies correctly
2. Verify refresh token is valid in Redis
3. Check token expiration times

### 401 Errors Still Occurring
1. Ensure you're using `authenticatedFetch` instead of `fetch`
2. Check that the endpoint requires authentication
3. Verify the access token is being sent in cookies

## Best Practices

1. **Always use `authenticatedFetch`** for authenticated endpoints
2. **Don't manually manage tokens** - let the context handle it
3. **Handle errors gracefully** - the system will redirect on auth failure
4. **Test token expiration** - set short expiration times in development
5. **Monitor refresh calls** - check browser console for refresh logs

## Example: Complete Component

```typescript
"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileEditor() {
  const { user, authenticatedFetch, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || "");

  async function handleSave() {
    setLoading(true);
    try {
      const response = await authenticatedFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // Optimistic update
      updateUser({ name });
      
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
      <button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
```

## Summary

The authentication token management system provides:
- ✅ Automatic token refresh before expiration
- ✅ Smart retry logic for expired tokens
- ✅ Seamless user experience
- ✅ Simple developer API
- ✅ Type-safe implementation
- ✅ Secure token handling

Use `authenticatedFetch` for all authenticated API calls and let the system handle the rest!
