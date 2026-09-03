"use client";

import { useParams, useRouter } from "next/navigation";
import { SolutionsGallery } from "@/components/features/projects/SolutionsGallery";

export default function SolutionsPage() {
  const params = useParams();
  const projectId = (params?.projectId || params?.id) as string;
  const workspaceId = (params?.workspaceId as string) || "";
  const router = useRouter();

  const handleTabChange = (tab: string) => {
    if (tab === "chat") {
      router.push(`/dashboard/${workspaceId}/projects/${projectId}/chat`);
    } else if (tab === "discovery") {
      router.push(`/dashboard/${workspaceId}/projects/${projectId}/discovery`);
    }
  };

  return (
    <div>
      <SolutionsGallery projectId={projectId} onTabChange={handleTabChange} />
    </div>
  );
}
