"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, X, Plus } from 'lucide-react';
import { AnimatedBackground } from '@/components/common/AnimatedBackground';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const COLOR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-rose-500 to-red-600",
];

const ICONS = ["🚀", "🏢", "🌐", "⚡", "💎", "✨"];

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live fetching from Supabase
  useEffect(() => {
    async function loadWorkspaces() {
      setIsLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!session || sessionError) {
          console.log("No active session found on workspaces page. Redirecting to login...");
          router.replace('/login');
          return;
        }

        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching workspaces from Supabase:", error);
        } else if (data) {
          setWorkspaces(data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkspaces();
  }, [router]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsCreating(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!session || sessionError) {
        console.error("No active session found. Redirecting to login...");
        router.replace('/login');
        return;
      }
      
      const res = await fetch('http://localhost:8000/api/workspaces', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name: name })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to create workspace");
      }
      
      const newWs = await res.json();
      setIsModalOpen(false);
      setName("");

      // Dynamic redirection to the real workspace ID
      if (newWs?.id) {
        router.replace(`/dashboard/${newWs.id}`);
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      <AnimatedBackground />

      <div className="max-w-5xl w-full mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-flex items-center justify-center p-3 bg-white/70 rounded-2xl mb-6 backdrop-blur-md border border-slate-200 shadow-xl shadow-blue-500/10"
          >
            <Sparkles className="text-blue-600 w-8 h-8" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight"
          >
            Select Workspace
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-500 text-lg max-w-xl mx-auto"
          >
            Choose a workspace to continue or create a new one to start your transformation journey.
          </motion.p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 animate-pulse flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-slate-200/80 rounded-2xl mb-6" />
                  <div className="h-6 bg-slate-200/80 rounded-lg w-3/4 mb-3" />
                  <div className="h-4 bg-slate-200/60 rounded-md w-1/3" />
                </div>
                <div className="h-4 bg-slate-200/60 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workspaces.map((ws, i) => {
              const color = ws.color || COLOR_GRADIENTS[i % COLOR_GRADIENTS.length];
              const icon = ws.icon || ICONS[i % ICONS.length];
              const role = ws.role || "Admin";

              return (
                <Link key={ws.id} href={`/dashboard/${ws.id}`} passHref className="block h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, type: "spring", stiffness: 300, damping: 20 }}
                    whileHover={{ y: -10, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="h-full bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-slate-200/50 group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500`} />
                    
                    {/* Shimmer sweep effect */}
                    <motion.div 
                      animate={{ x: ['-200%', '300%'] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 2 + i }}
                      className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 z-0"
                    />
                    
                    <div className="relative z-10">
                      <div className="text-4xl mb-6 bg-white w-16 h-16 flex items-center justify-center rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow">
                        <span className="relative z-10">{icon}</span>
                        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all">{ws.name}</h2>
                      <div className="mt-4 inline-flex items-center space-x-2 bg-slate-50/80 px-3 py-1.5 rounded-full border border-slate-200/50 backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]" />
                        <span className="text-sm text-slate-600 font-bold tracking-wide">{role}</span>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform relative z-10">
                      Enter Workspace <ArrowRight size={18} className="ml-2 group-hover:animate-pulse" />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
            
            <motion.button 
              onClick={() => setIsModalOpen(true)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: workspaces.length * 0.15, type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ y: -10, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full text-left bg-white/40 backdrop-blur-xl p-8 rounded-3xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-slate-600 group flex flex-col items-center justify-center min-h-[250px] cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border border-slate-200 group-hover:border-blue-200 transition-colors shadow-sm group-hover:shadow-blue-500/25">
                <Plus className="text-slate-400 group-hover:text-blue-500 transition-colors w-8 h-8" />
              </div>
              <span className="text-lg font-bold text-slate-700 tracking-wide">New Workspace</span>
              <span className="text-sm mt-2 text-slate-500 group-hover:text-blue-600 transition-colors text-center">Set up a new organization</span>
            </motion.button>
          </div>
        )}

      </div>

      {/* New Workspace Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">Create Workspace</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-8">
                <div className="mb-8">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Workspace Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Stark Industries" 
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900"
                    required
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isCreating || !name.trim()}
                  type="submit"
                  className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 cursor-pointer"
                >
                  {isCreating ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Creating...</>
                  ) : (
                    "Create Workspace"
                  )}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
