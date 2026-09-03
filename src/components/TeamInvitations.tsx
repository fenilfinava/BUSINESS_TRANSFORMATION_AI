'use client';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Bell, Shield, FolderGit2 } from 'lucide-react';

export function TeamInvitations() {
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchInvites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;

    try {
      // Fetch pending invites matching user's email without table join to avoid RLS recursion
      const { data, error } = await supabase
        .from('project_members')
        .select('id, role, project_id')
        .eq('email', user.email)
        .eq('status', 'pending');

      if (!error && data && data.length > 0) {
        const projectIds = data.map(d => d.project_id);
        const { data: projData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);

        const projMap = new Map((projData || []).map(p => [p.id, p.name]));
        const formatted = data.map(d => ({
          ...d,
          projects: { id: d.project_id, name: projMap.get(d.project_id) || "Project" }
        }));
        setInvites(formatted);
      } else {
        setInvites([]);
      }
    } catch (err) {
      console.warn("Could not fetch team invitations safely:", err);
      setInvites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleAccept = async (inviteId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('project_members')
      .update({ status: 'accepted', user_id: user.id })
      .eq('id', inviteId);

    if (error) {
      alert("Failed to accept invitation.");
    } else {
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
      router.refresh();
    }
  };

  const handleDeny = async (inviteId: string) => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', inviteId);

    if (error) {
      alert("Failed to decline invitation.");
    } else {
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
    }
  };

  if (isLoading || invites.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-8 shadow-sm"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-blue-600 text-white p-2 rounded-xl">
          <Bell size={20} />
        </div>
        <h3 className="text-lg font-bold text-blue-900 tracking-tight">
          Pending Invitations ({invites.length})
        </h3>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
        <AnimatePresence>
          {invites.map((invite) => {
            // @ts-ignore
            const projectName = invite.projects?.name || "Unknown Project";
            
            return (
              <motion.div 
                key={invite.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between border border-blue-100 shadow-sm hover:shadow-md transition-shadow gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    You've been invited to join <span className="font-bold text-blue-700">{projectName}</span>
                  </p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="flex items-center text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-wider">
                      <Shield size={12} className="mr-1.5 text-blue-500" />
                      {invite.role}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2 shrink-0">
                  <button
                    onClick={() => handleAccept(invite.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm hover:shadow-emerald-500/20"
                  >
                    <Check size={16} />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleDeny(invite.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-200 hover:text-slate-900 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
