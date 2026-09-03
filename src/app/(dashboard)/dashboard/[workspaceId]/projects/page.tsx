"use client";

import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProjectsListPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      if (!workspaceId) return;
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      try {
        const res = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}/projects`, {
          headers: {
            'Authorization': session ? `Bearer ${session.access_token}` : ''
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAllProjects(data);
        } else {
          console.error("Failed to fetch projects");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [workspaceId]);

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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading projects...
                </td>
              </tr>
            ) : allProjects.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
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
                    <Link href={`/dashboard/projects/${proj.id}`} passHref>
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
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
