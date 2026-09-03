"use client";

import { useParams } from "next/navigation";
import { BusinessDiscovery } from "@/components/features/projects/BusinessDiscovery";

export default function DiscoveryPage() {
  const params = useParams();
  const projectId = (params?.projectId || params?.id) as string;

  return (
    <div>
      <BusinessDiscovery projectId={projectId} />
    </div>
  );
}
