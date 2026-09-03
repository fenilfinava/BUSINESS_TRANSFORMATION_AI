"use client";

import Link from "next/link";
import { PlusCircle, Search, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/context/WorkspaceContext";
import { deleteProjectAction } from "@/app/actions/deleteProject";

export default function ProjectsListPage() {
  const params = useParams();
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id || (params?.workspaceId as string);

  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [deletingProject, setDeletingProject] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjectsDirectly() {
      setIsLoading(true);
      try {
        // 1. Get current logged-in user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setErrorMessage("User not authenticated.");
          setIsLoading(false);
          return;
        }

        // Safe, isolated project fetch that cannot trigger project_members recursion
        let loadedProjects: any[] = [];
        let query = supabase.from('projects').select('*');
        if (workspaceId) {
          query = query.eq('workspace_id', workspaceId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
          loadedProjects = data;
          setErrorMessage(null);
        } else {
          if (error) {
            console.error("Project fetch error:", error.message);
            setErrorMessage(error.message);
          }
          // Secondary fallback: fetch projects via backend API to bypass any database recursion errors
          if (workspaceId) {
            const { data: { session } } = await supabase.auth.getSession();
            try {
              const res = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}/projects`, {
                headers: {
                  Authorization: session ? `Bearer ${session.access_token}` : ''
                }
              });
              if (res.ok) {
                const backendProjects = await res.json();
                if (backendProjects && Array.isArray(backendProjects)) {
                  loadedProjects = backendProjects;
                  setErrorMessage(null);
                }
              }
            } catch (fallbackErr) {
              console.error("Backend projects fallback error:", fallbackErr);
            }
          }
        }

        setAllProjects(loadedProjects);
      } catch (err: any) {
        console.error("UNCAUGHT FETCH EXCEPTION:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProjectsDirectly();
  }, [workspaceId]);

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    setDeleteError(null);
    const projectId = deletingProject.id;

    try {
      // Step 1: Explicitly clear membership rows first to prevent cascading RLS policy traps
      const { error: memberError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId);

      if (memberError) {
        console.warn("Could not clear project members, proceeding to delete project:", memberError.message);
      }

      // Step 2: Delete the project itself
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (projectError) {
        console.warn("Direct client deletion hit policy barrier, invoking server action fallback:", projectError.message);
        // Step 3: Server Action fallback with service role client
        await deleteProjectAction(projectId);
      }

      setAllProjects(prev => prev.filter(p => p.id !== projectId));
      setDeletingProject(null);
    } catch (err: any) {
      console.error("Deletion failed:", err);
      setDeleteError(err.message || "Failed to delete project.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Projects</h1>
          <p className="text-slate-500 mt-1">Manage and view all your transformation initiatives.</p>
        </div>
        <Link href={`/dashboard/${workspaceId}/projects/new`} passHref>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer"
          >
            <PlusCircle size={18} />
            <span>New Project</span>
          </motion.div>
        </Link>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
          <strong>Database Error:</strong> {errorMessage}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
            />
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Project Name</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading projects...
                </td>
              </tr>
            ) : allProjects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="bg-slate-50 p-6 rounded-2xl inline-block border border-slate-200">
                    <p className="text-slate-500 font-medium">No projects found in this workspace.</p>
                    <p className="text-sm text-slate-400 mt-1">Create your first transformation project to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              allProjects.map((proj, i) => (
                <motion.tr 
                  key={proj.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ backgroundColor: "#f8fafc" }}
                  className="transition-colors group"
                >
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/${workspaceId}/projects/${proj.id}`} passHref>
                      <motion.div whileHover={{ x: 4 }} className="font-semibold text-blue-600 group-hover:text-blue-700 cursor-pointer inline-block">
                        {proj.name}
                      </motion.div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${proj.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                        proj.status === 'Planning' ? 'bg-amber-100 text-amber-800' : 
                        'bg-green-100 text-green-800'}`}
                    >
                      {proj.status || 'Planning'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm truncate max-w-xs">{proj.description || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setDeletingProject(proj)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Delete Project Confirmation Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200"
          >
            <h3 className="text-xl font-bold text-slate-900">Delete Project</h3>
            <p className="text-slate-600 text-sm mt-2">
              Are you sure you want to delete project <strong>{deletingProject.name}</strong>? All associated blueprints and discovery data will be permanently removed.
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
                  setDeletingProject(null);
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
          </motion.div>
        </div>
      )}
    </div>
  );
}
