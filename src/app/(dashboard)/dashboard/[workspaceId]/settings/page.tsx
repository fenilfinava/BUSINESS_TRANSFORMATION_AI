"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle2, User, Building, Cpu, Shield } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/context/WorkspaceContext";

const formatName = (name?: string) => {
  if (!name) return "";
  return name.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
};

export default function SettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        setUserName(formatName(user.user_metadata?.full_name || ""));
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;
    if (confirmName !== activeWorkspace.name) {
      setDeleteError("Workspace name confirmation does not match.");
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', activeWorkspace.id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error("Permission denied: Database RLS policy prevented deleting this workspace.");
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Delete Workspace Error:", err);
      setDeleteError(err.message || "Failed to delete workspace.");
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    setErrorMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No authenticated user.");

      // 1. Update Workspace in Supabase
      if (activeWorkspace) {
        const { error: wsError } = await supabase
          .from('workspaces')
          .update({ name: workspaceName })
          .eq('id', activeWorkspace.id)
          .eq('owner_id', user.id);

        if (wsError) {
          throw new Error("Workspace save failed: " + wsError.message);
        }
      }

      // 2. Update Auth Profile metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: { full_name: userName }
      });

      if (userError) {
        throw new Error("Profile save failed: " + userError.message);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      console.error("Settings Update Error:", err);
      setErrorMsg(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-slate-500 mt-2 text-lg">Manage user info, workspace configuration, and AI preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium border border-red-100">
            {errorMsg}
          </div>
        )}
        
        {/* User Info Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><User size={20} /></div>
            <h2 className="text-xl font-bold text-slate-800">User Information</h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input required type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Enter your name" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input required type="email" value={userEmail} disabled className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                <input disabled type="text" defaultValue="Enterprise Admin" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Workspace Config */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <div className="bg-purple-100 p-2 rounded-xl text-purple-600"><Building size={20} /></div>
            <h2 className="text-xl font-bold text-slate-800">Workspace Details</h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Workspace Name</label>
                <input required type="text" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} placeholder="Workspace Name" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Industry Focus</label>
                <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Manufacturing</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Preferences */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><Cpu size={20} /></div>
            <h2 className="text-xl font-bold text-slate-800">AI Engine Preferences</h2>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Default Solution Engine</label>
              <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Enterprise AI Brain (Recommended)</option>
                <option>Gemini 1.5 Pro</option>
                <option>Custom Fine-tuned Model</option>
              </select>
              <p className="mt-2 text-sm text-slate-500">Determines which model powers the Solution Architecture Builder.</p>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-50/50 rounded-3xl border border-red-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-red-100 flex items-center space-x-3 bg-red-100/50">
            <div className="bg-red-500/10 p-2 rounded-xl text-red-600">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-bold text-red-900">Danger Zone</h2>
          </div>
          <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Workspace</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                Permanently delete workspace <strong>{activeWorkspace?.name}</strong> and all associated projects, blueprints, and data. This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-red-500/20 whitespace-nowrap self-start md:self-auto cursor-pointer"
            >
              Delete Workspace
            </button>
          </div>
        </motion.div>
        
        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 pb-10">
          {saved && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-semibold"
            >
              <CheckCircle2 size={18} className="mr-2" />
              Settings Saved Successfully
            </motion.div>
          )}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSaving}
            type="submit"
            className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 cursor-pointer"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Configuration"}
          </motion.button>
        </div>
      </form>

      {/* Delete Workspace Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200"
          >
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Workspace</h3>
            <p className="text-slate-600 text-sm mt-2">
              This action is permanent and will delete all projects and blueprints in <strong>{activeWorkspace?.name}</strong>.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-bold text-slate-700">
                To confirm, type "<span className="text-red-600 font-mono">{activeWorkspace?.name}</span>" below:
              </label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={activeWorkspace?.name}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              />

              {deleteError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmName("");
                  setDeleteError(null);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || confirmName !== activeWorkspace?.name}
                onClick={handleDeleteWorkspace}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/20 flex items-center cursor-pointer"
              >
                {isDeleting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                )}
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
