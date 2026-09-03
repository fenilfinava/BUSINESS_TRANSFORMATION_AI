"use client";

import Link from "next/link";
import { PlusCircle, Activity, FileText, CheckCircle, Users } from "lucide-react";
import { motion } from "framer-motion";
import { use, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { TeamInvitations } from "@/components/TeamInvitations";
import { useWorkspace } from "@/context/WorkspaceContext";
import { sanitizeError } from "@/utils/errorHandler";

export default function WorkspaceDashboard(
  props: { params: Promise<{ workspaceId: string }> }
) {
  const params = use(props.params);
  const { activeWorkspace } = useWorkspace();
  const targetWorkspaceId = activeWorkspace?.id || params.workspaceId;
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<any>({
    active_projects: 0,
    ai_recommendations: 0,
    completed_milestones: 0,
    team_members: 0
  });

  useEffect(() => {
    async function loadProjectsDirectly() {
      setLoading(true);
      try {
        // 1. Get current logged-in user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setErrorMessage("User not authenticated.");
          setLoading(false);
          return;
        }

        // 2. Direct raw fetch from projects table without table joins
        let loadedProjects: any[] = [];
        let query = supabase.from('projects').select('*');
        if (targetWorkspaceId) {
          query = query.eq('workspace_id', targetWorkspaceId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          loadedProjects = data;
        } else {
          if (error) {
            console.warn("Supabase direct projects query error, activating resilient backend fallback:", error.message);
          }
          // Secondary fallback: fetch projects via backend API to bypass any database recursion errors
          if (targetWorkspaceId) {
            const { data: { session } } = await supabase.auth.getSession();
            try {
              const res = await fetch(`http://localhost:8000/api/workspaces/${targetWorkspaceId}/projects`, {
                headers: {
                  Authorization: session ? `Bearer ${session.access_token}` : ''
                }
              });
              if (res.ok) {
                const backendProjects = await res.json();
                if (backendProjects && Array.isArray(backendProjects) && backendProjects.length > 0) {
                  loadedProjects = backendProjects;
                }
              }
            } catch (fallbackErr) {
              console.error("Backend projects fallback error:", fallbackErr);
            }
          }
        }

        setProjects(loadedProjects);
      } catch (err: any) {
        console.error("UNCAUGHT FETCH EXCEPTION:", err);
        setErrorMessage(sanitizeError(err, "Failed to load projects."));
      } finally {
        setLoading(false);
      }
    }

    loadProjectsDirectly();
  }, [targetWorkspaceId]);

  useEffect(() => {
    if (!targetWorkspaceId) return;

    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      try {
        const statsRes = await fetch(`http://localhost:8000/api/workspaces/${targetWorkspaceId}/stats`, { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats((prev: any) => ({
            ...statsData,
            active_projects: projects.length || statsData.active_projects || 0
          }));
        }
      } catch (err) {
        console.error("Dashboard stats load error:", err);
      }
    }
    loadStats();
  }, [targetWorkspaceId, projects.length]);

  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Here is what's happening with your transformation initiatives.</p>
        </div>
        <Link href={`/dashboard/${params.workspaceId}/projects/new`} passHref>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer shadow-sm"
          >
            <PlusCircle size={18} />
            <span>New Project</span>
          </motion.div>
        </Link>
      </div>

      <TeamInvitations />
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
          <strong>Database Error:</strong> {errorMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Projects", value: stats.active_projects || "0", icon: Activity, color: "text-blue-500", glow: "shadow-blue-500/20" },
          { label: "AI Recommendations", value: stats.ai_recommendations || "0", icon: FileText, color: "text-purple-500", glow: "shadow-purple-500/20" },
          { label: "Completed Milestones", value: stats.completed_milestones || "0", icon: CheckCircle, color: "text-emerald-500", glow: "shadow-emerald-500/20" },
          { label: "Team Members", value: stats.team_members || "0", icon: Users, color: "text-orange-500", glow: "shadow-orange-500/20" }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className={`bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl ${stat.glow} flex flex-col justify-between cursor-pointer relative overflow-hidden group`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white to-transparent opacity-50 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-3.5 rounded-2xl bg-white shadow-sm border border-slate-100 ${stat.color}`}>
                <stat.icon size={22} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100/50 px-2 py-1 rounded-lg">All Time</span>
            </div>
            
            <div className="mt-6 relative z-10">
              <h3 className="text-4xl font-black text-slate-800 tracking-tight">{stat.value}</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Projects List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Recent Projects</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentProjects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 font-medium">No projects yet.</p>
              <p className="text-sm text-slate-400 mt-1">Create your first transformation project to get started.</p>
            </div>
          ) : (
            recentProjects.map((project) => (
              <Link href={`/dashboard/${targetWorkspaceId}/projects/${project.id}`} key={project.id} passHref>
                <motion.div 
                  whileHover={{ backgroundColor: "rgba(248, 250, 252, 1)", x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  className="p-6 flex items-center justify-between cursor-pointer block"
                >
                  <div>
                    <h3 className="text-md font-medium text-slate-900">{project.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{project.description || 'No description'}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                        project.status === 'Planning' ? 'bg-amber-100 text-amber-800' : 
                        'bg-green-100 text-green-800'}`}
                    >
                      {project.status || 'Planning'}
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
