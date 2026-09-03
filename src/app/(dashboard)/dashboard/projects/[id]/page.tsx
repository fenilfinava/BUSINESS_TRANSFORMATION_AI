"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Layers, MessageSquare, Search, FileText, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { deleteProjectAction } from "@/app/actions/deleteProject";
import { ProjectOverview } from "@/components/features/projects/ProjectOverview";
import { BusinessDiscovery } from "@/components/features/projects/BusinessDiscovery";
import { AiChatInterface } from "@/components/features/projects/AiChatInterface";
import { SolutionsGallery } from "@/components/features/projects/SolutionsGallery";

type TabKey = "overview" | "discovery" | "chat" | "solutions";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = (params?.id || params?.projectId) as string;
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteProject = async () => {
    if (!project) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const supabase = createClient();
      // Step 1: Explicitly clear membership rows first to prevent cascading RLS policy traps
      const { error: memberError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', project.id);

      if (memberError) {
        console.warn("Could not clear project members, proceeding to delete project:", memberError.message);
      }

      // Step 2: Delete the project itself
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (projectError) {
        console.warn("Direct client deletion hit policy barrier, invoking server action fallback:", projectError.message);
        await deleteProjectAction(project.id);
      }

      if (project.workspace_id) {
        router.push(`/dashboard/${project.workspace_id}/projects`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Error deleting project:", err);
      setDeleteError(err.message || "Failed to delete project.");
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      setIsLoading(true);
      const supabase = createClient();

      try {
        // 1. Fetch real project details
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (error) {
          console.error("Error fetching project:", error);
          setProject(null);
        } else {
          setProject(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching project:", err);
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="p-16 text-center max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Loading project workspace...</h3>
        <p className="text-slate-500 text-sm mt-1">Retrieving project architecture and status</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-16 text-center max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <AlertCircle size={40} className="text-amber-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-slate-800">Project Not Found</h3>
        <p className="text-slate-500 text-sm mt-1">
          No project matching ID <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{projectId}</code> was found.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-5 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "discovery", label: "Discovery", icon: Search },
    { key: "chat", label: "AI Chat", icon: MessageSquare },
    { key: "solutions", label: "Solutions", icon: Layers },
  ];

  const displayBadgeId =
    project.id && project.id.length > 8
      ? `PRJ-${project.id.slice(0, 8).toUpperCase()}`
      : `PRJ-${project.id || ""}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-slate-500">
        <Link
          href={project.workspace_id ? `/dashboard/${project.workspace_id}` : "/dashboard"}
          className="hover:text-slate-900 transition-colors flex items-center space-x-1"
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">{project.name}</span>
      </div>

      {/* Dynamic Project Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-8 rounded-3xl shadow-xl border border-blue-800 text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3 py-0.5 rounded-lg text-xs font-mono font-medium tracking-wide">
                {displayBadgeId}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{project.status || "In Progress"}</span>
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
              {project.name}
            </h1>

            {project.description && (
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 size={16} />
              <span>Delete Project</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="relative z-10 mt-8">
          <nav className="flex space-x-2 overflow-x-auto bg-black/25 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-blue-900 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dynamic Tab Content Sections */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <ProjectOverview projectId={project.id} onTabChange={(tab) => setActiveTab(tab as TabKey)} />
        )}
        {activeTab === "discovery" && <BusinessDiscovery projectId={project.id} />}
        {activeTab === "chat" && (
          <AiChatInterface projectId={project.id} workspaceId={project.workspace_id} />
        )}
        {activeTab === "solutions" && (
          <SolutionsGallery projectId={project.id} onTabChange={(tab) => setActiveTab(tab as TabKey)} />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900">Delete Project</h3>
            <p className="text-slate-600 text-sm mt-2">
              Are you sure you want to delete <strong>{project.name}</strong>? All associated blueprints and discovery data will be permanently removed.
            </p>

            {deleteError && (
              <div className="mt-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProject}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/20 flex items-center cursor-pointer"
              >
                {isDeleting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                )}
                {isDeleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
