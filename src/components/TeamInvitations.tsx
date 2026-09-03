'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Bell, Shield, FolderGit2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PendingInvite {
  id: string;
  project_id: string;
  projectName: string;
  workspaceId: string | null;
  workspaceName: string;
  role: string;
  email: string;
  created_at: string;
}

export function TeamInvitations() {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchInvites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/invitations/pending', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
      } else {
        setInvites([]);
      }
    } catch (err) {
      console.warn("Could not fetch team invitations:", err);
      setInvites([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleAction = async (inviteId: string, action: 'accept' | 'deny', workspaceId?: string | null, projectId?: string) => {
    setActionLoading(inviteId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/invitations/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ inviteId, action })
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || `Failed to ${action} invitation.`);
      } else {
        setInvites(prev => prev.filter(inv => inv.id !== inviteId));
        if (action === 'accept' && workspaceId && projectId) {
          router.push(`/dashboard/${workspaceId}/projects/${projectId}`);
        } else {
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error(`Error responding to invite (${action}):`, err);
      alert(`Failed to ${action} invitation.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading || invites.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-5 mb-8 shadow-xl shadow-blue-500/10 border border-blue-400/30"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-white/20 backdrop-blur-md text-white p-2 rounded-xl">
          <Bell size={20} className="animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight">
            Pending Team Invitations ({invites.length})
          </h3>
          <p className="text-xs text-blue-100 mt-0.5">
            You've been invited to collaborate on projects across enterprise workspaces.
          </p>
        </div>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
        <AnimatePresence>
          {invites.map((invite) => {
            const isProcessing = actionLoading === invite.id;

            return (
              <motion.div 
                key={invite.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white text-slate-900 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between border border-white/20 shadow-md gap-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Join project <span className="font-bold text-blue-700">{invite.projectName}</span>
                  </p>
                  <div className="flex items-center mt-1.5 space-x-3 text-xs text-slate-500">
                    <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      Workspace: {invite.workspaceName}
                    </span>
                    <span className="flex items-center font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                      <Shield size={11} className="mr-1 text-blue-600" />
                      {invite.role}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2 shrink-0">
                  <button
                    onClick={() => handleAction(invite.id, 'accept', invite.workspaceId, invite.project_id)}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition shadow-sm hover:shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Check size={16} />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleAction(invite.id, 'deny')}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-sm font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                    title="Decline"
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
