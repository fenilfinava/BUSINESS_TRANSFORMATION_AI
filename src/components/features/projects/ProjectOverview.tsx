"use client";

import { motion } from "framer-motion";
import { Activity, Target, TrendingUp, MessageSquare, Search, Lightbulb, FileText, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface ProjectOverviewProps {
  projectId: string;
  onTabChange?: (tab: string) => void;
}

export function ProjectOverview({ projectId, onTabChange }: ProjectOverviewProps) {
  const [project, setProject] = useState<any>(null);
  const [blueprintsCount, setBlueprintsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      setIsLoading(true);
      const supabase = createClient();

      try {
        const { data: proj } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (proj) {
          setProject(proj);
        }

        const { data: blueprints } = await supabase
          .from("blueprints")
          .select("id")
          .eq("project_id", projectId);

        if (blueprints) {
          setBlueprintsCount(blueprints.length);
        }
      } catch (err) {
        console.error("Error loading project overview:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Loading project overview...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 font-medium">Project details unavailable.</p>
      </div>
    );
  }

  const createdDate = project.created_at
    ? new Date(project.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Recently";

  const stats = [
    {
      label: "Project Status",
      value: project.status || "In Progress",
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "AI Blueprints",
      value: blueprintsCount.toString(),
      icon: Lightbulb,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      label: "Context Status",
      value: project.context_description ? "Configured" : "Needs Info",
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Created On",
      value: createdDate,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  const quickActions = [
    {
      tab: "discovery",
      label: "Start Discovery",
      desc: "Begin a guided business analysis session",
      icon: Search,
      color: "from-emerald-500 to-teal-600",
    },
    {
      tab: "chat",
      label: "AI Chat",
      desc: "Ask AI to generate architectures & solutions",
      icon: MessageSquare,
      color: "from-blue-500 to-indigo-600",
    },
    {
      tab: "solutions",
      label: "View Solutions",
      desc: "Review AI-generated recommendations",
      icon: Lightbulb,
      color: "from-purple-500 to-pink-600",
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
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTabChange?.(action.tab)}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-lg">
                  {action.label}
                </h4>
                <p className="text-sm text-slate-500 mt-1">{action.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Project Context & AI Readiness Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
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
                  <strong className="text-slate-800">Business Objective: </strong>
                  {project.context_description}
                </>
              ) : (
                <>
                  No specific business context recorded yet. Run a{" "}
                  <button
                    onClick={() => onTabChange?.("discovery")}
                    className="text-blue-600 font-semibold underline hover:text-blue-700"
                  >
                    Discovery Session
                  </button>{" "}
                  to feed your strategic objectives into the AI generator.
                </>
              )}
            </p>
          </div>
        </div>

        {project.description && (
          <div className="pt-3 border-t border-blue-100/80 text-sm text-slate-600 flex items-start space-x-3">
            <FileText size={18} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800">Project Scope: </span>
              {project.description}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
