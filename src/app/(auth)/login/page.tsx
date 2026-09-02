"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LoginForm } from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/workspaces");
      }
    });
  }, [router]);

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-slate-900 text-center">Welcome Back</h3>
        <p className="text-slate-500 text-center mt-2 text-sm">Sign in to continue to your workspace.</p>
      </div>
      <LoginForm />
    </div>
  );
}
