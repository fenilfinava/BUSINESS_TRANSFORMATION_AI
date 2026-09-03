"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function DashboardRootPage() {
  const router = useRouter();
  const { activeWorkspace, workspaces, isLoadingWorkspaces } = useWorkspace();

  useEffect(() => {
    if (isLoadingWorkspaces) return;

    if (activeWorkspace?.id) {
      router.replace(`/dashboard/${activeWorkspace.id}`);
    } else if (workspaces.length > 0) {
      router.replace(`/dashboard/${workspaces[0].id}`);
    } else {
      router.replace("/workspaces");
    }
  }, [activeWorkspace, workspaces, isLoadingWorkspaces, router]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
