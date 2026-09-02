"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HistoryRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      try {
        const { data: workspaces } = await supabase.from("workspaces").select("id").limit(1);
        if (workspaces && workspaces.length > 0) {
          router.replace(`/dashboard/${workspaces[0].id}/history`);
          return;
        }
      } catch (e) {
        console.error("Workspace redirect error:", e);
      }
      router.replace("/dashboard/1/history");
    }
    redirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
