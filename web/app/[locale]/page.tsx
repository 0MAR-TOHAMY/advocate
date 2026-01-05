/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Button from "@/components/ui/Button";
import { useParams, useRouter } from "next/navigation";

export default function Home() {
  const params = useParams();
  const lang = (params.locale as string) || "ar";
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [statsStarted, setStatsStarted] = useState(false);
  const [users, setUsers] = useState(0);
  const [cases, setCases] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    fetch("/api/plans", { credentials: "include" }).then(async (r) => {
      const d = await r.json();
      setPlans(d.plans || []);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const s = document.getElementById("stats");
      if (!s || statsStarted) return;
      const rect = s.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        setStatsStarted(true);
        let u = 0, c = 0, up = 0, r = 0;
        const i = setInterval(() => {
          u = Math.min(u + 500, 15000);
          c = Math.min(c + 25000, 750000);
          up = Math.min(up + 5, 100);
          r = Math.min(r + 0.2, 4.9);
          setUsers(u);
          setCases(c);
          setUptime(up);
          setRating(parseFloat(r.toFixed(1)));
          if (u === 15000 && c === 750000 && up === 100 && r === 4.9) clearInterval(i);
        }, 30);
      }
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [statsStarted]);

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (res.ok && data.url) window.location.href = data.url;
    } finally {
      setLoadingPlan(null);
    }
  };

  const nav = useMemo(() => [
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ], []);

  return (
    <div className="min-h-screen w-full bg-white">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <img src="/logo.png" alt="logo" className="w-28" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {nav.map(n => (
              <a key={n.label} href={n.href} className="text-gray-700 hover:text-black transition">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href={`/${lang}/login`} className="text-sm">Login</Link>
            <Link href={`/${lang}/select-mode`} className="hidden sm:block">
              <Button>Get Started</Button>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute -top-20 -left-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-24 w-96 h-96 bg-indigo-200 rounded-full blur-3xl animate-pulse" />
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Transform Your Legal Practice Today with <span className="text-blue-600">Advocate Box</span>
            </h1>
            <p className="mt-4 text-gray-600">The all-in-one platform to manage cases, collaborate, and deliver exceptional client experiences.</p>
            <div className="mt-6 flex gap-4">
              <Link href={`/${lang}/select-mode`}>
                <Button>Get Started Now</Button>
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 text-blue-600">Learn more</a>
            </div>
          </div>
          <div className="relative">
            <div className="h-72 md:h-96 rounded-2xl bg-linear-to-br from-blue-50 to-indigo-50 shadow-inner" />
            <div className="absolute inset-0 animate-[float_6s_ease_in_out_infinite]">
              <div className="absolute left-6 top-6 w-40 h-24 bg-white shadow-lg rounded-lg" />
              <div className="absolute left-24 top-32 w-48 h-28 bg-white shadow-lg rounded-lg" />
              <div className="absolute right-8 top-16 w-56 h-32 bg-white shadow-lg rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      <section id="stats" className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-6 bg-gray-50 rounded-xl text-center">
            <div className="text-3xl font-bold">+{users.toLocaleString()}</div>
            <div className="text-gray-600">users</div>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl text-center">
            <div className="text-3xl font-bold">+{cases.toLocaleString()}</div>
            <div className="text-gray-600">cases managed</div>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl text-center">
            <div className="text-3xl font-bold">{uptime.toFixed(1)}%</div>
            <div className="text-gray-600">uptime</div>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl text-center">
            <div className="text-3xl font-bold">{rating}/5</div>
            <div className="text-gray-600">users rating</div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-600 mb-3">
              <span className="inline-block w-5 h-5 bg-blue-600 rounded" />
              <span>Our strategies</span>
            </div>
            <h2 className="text-3xl font-bold">Improve your Continuous Design Data workflow</h2>
            <p className="mt-3 text-gray-600">Specify helps you gain control of your design system across teams and products.</p>
          </div>
          <div className="relative h-64 bg-linear-to-br from-blue-100 to-indigo-100 rounded-2xl" />
        </div>
      </section>

      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Plans and Pricing</h2>
            <p className="text-gray-600">Receive unlimited credits when you pay yearly, and save on your plan.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.id} className="rounded-2xl border bg-white p-6 flex flex-col justify-between">
                <div>
                  <div className="text-xl font-semibold">{p.name}</div>
                  <div className="mt-2 text-3xl font-bold">{p.price} {p.currency}</div>
                  <div className="mt-1 text-sm text-gray-600">{p.billingPeriod === 'yearly' ? 'Billed yearly' : 'Billed monthly'}</div>
                  <div className="mt-4 text-sm text-gray-700">{p.description || 'Professional features'}</div>
                </div>
                <div className="mt-6">
                  <Button full loading={loadingPlan === p.id} onClick={() => handleCheckout(p.id)}>Subscribe</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">Frequently asked questions</h2>
          <Accordion items={[
            { q: 'What is Advocate Box and how is it different?', a: 'A legal practice management platform with collaboration and automation.' },
            { q: 'Is my data secure?', a: 'We use industry standard encryption and best practices.' },
            { q: 'Can I integrate with other tools?', a: 'Yes, we support integrations and APIs for advanced use-cases.' },
            { q: 'How is the pricing structured?', a: 'Simple monthly or yearly pricing per plan.' },
          ]} />
        </div>
      </section>

      <footer className="bg-blue-50 py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold">Ready to Transform Your Practice?</h3>
          <p className="text-gray-600 mt-2">Join thousands of legal professionals who trust Advocate Box.</p>
          <div className="mt-6 inline-block">
            <Link href={`/${lang}/select-mode`}>
              <Button>Get Started Now</Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((it, idx) => (
        <div key={it.q} className="border rounded-xl">
          <button className="w-full text-left p-4 flex items-center justify-between" onClick={() => setOpen(open === idx ? null : idx)}>
            <span className="font-medium">{it.q}</span>
            <span className="text-gray-500">{open === idx ? '-' : '+'}</span>
          </button>
          {open === idx && <div className="px-4 pb-4 text-gray-600">{it.a}</div>}
        </div>
      ))}
    </div>
  );
}
