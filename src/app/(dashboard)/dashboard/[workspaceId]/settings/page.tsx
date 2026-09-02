"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle2, User, Building, Cpu, Shield } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        setUserName(user.user_metadata?.full_name || "");
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-slate-500 mt-2 text-lg">Manage user info, workspace configuration, and AI preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
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
                <input required type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Full Name" className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input required type="email" value={userEmail} disabled className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-100 text-slate-500 cursor-not-allowed transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                <input disabled type="text" defaultValue="Enterprise Admin" className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-100 text-slate-500 cursor-not-allowed" />
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
                <input required type="text" defaultValue="Acme Corp Workspace" className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Industry Focus</label>
                <select className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none">
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
              <select className="block w-full max-w-md rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none">
                <option>Enterprise AI Brain (Recommended)</option>
                <option>Gemini 1.5 Pro</option>
                <option>Custom Fine-tuned Model</option>
              </select>
              <p className="mt-2 text-sm text-slate-500">Determines which model powers the Solution Architecture Builder.</p>
            </div>
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
            className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70"
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
    </div>
  );
}
