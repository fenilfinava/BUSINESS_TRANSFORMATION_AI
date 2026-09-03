import { ReactNode } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function ProjectLayout(
  props: { children: ReactNode, params: Promise<{ workspaceId: string, projectId: string }> }
) {
  const params = await props.params;

  // Fetch real project details from Supabase
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.projectId)
    .single();

  const projectName = project?.name || "Transformation Project";
  const projectStatus = project?.status || "In Progress";
  const displayId = params.projectId && params.projectId.length > 8 
    ? `PRJ-${params.projectId.slice(0, 8).toUpperCase()}` 
    : `PRJ-${(params.projectId || "").padStart(4, '0')}`;

  const tabs = [
    { name: "Overview", href: `/dashboard/${params.workspaceId}/projects/${params.projectId}` },
    { name: "Discovery", href: `/dashboard/${params.workspaceId}/projects/${params.projectId}/discovery` },
    { name: "AI Chat", href: `/dashboard/${params.workspaceId}/projects/${params.projectId}/chat` },
    { name: "Solutions", href: `/dashboard/${params.workspaceId}/projects/${params.projectId}/solutions` },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-8 rounded-2xl shadow-xl border border-blue-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center space-x-3 mb-3">
              <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium tracking-wide">
                {displayId}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{projectStatus}</span>
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">{projectName}</h1>
            {project?.description && (
              <p className="text-slate-300 text-sm mt-2 max-w-2xl">{project.description}</p>
            )}
          </div>
        </div>
        
        <div className="relative z-10 mt-8">
          <nav className="flex space-x-2 overflow-x-auto bg-black/20 p-1.5 rounded-xl backdrop-blur-md border border-white/10 w-max">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className="whitespace-nowrap px-5 py-2.5 rounded-lg font-medium text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      
      <div>
        {props.children}
      </div>
    </div>
  );
}
