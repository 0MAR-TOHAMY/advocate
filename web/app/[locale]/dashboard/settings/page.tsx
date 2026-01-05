"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Loader from "@/components/ui/Loader";

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  useEffect(() => {
    router.replace(`/${locale}/dashboard/settings/firm`);
  }, [router, locale]);

  return (
    <div className="flex justify-center py-20">
      <Loader />
    </div>
  );
}
