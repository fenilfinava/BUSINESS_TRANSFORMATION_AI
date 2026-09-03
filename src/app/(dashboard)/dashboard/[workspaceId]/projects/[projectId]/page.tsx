"use client";

import { motion } from "framer-motion";
import { Activity, Target, Clock, TrendingUp, MessageSquare, Search, Lightbulb, FileText, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ProjectOverview() {
  const params = useParams();
  const projectId = (params?.projectId || params?.id) as string;
  const workspaceId = (params?.workspaceId as string) || "";

  const [project, setProject] = useState<any>(null);
  const [blueprintsCount, setBlueprintsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      const supabase = createClient();
      setIsLoading(true);

      try {
        // 1. Fetch real project details
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) {
          console.error("Error fetching project:", error);
        } else {
          setProject(data);

          // 2. Fetch real blueprint count for this project
          const { data: blueprints, error: bpError } = await supabase
            .from('blueprints')
            .select('id')
            .eq('project_id', projectId);

          if (!bpError && blueprints) {
            setBlueprintsCount(blueprints.length);
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching project:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Loading project workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <AlertCircle size={36} className="text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Project not found</h3>
        <p className="text-slate-500 text-sm mt-1">This project may have been moved or removed.</p>
        <Link href={`/dashboard/${workspaceId || ''}/projects`} className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl text-sm">
          Return to Projects
        </Link>
      </div>
    );
  }

  const createdDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  const stats = [
    { 
      label: "Project Status", 
      value: project.status || "In Progress", 
      icon: Activity, 
      color: "text-blue-600", 
      bg: "bg-blue-100" 
    },
    { 
      label: "AI Blueprints", 
      value: blueprintsCount.toString(), 
      icon: Lightbulb, 
      color: "text-yellow-600", 
      bg: "bg-yellow-100" 
    },
    { 
      label: "Context Status", 
      value: project.context_description ? "Configured" : "Needs Info", 
      icon: Target, 
      color: "text-emerald-600", 
      bg: "bg-emerald-100" 
    },
    { 
      label: "Created On", 
      value: createdDate, 
      icon: Calendar, 
      color: "text-purple-600", 
      bg: "bg-purple-100" 
    },
  ];

  const quickActions = [
    { 
      label: "Start Discovery", 
      desc: "Begin a guided business analysis session", 
      icon: Search, 
      href: `/dashboard/${workspaceId}/projects/${projectId}/discovery`, 
      color: "from-emerald-500 to-teal-600" 
    },
    { 
      label: "AI Chat", 
      desc: "Ask AI to generate architectures & solutions", 
      icon: MessageSquare, 
      href: `/dashboard/${workspaceId}/projects/${projectId}/chat`, 
      color: "from-blue-500 to-indigo-600" 
    },
    { 
      label: "View Solutions", 
      desc: "Review AI-generated recommendations", 
      icon: Lightbulb, 
      href: `/dashboard/${workspaceId}/projects/${projectId}/solutions`, 
      color: "from-purple-500 to-pink-600" 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className={`w-11 h-11 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-black text-slate-900 mb-5">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-lg">{action.label}</h4>
                  <p className="text-sm text-slate-500 mt-1">{action.desc}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Project Context & AI Insights */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 space-y-4"
      >
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 mt-0.5">
            <TrendingUp size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Project Context & Architecture Readiness</h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {project.context_description ? (
                <>
                  <strong className="text-slate-800">Business Objective:</strong> {project.context_description}
                </>
              ) : (
                <>
                  No specific business context recorded yet. Run a <strong className="text-blue-600">Discovery Session</strong> to feed your strategic objectives into the AI generator.
                </>
              )}
            </p>
          </div>
        </div>

        {project.description && (
          <div className="pt-3 border-t border-blue-100/80 text-sm text-slate-600 flex items-start space-x-3">
            <FileText size={18} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">Project Description: </span>
              {project.description}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
