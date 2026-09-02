"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, Shield, UserPlus, X } from "lucide-react";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TeamPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    async function fetchTeam() {
      if (!workspaceId) return;
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      try {
        const res = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}/team`, {
          headers: {
            'Authorization': session ? `Bearer ${session.access_token}` : ''
          }
        });
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(data);
        }
      } catch (err) {
        console.error("Failed to fetch team members:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeam();
  }, [workspaceId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    
    // Wire the API call. Since it doesn't exist yet we will log and mock it.
    console.log(`Inviting ${inviteEmail} to workspace ${workspaceId}`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Uncomment and use when API is ready
      /*
      await fetch(`http://localhost:8000/api/workspaces/${workspaceId}/team/invite`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      */
      
      // Simulating network delay
      await new Promise(r => setTimeout(r, 800));
      alert(`Invitation sent to ${inviteEmail}`);
      setIsInviteModalOpen(false);
      setInviteEmail("");
    } catch (err) {
      console.error("Invite failed", err);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage access and roles for your workspace members.</p>
        </div>
        <motion.button 
          onClick={() => setIsInviteModalOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30"
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 relative z-10 w-full max-w-md"
            >
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="mb-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <UserPlus size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Invite Team Member</h2>
                <p className="text-slate-500 text-sm mt-1">Send an invitation link to collaborate on this workspace.</p>
              </div>
              
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
                <div className="pt-2">
                  <motion.button 
                    disabled={isInviting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent shadow-lg shadow-blue-500/30 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
                  >
                    {isInviting ? "Sending Invite..." : "Send Invitation"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-5">
        {isLoading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading team members...</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Users size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Team Members Found</h3>
            <p className="text-slate-500 max-w-sm mb-6">This workspace doesn't have any invited members yet. Invite members to collaborate.</p>
            <motion.button 
              onClick={() => setIsInviteModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              Invite Your First Member
            </motion.button>
          </div>
        ) : (
          teamMembers.map((member, i) => (
            <motion.div 
              key={member.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2, scale: 1.01 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-5">
                <div className={`h-14 w-14 bg-gradient-to-br ${member.color || 'from-blue-500 to-indigo-600'} rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:scale-110 transition-transform`}>
                  {(member.name || member.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{member.name || 'Unknown User'}</h3>
                  <div className="flex items-center text-sm text-slate-500 mt-1 space-x-3">
                    <span className="flex items-center"><Mail size={14} className="mr-1.5 text-slate-400" /> {member.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200">
                  <Shield size={14} className="mr-2 text-blue-500" /> {member.role || 'Member'}
                </span>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-blue-600 hover:bg-blue-50 font-bold text-sm px-4 py-2 rounded-xl transition-colors"
                >
                  Edit
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
