"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Zap, Server, Shield, FileDown, Sparkles, Calendar, ChevronRight, X, ExternalLink, Download, FileText } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { exportToPdf, exportToWord, exportToMarkdown, exportToJson } from "@/utils/exportUtils";

interface SolutionsGalleryProps {
  projectId: string;
  onTabChange?: (tab: string) => void;
}

export function SolutionsGallery({ projectId, onTabChange }: SolutionsGalleryProps) {
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlueprint, setSelectedBlueprint] = useState<any | null>(null);

  useEffect(() => {
    async function loadBlueprints() {
      if (!projectId) return;
      setIsLoading(true);
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("blueprints")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching blueprints:", error);
        } else {
          setBlueprints(data || []);
        }
      } catch (err) {
        console.error("Unexpected error loading blueprints:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBlueprints();
  }, [projectId]);

  const getModuleIcon = (type?: string) => {
    const lower = (type || "").toLowerCase();
    if (lower.includes("security")) return Shield;
    if (lower.includes("data") || lower.includes("pipeline")) return Zap;
    if (lower.includes("architect") || lower.includes("cloud")) return Server;
    return Layers;
  };

  const getModuleBadgeColor = (type?: string) => {
    const lower = (type || "").toLowerCase();
    if (lower.includes("security")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (lower.includes("data")) return "bg-amber-100 text-amber-700 border-amber-200";
    if (lower.includes("architect")) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-purple-100 text-purple-700 border-purple-200";
  };

  const handleExportJson = (bp: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bp, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `blueprint-${bp.module_type || "solution"}-${bp.id.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Loading solutions & blueprints...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Generated Blueprints & Solutions</h2>
          <p className="text-slate-500 text-sm mt-1">
            Browse architecture roadmaps, technical specifications, and AI recommendations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onTabChange?.("chat")}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Generate New Solution</span>
          </button>
        </div>
      </div>

      {blueprints.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
            <Layers size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No solutions generated yet</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
              Start a guided discovery session or chat with the AI Advisor to produce tailored cloud architectures and
              transformation blueprints.
            </p>
          </div>
          <div className="pt-2 flex justify-center space-x-3">
            <button
              onClick={() => onTabChange?.("discovery")}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Start Discovery
            </button>
            <button
              onClick={() => onTabChange?.("chat")}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors shadow-sm"
            >
              Open AI Chat
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blueprints.map((bp, i) => {
            const Icon = getModuleIcon(bp.module_type);
            const content = bp.generated_content || {};
            const title =
              content.title ||
              (bp.module_type ? bp.module_type.replace(/_/g, " ").toUpperCase() : "Solution Blueprint");
            const summary =
              content.summary ||
              (typeof content === "string" ? content.slice(0, 140) : "Transformation blueprint specification.");
            const createdDate = bp.created_at ? new Date(bp.created_at).toLocaleDateString() : "Recent";

            return (
              <motion.div
                key={bp.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getModuleBadgeColor(bp.module_type)}`}
                    >
                      {bp.module_type || "Architecture"}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>{createdDate}</span>
                    </span>
                  </div>

                  <div className="flex items-start space-x-3 pt-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 group-hover:scale-110 transition-transform">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 line-clamp-1">{title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">{summary}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleExportJson(bp)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1 transition-colors"
                  >
                    <FileDown size={14} />
                    <span>Export JSON</span>
                  </button>

                  <button
                    onClick={() => setSelectedBlueprint(bp)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Blueprint Detail Modal */}
      <AnimatePresence>
        {selectedBlueprint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    {selectedBlueprint.module_type || "Blueprint"}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                    {selectedBlueprint.generated_content?.title || "Architecture Specification"}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedBlueprint(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700 leading-relaxed">
                {selectedBlueprint.generated_content?.summary && (
                  <div>
                    <h5 className="font-bold text-slate-900 mb-1">Executive Summary</h5>
                    <p className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {selectedBlueprint.generated_content.summary}
                    </p>
                  </div>
                )}

                {selectedBlueprint.generated_content?.key_recommendations && (
                  <div>
                    <h5 className="font-bold text-slate-900 mb-2">Key Recommendations</h5>
                    <ul className="list-disc pl-5 space-y-1.5">
                      {selectedBlueprint.generated_content.key_recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h5 className="font-bold text-slate-900 mb-2">Payload Data</h5>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs overflow-x-auto font-mono">
                    {JSON.stringify(selectedBlueprint.generated_content || selectedBlueprint, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Export:</span>
                  <button
                    onClick={() => {
                      const content = selectedBlueprint.generated_content || {};
                      exportToPdf({
                        title: content.title || selectedBlueprint.module_type || "Blueprint",
                        summary: content.summary,
                        content: typeof content.content === "string" ? content.content : JSON.stringify(content, null, 2),
                        module_name: selectedBlueprint.module_type,
                        key_recommendations: content.key_recommendations
                      });
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>📄 PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      const content = selectedBlueprint.generated_content || {};
                      exportToWord({
                        title: content.title || selectedBlueprint.module_type || "Blueprint",
                        summary: content.summary,
                        content: typeof content.content === "string" ? content.content : JSON.stringify(content, null, 2),
                        module_name: selectedBlueprint.module_type,
                        key_recommendations: content.key_recommendations
                      });
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>📝 Word</span>
                  </button>
                  <button
                    onClick={() => {
                      const content = selectedBlueprint.generated_content || {};
                      exportToMarkdown({
                        title: content.title || selectedBlueprint.module_type || "Blueprint",
                        summary: content.summary,
                        content: typeof content.content === "string" ? content.content : JSON.stringify(content, null, 2),
                        module_name: selectedBlueprint.module_type,
                        key_recommendations: content.key_recommendations
                      });
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>📑 MD</span>
                  </button>
                  <button
                    onClick={() => handleExportJson(selectedBlueprint)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>⚙️ JSON</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedBlueprint(null)}
                  className="px-5 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
