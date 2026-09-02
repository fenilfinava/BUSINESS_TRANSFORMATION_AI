"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Lightbulb, Search, Briefcase, Map, Cpu, Workflow, 
  PenTool, Database, Clock, BarChart3, ArrowRight, X, Loader2, 
  ChevronDown, Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const aiModules = [
  { id: 1, name: "AI Transformation Companion", slug: "transformation_companion", desc: "Understands business goals, learns context, identifies opportunities & guides your transformation journey.", icon: Bot, color: "text-blue-500", bg: "bg-blue-100", format: "markdown" },
  { id: 2, name: "AI Solution Builder", slug: "solution_builder", desc: "Recommends AI solutions, automation opportunities, tech stacks & implementation approaches.", icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-100", format: "markdown" },
  { id: 3, name: "Business Analysis Engine", slug: "business_analysis", desc: "Requirement discovery, process analysis, gap analysis, digital maturity assessment & future state analysis.", icon: Search, color: "text-emerald-500", bg: "bg-emerald-100", format: "markdown" },
  { id: 4, name: "AI Business Consultant", slug: "business_consultant", desc: "Validates ideas, asks discovery questions & recommends best practices, AI adoption & technology stacks.", icon: Briefcase, color: "text-orange-500", bg: "bg-orange-100", format: "markdown" },
  { id: 5, name: "Transformation Planner", slug: "transformation_planner", desc: "Generates transformation roadmaps for AI adoption, automation, modernization, cloud migration & more.", icon: Map, color: "text-purple-500", bg: "bg-purple-100", format: "markdown" },
  { id: 6, name: "Solution Architecture Builder", slug: "architecture", desc: "Recommends HLD, LLD, architecture, integrations, infrastructure, cloud, security & deployment.", icon: Cpu, color: "text-indigo-500", bg: "bg-indigo-100", format: "mermaid" },
  { id: 7, name: "Process Intelligence Designer", slug: "process_design", desc: "Creates workflows, BPMN diagrams, process maps, swimlane diagrams & optimization recommendations.", icon: Workflow, color: "text-green-500", bg: "bg-green-100", format: "mermaid" },
  { id: 8, name: "AI UX Designer", slug: "ux_wireframe", desc: "Generates wireframes, dashboard concepts, navigation flows, user journeys & UX recommendations.", icon: PenTool, color: "text-pink-500", bg: "bg-pink-100", format: "json" },
  { id: 9, name: "Database & Integration Designer", slug: "database_schema", desc: "Recommends ER diagrams, database schema, APIs, integration architecture & data flow diagrams.", icon: Database, color: "text-teal-500", bg: "bg-teal-100", format: "mermaid" },
  { id: 10, name: "AI Planning Engine", slug: "planning_engine", desc: "Produces effort estimates, cost estimation, resource planning, timelines, milestones & risk prediction.", icon: Clock, color: "text-cyan-500", bg: "bg-cyan-100", format: "markdown" },
  { id: 11, name: "Transformation Dashboard", slug: "dashboard_metrics", desc: "Tracks digital maturity, AI readiness, project health, implementation readiness & AI recommendations.", icon: BarChart3, color: "text-rose-500", bg: "bg-rose-100", format: "json" }
];

interface Project {
  id: string;
  name: string;
  description?: string;
}

export default function ModulesPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [activeModule, setActiveModule] = useState<typeof aiModules[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [generatedFormat, setGeneratedFormat] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Fetch projects for this workspace on mount
  useEffect(() => {
    async function loadProjects() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      try {
        const res = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}/projects`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
          if (data.length > 0) setSelectedProject(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    }
    loadProjects();
  }, [workspaceId]);

  const handleLaunchModule = (mod: typeof aiModules[0]) => {
    setActiveModule(mod);
    setGeneratedContent("");
    setGeneratedFormat("");
    setError("");
  };

  const handleGenerate = async () => {
    if (!activeModule || !selectedProject) return;
    setIsGenerating(true);
    setGeneratedContent("");
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("No active session. Please log in again.");
        return;
      }

      const res = await fetch("http://localhost:8000/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          project_id: selectedProject,
          module_type: activeModule.slug
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.detail || "Generation failed.");
        return;
      }

      const data = await res.json();
      setGeneratedContent(data.content);
      setGeneratedFormat(data.format);
    } catch (err: any) {
      setError(err.message || "Network error.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Intelligent Modules</h1>
        <p className="text-slate-500 mt-2 text-lg">Unified Platform. End-to-End Transformation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {aiModules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleLaunchModule(mod)}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all group cursor-pointer flex flex-col h-full"
            >
              <div className="flex-1">
                <div className={`w-14 h-14 rounded-2xl ${mod.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${mod.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">{mod.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{mod.desc}</p>
              </div>
              <div className="mt-6 flex items-center text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Launch Module <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* AI Generation Modal */}
      <AnimatePresence>
        {activeModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setActiveModule(null); setGeneratedContent(""); }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-2xl ${activeModule.bg} flex items-center justify-center`}>
                    <activeModule.icon className={`w-6 h-6 ${activeModule.color}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{activeModule.name}</h2>
                    <p className="text-sm text-slate-500">Output format: {activeModule.format}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveModule(null); setGeneratedContent(""); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                {/* Project Selector */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Project</label>
                  {projects.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      No projects found. Create a project first to use AI modules.
                    </p>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 sm:text-sm appearance-none"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedProject || projects.length === 0}
                  className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent shadow-lg shadow-blue-500/30 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
                >
                  {isGenerating ? (
                    <><Loader2 size={18} className="animate-spin mr-2" /> Generating with Gemini AI...</>
                  ) : (
                    <><Sparkles size={18} className="mr-2" /> Generate Blueprint</>
                  )}
                </motion.button>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Generated Content */}
                {generatedContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        AI Generated Output — {generatedFormat}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedContent)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-5 text-sm text-slate-800 whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto leading-relaxed font-mono">
                      {generatedContent}
                    </pre>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
