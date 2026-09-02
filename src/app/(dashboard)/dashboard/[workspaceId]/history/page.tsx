"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
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
  ArrowUpRight,
  Database,
  Cpu,
  Workflow,
  Palette,
  Compass,
  FileSpreadsheet,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  FolderGit2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BlueprintRecord {
  id: string;
  project_id: string;
  module_type: string;
  projectName: string;
  title: string;
  summary: string;
  content: string;
  key_recommendations: string[];
  created_at: string;
}

const MODULE_DISPLAY_MAP: Record<string, { name: string; icon: any; color: string; bg: string }> = {
  transformation_planner: { name: "Transformation Planner", icon: Compass, color: "text-blue-600", bg: "bg-blue-50" },
  solution_architecture: { name: "Solution Architecture Builder", icon: Cpu, color: "text-indigo-600", bg: "bg-indigo-50" },
  database_designer: { name: "Database & Integration Designer", icon: Database, color: "text-purple-600", bg: "bg-purple-50" },
  process_intelligence: { name: "Process Intelligence Designer", icon: Workflow, color: "text-amber-600", bg: "bg-amber-50" },
  ux_designer: { name: "AI UX Designer", icon: Palette, color: "text-rose-600", bg: "bg-rose-50" },
  planning_engine: { name: "AI Planning Engine", icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
  transformation_companion: { name: "AI Transformation Companion", icon: Sparkles, color: "text-cyan-600", bg: "bg-cyan-50" },
  solution_builder: { name: "AI Solution Builder", icon: Layers, color: "text-violet-600", bg: "bg-violet-50" },
  business_analysis: { name: "Business Analysis Engine", icon: FileSpreadsheet, color: "text-teal-600", bg: "bg-teal-50" },
  business_consultant: { name: "AI Business Consultant", icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50" },
  transformation_dashboard: { name: "Transformation Dashboard", icon: TrendingUp, color: "text-sky-600", bg: "bg-sky-50" },
  security_compliance: { name: "Security & Compliance Guardian", icon: ShieldCheck, color: "text-red-600", bg: "bg-red-50" },
};

export default function HistoryPage() {
  const params = useParams();
  const workspaceId = (params?.workspaceId as string) || "";

  const [history, setHistory] = useState<BlueprintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load history with fallback handling
  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        // Fetch projects in workspace for name resolution
        let projectMap: Record<string, string> = {};
        if (workspaceId) {
          const { data: projectsData } = await supabase
            .from("projects")
            .select("id, name")
            .eq("workspace_id", workspaceId);
          if (projectsData) {
            projectsData.forEach(p => { projectMap[p.id] = p.name; });
          }
        }

        // Fetch blueprints
        const { data: rawBlueprints, error } = await supabase
          .from("blueprints")
          .select("id, project_id, module_type, module_name, generated_content, data, created_at")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching blueprints:", error);
          setHistory([]);
          return;
        }

        const formatted: BlueprintRecord[] = (rawBlueprints || []).map((row: any) => {
          const contentObj = row.generated_content || row.data || {};
          const moduleKey = row.module_type || row.module_name || "unknown";
          
          let title = contentObj.title || "";
          let summary = contentObj.summary || "";
          let content = typeof contentObj === "string" ? contentObj : (contentObj.content || JSON.stringify(contentObj, null, 2));
          let recommendations = contentObj.key_recommendations || [];

          if (!title) {
            const meta = MODULE_DISPLAY_MAP[moduleKey];
            title = meta ? `${meta.name} Blueprint` : "AI Generated Blueprint";
          }

          return {
            id: row.id,
            project_id: row.project_id,
            module_type: moduleKey,
            projectName: projectMap[row.project_id] || "Project " + (row.project_id?.substring(0, 8) || "General"),
            title,
            summary,
            content,
            key_recommendations: Array.isArray(recommendations) ? recommendations : [],
            created_at: row.created_at
          };
        });

        // Filter by workspace projects if available
        const filteredByWs = workspaceId && Object.keys(projectMap).length > 0 
          ? formatted.filter(b => projectMap[b.project_id] !== undefined)
          : formatted;

        setHistory(filteredByWs);
      } catch (err) {
        console.error("Failed to load blueprint history:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [workspaceId]);

  // Unique lists for filtering
  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    history.forEach(h => names.add(h.projectName));
    return Array.from(names);
  }, [history]);

  const moduleOptions = useMemo(() => {
    const types = new Set<string>();
    history.forEach(h => types.add(h.module_type));
    return Array.from(types);
  }, [history]);

  // Filtered blueprints
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.module_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projectName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProject = selectedProjectFilter === "all" || item.projectName === selectedProjectFilter;
      const matchesModule = selectedModuleFilter === "all" || item.module_type === selectedModuleFilter;

      return matchesSearch && matchesProject && matchesModule;
    });
  }, [history, searchQuery, selectedProjectFilter, selectedModuleFilter]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: BlueprintRecord) => {
    const filename = `${item.module_type}_blueprint_${new Date(item.created_at).toISOString().slice(0, 10)}.md`;
    const blob = new Blob([item.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <History size={20} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Blueprint History</h2>
          </div>
          <p className="text-slate-500 text-sm">
            Browse and inspect all historical AI-generated blueprints and architectural versions.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold text-slate-500 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs">
          <Clock size={16} className="text-indigo-500" />
          <span>{history.length} Total Versions Generated</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search blueprints or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Project Filter */}
          <div className="flex items-center space-x-2">
            <FolderGit2 size={16} className="text-slate-400" />
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50/50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projectOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Module Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50/50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Modules</option>
              {moduleOptions.map(m => {
                const label = MODULE_DISPLAY_MAP[m]?.name || m.replace(/_/g, " ");
                return <option key={m} value={m}>{label}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium text-sm">Loading version history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History size={26} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No blueprint history found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
            {history.length === 0
              ? "You haven't generated any AI blueprints yet. Navigate to AI Modules to generate your first architecture."
              : "No blueprints match your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Project</th>
                  <th className="py-4 px-6">Module Type</th>
                  <th className="py-4 px-6">Blueprint Title & Summary</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredHistory.map((item) => {
                  const meta = MODULE_DISPLAY_MAP[item.module_type] || {
                    name: item.module_type.replace(/_/g, " "),
                    icon: Layers,
                    color: "text-slate-600",
                    bg: "bg-slate-100"
                  };
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
                    <motion.tr 
                      key={item.id}
                      whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
                      className="transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-slate-700 font-semibold text-xs">
                          <Calendar size={14} className="text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 ml-5 font-mono">
                          {formattedTime}
                        </div>
                      </td>

                      {/* Project Name */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                          {item.projectName}
                        </span>
                      </td>

                      {/* Module Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center`}>
                            <Icon size={16} className={meta.color} />
                          </div>
                          <span className="font-bold text-slate-800 text-xs">
                            {meta.name}
                          </span>
                        </div>
                      </td>

                      {/* Title & Summary */}
                      <td className="py-4 px-6 max-w-md">
                        <p className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </p>
                        {item.summary && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {item.summary}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleCopy(item.content, item.id)}
                            title="Copy Markdown"
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            {copiedId === item.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                          </button>

                          <button
                            onClick={() => handleDownload(item)}
                            title="Download .md"
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Download size={16} />
                          </button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedBlueprint(item)}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-200/60"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blueprint Inspection Modal */}
      <AnimatePresence>
        {selectedBlueprint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBlueprint(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 relative z-10 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
                <div className="flex items-center space-x-4">
                  {(() => {
                    const meta = MODULE_DISPLAY_MAP[selectedBlueprint.module_type] || {
                      name: selectedBlueprint.module_type.replace(/_/g, " "),
                      icon: Layers,
                      color: "text-slate-600",
                      bg: "bg-slate-100"
                    };
                    const Icon = meta.icon;
                    return (
                      <div className={`w-12 h-12 rounded-2xl ${meta.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${meta.color}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        {MODULE_DISPLAY_MAP[selectedBlueprint.module_type]?.name || selectedBlueprint.module_type}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-medium text-slate-500">
                        {selectedBlueprint.projectName}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">{selectedBlueprint.title}</h2>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(selectedBlueprint.content, "modal")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedId === "modal" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedId === "modal" ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={() => handleDownload(selectedBlueprint)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => setSelectedBlueprint(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer ml-1"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                {/* Meta details banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1.5 font-medium">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{new Date(selectedBlueprint.created_at).toLocaleString()}</span>
                    </span>
                    <span className="font-mono text-slate-400">ID: {selectedBlueprint.id.substring(0, 8)}...</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Saved in Log
                  </span>
                </div>

                {/* Executive Summary */}
                {selectedBlueprint.summary && (
                  <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-100 rounded-2xl text-xs text-blue-950 leading-relaxed">
                    <span className="font-bold text-blue-700 uppercase tracking-wider text-[10px] block mb-1">
                      Executive Summary
                    </span>
                    {selectedBlueprint.summary}
                  </div>
                )}

                {/* Key Recommendations */}
                {selectedBlueprint.key_recommendations && selectedBlueprint.key_recommendations.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-2">
                      Key Recommendations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedBlueprint.key_recommendations.map((rec, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-800 shadow-2xs"
                        >
                          • {rec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Content */}
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-2">
                    Blueprint Specification
                  </span>
                  <pre className="p-5 text-sm text-slate-800 whitespace-pre-wrap overflow-x-auto max-h-[460px] overflow-y-auto leading-relaxed font-mono bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-inner">
                    {selectedBlueprint.content}
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
