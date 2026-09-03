"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, Shield, UserPlus, X, Trash2, Clock, CheckCircle2, FolderGit2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function TeamPage() {
  const params = useParams();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = (activeWorkspace?.id || params?.workspaceId) as string;

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [availableProjects, setAvailableProjects] = useState<{ id: string, name: string }[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspaceProjects = async () => {
      if (!workspaceId) {
        setAvailableProjects([]);
        setIsLoadingProjects(false);
        return;
      }

      setIsLoadingProjects(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching projects for invite:", error);
        }
        
        if (data && data.length > 0) {
          setAvailableProjects(data);
        } else {
          // Fallback to backend API if direct query returns empty
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}/projects`, {
            headers: {
              Authorization: session ? `Bearer ${session.access_token}` : ''
            }
          });
          if (res.ok) {
            const backendData = await res.json();
            setAvailableProjects(backendData || []);
          } else {
            setAvailableProjects([]);
          }
        }
      } catch (err) {
        console.error("Error in fetchWorkspaceProjects:", err);
        setAvailableProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchWorkspaceProjects();
  }, [workspaceId, isInviteModalOpen]);

  const fetchTeamAndProjects = async () => {
    if (!workspaceId) return;
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      // 1. Fetch ALL projects this user has access to (owned + shared)
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name, workspace_id");

      if (projectsData && projectsData.length > 0) {
        setAvailableProjects(projectsData);
      }

      // 2. Fetch invites and members from Next.js API
      const res = await fetch(`/api/invitations?workspaceId=${workspaceId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });

      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.members || []);
      } else {
        console.warn("Could not fetch from /api/invitations, falling back to direct query");
        
        // Fetch ALL members the user can see (RLS will filter to owned projects + shared project members)
        const { data: directMembers } = await supabase
          .from("project_members")
          .select("id, project_id, email, status, role, user_id, created_at, projects!inner(id, name, workspace_id)")
          .order("created_at", { ascending: false });

        setTeamMembers(directMembers || []);
      }
    } catch (err) {
      console.error("Failed to fetch team members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAndProjects();
  }, [workspaceId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      let targetProjectIds: string[] = [];
      if (selectedProjectId === "all") {
        targetProjectIds = availableProjects.map((p) => p.id);
        if (targetProjectIds.length === 0) {
          throw new Error("No projects found in this workspace. Please create a project first before inviting members.");
        }
      } else {
        targetProjectIds = [selectedProjectId];
      }

      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          email: inviteEmail,
          projectIds: targetProjectIds,
          role: inviteRole
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to send invitation.");
      }

      setInviteSuccess(`Invitation successfully sent to ${inviteEmail}!`);
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteEmail("");
        setInviteSuccess(null);
        setSelectedProjectId("all");
        setInviteRole("viewer");
      }, 1200);

      // Refresh list
      fetchTeamAndProjects();
    } catch (err: any) {
      console.error("Invite error:", err);
      setInviteError(err.message || "Failed to invite member.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!window.confirm(`Revoke invitation / remove member ${memberEmail}?`)) return;

    setDeletingId(memberId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      const res = await fetch(`/api/invitations?id=${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove member.");
      }

      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      console.error("Error removing member:", err);
      alert(err.message || "Failed to remove member.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage access, invitations, and project roles for your workspace collaborators.</p>
        </div>
        <motion.button 
          onClick={() => {
            setInviteError(null);
            setInviteSuccess(null);
            setIsInviteModalOpen(true);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={18} />
          <span>Invite Member</span>
        </motion.button>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 md:p-8 relative z-10 w-full max-w-lg"
            >
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              
              <div className="mb-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <UserPlus size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Invite Team Member</h2>
                <p className="text-slate-500 text-sm mt-1">Send a collaboration invite for projects in this workspace.</p>
              </div>

              {inviteError && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-sm flex items-center space-x-2 font-medium">
                  <AlertCircle size={18} />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteSuccess && (
                <div className="mb-4 bg-emerald-50 text-emerald-600 p-3 rounded-xl border border-emerald-100 text-sm flex items-center space-x-2 font-semibold">
                  <CheckCircle2 size={18} />
                  <span>{inviteSuccess}</span>
                </div>
              )}
              
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com" 
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Assign to Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    disabled={isLoadingProjects || availableProjects.length === 0}
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 sm:text-sm font-medium disabled:opacity-60"
                  >
                    {isLoadingProjects ? (
                      <option value="">Loading workspace projects...</option>
                    ) : availableProjects.length === 0 ? (
                      <option value="">No projects found in this workspace</option>
                    ) : (
                      <>
                        <option value="all">All Projects in this Workspace ({availableProjects.length})</option>
                        {availableProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Role Permissions</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 sm:text-sm font-medium"
                  >
                    <option value="viewer">Viewer — Read-only access to blueprints</option>
                    <option value="editor">Editor — Can run AI generators & edit</option>
                    <option value="admin">Admin — Full project management</option>
                  </select>
                </div>

                <div className="pt-3">
                  <motion.button 
                    disabled={isInviting || !!inviteSuccess}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent shadow-lg shadow-blue-500/30 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isInviting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : null}
                    {isInviting ? "Sending Invite..." : "Send Invitation"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Members List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading workspace team members...</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Users size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Team Members Found</h3>
            <p className="text-slate-500 max-w-sm mb-6">This workspace doesn't have any invited members yet. Invite members to collaborate on your projects.</p>
            <motion.button 
              onClick={() => setIsInviteModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-500/20"
            >
              Invite Your First Member
            </motion.button>
          </div>
        ) : (
          teamMembers.map((member, i) => {
            const isPending = member.status === "pending";
            const projectName = member.projects?.name || "Project";
            const initial = (member.email || "?").charAt(0).toUpperCase();

            return (
              <motion.div 
                key={member.id} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`h-12 w-12 ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-blue-600 text-white'} rounded-2xl flex items-center justify-center font-black text-lg shadow-sm`}>
                    {initial}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900">{member.email}</h3>
                      {isPending ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <Clock size={12} className="mr-1" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={12} className="mr-1" />
                          Accepted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-slate-500 mt-1 space-x-3">
                      <span className="flex items-center text-slate-600 font-medium">
                        <FolderGit2 size={13} className="mr-1 text-slate-400" /> {projectName}
                      </span>
                      <span>•</span>
                      <span>Invited {new Date(member.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <span className="flex items-center bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 uppercase tracking-wider">
                    <Shield size={13} className="mr-1.5 text-blue-500" /> {member.role || "viewer"}
                  </span>
                  <button 
                    disabled={deletingId === member.id}
                    onClick={() => handleRemoveMember(member.id, member.email)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    title={isPending ? "Revoke Invite" : "Remove Member"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
