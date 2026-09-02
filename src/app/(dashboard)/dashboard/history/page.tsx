"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  Layers, 
  Eye, 
  Copy, 
  Check, 
  X, 
  Download, 
  Sparkles, 
  Clock, 
  Database,
  Cpu,
  Workflow,
  Palette,
  Compass,
  FileSpreadsheet,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  FolderGit2,
  Code2,
  FileText,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface BlueprintItem {
  id: string;
  module_type: string;
  created_at: string;
  generated_content: any;
  projectName: string;
  projectId?: string;
  title: string;
  summary: string;
  content: string;
  key_recommendations: string[];
}

const MODULE_METADATA: Record<string, { name: string; icon: any; color: string; bg: string; border: string }> = {
  transformation_planner: { 
    name: "Transformation Planner", 
    icon: Compass, 
    color: "text-purple-600", 
    bg: "bg-purple-50", 
    border: "border-purple-200" 
  },
  solution_architecture: { 
    name: "Solution Architecture Builder", 
    icon: Cpu, 
    color: "text-indigo-600", 
    bg: "bg-indigo-50", 
    border: "border-indigo-200" 
  },
  database_designer: { 
    name: "Database & Integration Designer", 
    icon: Database, 
    color: "text-teal-600", 
    bg: "bg-teal-50", 
    border: "border-teal-200" 
  },
  process_intelligence: { 
    name: "Process Intelligence Designer", 
    icon: Workflow, 
    color: "text-emerald-600", 
    bg: "bg-emerald-50", 
    border: "border-emerald-200" 
  },
  ux_designer: { 
    name: "AI UX Designer", 
    icon: Palette, 
    color: "text-pink-600", 
    bg: "bg-pink-50", 
    border: "border-pink-200" 
  },
  planning_engine: { 
    name: "AI Planning Engine", 
    icon: Clock, 
    color: "text-cyan-600", 
    bg: "bg-cyan-50", 
    border: "border-cyan-200" 
  },
  transformation_companion: { 
    name: "AI Transformation Companion", 
    icon: Sparkles, 
    color: "text-blue-600", 
    bg: "bg-blue-50", 
    border: "border-blue-200" 
  },
  solution_builder: { 
    name: "AI Solution Builder", 
    icon: Layers, 
    color: "text-amber-600", 
    bg: "bg-amber-50", 
    border: "border-amber-200" 
  },
  business_analysis: { 
    name: "Business Analysis Engine", 
    icon: FileSpreadsheet, 
    color: "text-violet-600", 
    bg: "bg-violet-50", 
    border: "border-violet-200" 
  },
  business_consultant: { 
    name: "AI Business Consultant", 
    icon: Briefcase, 
    color: "text-orange-600", 
    bg: "bg-orange-50", 
    border: "border-orange-200" 
  },
  transformation_dashboard: { 
    name: "Transformation Dashboard", 
    icon: TrendingUp, 
    color: "text-rose-600", 
    bg: "bg-rose-50", 
    border: "border-rose-200" 
  },
  security_compliance: { 
    name: "Security & Compliance Guardian", 
    icon: ShieldCheck, 
    color: "text-red-600", 
    bg: "bg-red-50", 
    border: "border-red-200" 
  },
};

function getModuleInfo(moduleType: string) {
  const normalized = (moduleType || "").toLowerCase().replace(/[\s-]/g, "_");
  return MODULE_METADATA[normalized] || {
    name: moduleType ? moduleType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "AI Module",
    icon: Layers,
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200"
  };
}

export default function HistoryDashboardPage() {
  const [blueprints, setBlueprints] = useState<BlueprintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [activeItem, setActiveItem] = useState<BlueprintItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedContent, setCopiedContent] = useState(false);

  // TASK 2: Fetch all blueprints associated with user's projects
  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        // 1. Check authenticated user session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log("DEBUG: Current Authenticated User ID:", user?.id);

        if (!user) {
          console.error("DEBUG ERROR: No active Supabase session found when querying history.", userError);
          setBlueprints([]);
          setLoading(false);
          return;
        }

        // 2. Fetch blueprints without complex foreign joins first to isolate join issues
        const { data, error } = await supabase
          .from('blueprints')
          .select('*')
          .order('created_at', { ascending: false });

        console.log("DEBUG: Raw Blueprints fetched from Supabase:", data);
        if (error) {
          console.error("DEBUG ERROR: Supabase query failed:", error);
        }

        // Project map cache for displaying real project names
        let projectMap: Record<string, string> = {};
        try {
          const { data: projectsData } = await supabase.from('projects').select('id, name');
          if (projectsData) {
            projectsData.forEach((p: any) => {
              projectMap[p.id] = p.name;
            });
          }
        } catch (pErr) {
          console.warn("Could not load project names for history mapping:", pErr);
        }

        let rawList = data || [];

        // Fallback: If Supabase query returns empty or failed (e.g. restrictive RLS before SQL migration), fetch via authenticated FastAPI backend
        if (rawList.length === 0) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            try {
              console.log("DEBUG: Attempting backend fallback fetch at http://localhost:8000/api/ai/blueprints");
              const res = await fetch("http://localhost:8000/api/ai/blueprints", {
                headers: { Authorization: `Bearer ${session.access_token}` }
              });
              if (res.ok) {
                const backendData = await res.json();
                console.log("DEBUG: Blueprints fetched from backend fallback:", backendData);
                if (backendData && backendData.length > 0) {
                  rawList = backendData;
                }
              }
            } catch (backendErr) {
              console.warn("DEBUG: Backend fallback fetch failed:", backendErr);
            }
          }
        }

        const mapped: BlueprintItem[] = rawList.map((row: any) => {
          const rawContent = row.generated_content || row.data || {};
          const moduleKey = row.module_type || row.module_name || "unknown";
          const proj = Array.isArray(row.projects) ? row.projects[0] : row.projects;
          const projectName = proj?.name || (row.project_id && projectMap[row.project_id]) || "General Project";
          const projectId = proj?.id || row.project_id;

          let title = rawContent.title || "";
          let summary = rawContent.summary || "";
          let content = typeof rawContent === "string" 
            ? rawContent 
            : (rawContent.content || JSON.stringify(rawContent, null, 2));
          let keyRecs = rawContent.key_recommendations || [];

          if (!title) {
            const meta = getModuleInfo(moduleKey);
            title = `${meta.name} Blueprint`;
          }

          return {
            id: row.id,
            module_type: moduleKey,
            created_at: row.created_at,
            generated_content: rawContent,
            projectName,
            projectId,
            title,
            summary,
            content,
            key_recommendations: Array.isArray(keyRecs) ? keyRecs : []
          };
        });

        // 3. Set state
        setBlueprints(mapped);
      } catch (err) {
        console.error("Error loading blueprint history:", err);
        setBlueprints([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  // Filter options
  const projectOptions = useMemo(() => {
    const set = new Set<string>();
    blueprints.forEach(b => set.add(b.projectName));
    return Array.from(set);
  }, [blueprints]);

  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    blueprints.forEach(b => set.add(b.module_type));
    return Array.from(set);
  }, [blueprints]);

  // Filtered blueprints
  const filteredBlueprints = useMemo(() => {
    return blueprints.filter(item => {
      const q = searchQuery.toLowerCase();
      const meta = getModuleInfo(item.module_type);
      const matchesSearch = 
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q) ||
        meta.name.toLowerCase().includes(q);

      const matchesModule = selectedModuleFilter === "all" || item.module_type === selectedModuleFilter;
      const matchesProject = selectedProjectFilter === "all" || item.projectName === selectedProjectFilter;

      return matchesSearch && matchesModule && matchesProject;
    });
  }, [blueprints, searchQuery, selectedModuleFilter, selectedProjectFilter]);

  const handleCopyJSON = (item: BlueprintItem) => {
    const jsonStr = JSON.stringify(item.generated_content, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const handleDownloadMarkdown = (item: BlueprintItem) => {
    const dateStr = new Date(item.created_at).toISOString().slice(0, 10);
    const filename = `${item.module_type}_blueprint_${dateStr}.md`;
    const blob = new Blob([item.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <History size={20} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Generation History</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Browse, inspect, and export all historical AI-generated blueprints and architectural versions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-2xs">
            <Clock size={15} className="text-indigo-600" />
            <span>{blueprints.length} Total Generations</span>
          </div>
          <Link
            href="/dashboard/1/modules"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Generate New</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3.5 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by project, module, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 bg-slate-50/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Module Filter */}
          <div className="flex items-center space-x-1.5 flex-1 sm:flex-initial">
            <Filter size={15} className="text-slate-400 ml-1" />
            <select
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50/60 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Modules</option>
              {moduleOptions.map(m => (
                <option key={m} value={m}>{getModuleInfo(m).name}</option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center space-x-1.5 flex-1 sm:flex-initial">
            <FolderGit2 size={15} className="text-slate-400 ml-1" />
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50/60 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projectOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {(selectedModuleFilter !== "all" || selectedProjectFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedModuleFilter("all");
                setSelectedProjectFilter("all");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="w-32 h-6 bg-slate-200 rounded-full" />
                <div className="w-20 h-4 bg-slate-200 rounded-md" />
              </div>
              <div className="w-3/4 h-5 bg-slate-200 rounded-md mt-2" />
              <div className="space-y-2 pt-2">
                <div className="w-full h-3.5 bg-slate-100 rounded" />
                <div className="w-5/6 h-3.5 bg-slate-100 rounded" />
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-20 h-8 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBlueprints.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <History size={30} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {blueprints.length === 0 ? "No blueprints generated yet" : "No matching blueprints found"}
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-2 leading-relaxed">
            {blueprints.length === 0
              ? "Your AI-generated blueprints will be automatically saved here as versioned records. Head over to AI Modules to launch your first generation."
              : "Try adjusting your search query or changing your project and module filters."}
          </p>
          {blueprints.length === 0 && (
            <Link
              href="/dashboard/1/modules"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all mt-6 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Launch AI Modules</span>
            </Link>
          )}
        </div>
      ) : (
        /* History List Card UI */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlueprints.map((item, index) => {
            const meta = getModuleInfo(item.module_type);
            const Icon = meta.icon;
            const date = new Date(item.created_at);
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            });
            const formattedTime = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all flex flex-col p-6 group relative overflow-hidden"
              >
                {/* Top Badges & Date */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold ${meta.bg} ${meta.color} border ${meta.border}`}>
                      <Icon size={13} />
                      <span>{meta.name}</span>
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center text-[11px] font-semibold text-slate-500 space-x-1">
                      <Calendar size={12} className="text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{formattedTime}</span>
                  </div>
                </div>

                {/* Project Name Badge */}
                <div className="mb-2.5">
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-600 bg-slate-100/80 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                    <FolderGit2 size={11} className="text-slate-400" />
                    <span className="truncate max-w-[200px]">{item.projectName}</span>
                  </span>
                </div>

                {/* Blueprint Title & Summary */}
                <div className="flex-1 space-y-1.5 mb-6">
                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyJSON(item)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title="Copy Raw JSON"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Code2 size={13} />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveItem(item)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>View Details</span>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* TASK 3: BLUEPRINT VIEWER MODAL / DRAWER */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveItem(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/70">
                <div className="flex items-center space-x-4">
                  {(() => {
                    const meta = getModuleInfo(activeItem.module_type);
                    const Icon = meta.icon;
                    return (
                      <div className={`w-12 h-12 rounded-2xl ${meta.bg} ${meta.border} border flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${meta.color}`} />
                      </div>
                    );
                  })()}

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        {getModuleInfo(activeItem.module_type).name}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {activeItem.projectName}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                      {activeItem.title}
                    </h2>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyContent(activeItem.content)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copiedContent ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedContent ? "Copied!" : "Export / Copy"}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadMarkdown(activeItem)}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 bg-white shadow-2xs"
                    title="Download .md"
                  >
                    <Download size={16} />
                  </button>

                  <button
                    onClick={() => setActiveItem(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer ml-1"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {/* Meta details banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1.5 font-semibold">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{new Date(activeItem.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </span>
                    <span className="font-mono text-slate-400">ID: {activeItem.id}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Persisted in Supabase
                  </span>
                </div>

                {/* Executive Summary */}
                {activeItem.summary && (
                  <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-100 rounded-2xl text-xs text-blue-950 leading-relaxed">
                    <span className="font-bold text-blue-700 uppercase tracking-wider text-[10px] block mb-1.5">
                      Executive Summary
                    </span>
                    {activeItem.summary}
                  </div>
                )}

                {/* Key Recommendations */}
                {activeItem.key_recommendations && activeItem.key_recommendations.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block mb-2.5">
                      Key Recommendations
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeItem.key_recommendations.map((rec, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-start space-x-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800"
                        >
                          <span className="text-indigo-600 font-bold mt-0.5">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blueprint Content Formatted */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block">
                      Generated Blueprint Content
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Markdown Specification
                    </span>
                  </div>
                  <pre className="p-5 text-sm text-slate-100 whitespace-pre-wrap overflow-x-auto max-h-[480px] overflow-y-auto leading-relaxed font-mono bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
                    {activeItem.content}
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
