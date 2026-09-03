"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Lightbulb, Search, Briefcase, Map, Cpu, Workflow, 
  PenTool, Database, Clock, BarChart3, ShieldCheck, ArrowRight, X, Loader2, 
  ChevronDown, Sparkles, History, RotateCcw, Calendar, Download, ThumbsUp, ThumbsDown, Check, Send
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { exportToPdf, exportToWord, exportToMarkdown, exportToJson } from "@/utils/exportUtils";

const aiModules = [
  { id: "transformation_planner", name: "Transformation Planner", slug: "transformation_planner", desc: "Generates transformation roadmaps for AI adoption, automation, modernization, cloud migration & more.", icon: Map, color: "text-purple-500", bg: "bg-purple-100", format: "markdown" },
  { id: "solution_architecture", name: "Solution Architecture Builder", slug: "solution_architecture", desc: "Recommends High-Level (HLD) & Low-Level Design (LLD), microservices, cloud infrastructure & network security.", icon: Cpu, color: "text-indigo-500", bg: "bg-indigo-100", format: "markdown" },
  { id: "database_designer", name: "Database & Integration Designer", slug: "database_designer", desc: "Recommends ER diagrams, database schema, SQL tables, relational models, primary/foreign keys & indexing.", icon: Database, color: "text-teal-500", bg: "bg-teal-100", format: "markdown" },
  { id: "process_intelligence", name: "Process Intelligence Designer", slug: "process_intelligence", desc: "Creates BPMN workflows, swimlane diagrams, process maps, automation triggers & optimization recommendations.", icon: Workflow, color: "text-green-500", bg: "bg-green-100", format: "markdown" },
  { id: "ux_designer", name: "AI UX Designer", slug: "ux_designer", desc: "Generates wireframes, dashboard concepts, navigation flows, user journeys & component hierarchies.", icon: PenTool, color: "text-pink-500", bg: "bg-pink-100", format: "markdown" },
  { id: "planning_engine", name: "AI Planning Engine", slug: "planning_engine", desc: "Produces effort estimates, story points, role planning, timelines, milestones, budget estimates & risk prediction.", icon: Clock, color: "text-cyan-500", bg: "bg-cyan-100", format: "markdown" },
  { id: "transformation_companion", name: "AI Transformation Companion", slug: "transformation_companion", desc: "Understands business goals, learns context, identifies opportunities & guides your transformation journey.", icon: Bot, color: "text-blue-500", bg: "bg-blue-100", format: "markdown" },
  { id: "solution_builder", name: "AI Solution Builder", slug: "solution_builder", desc: "Recommends AI solutions, automation opportunities, tech stacks & implementation approaches.", icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-100", format: "markdown" },
  { id: "business_analysis", name: "Business Analysis Engine", slug: "business_analysis", desc: "Requirement discovery, process analysis, gap analysis, digital maturity assessment & future state analysis.", icon: Search, color: "text-emerald-500", bg: "bg-emerald-100", format: "markdown" },
  { id: "business_consultant", name: "AI Business Consultant", slug: "business_consultant", desc: "Validates ideas, asks discovery questions & recommends best practices, AI adoption & technology stacks.", icon: Briefcase, color: "text-orange-500", bg: "bg-orange-100", format: "markdown" },
  { id: "transformation_dashboard", name: "Transformation Dashboard", slug: "transformation_dashboard", desc: "Tracks digital maturity, AI readiness, project health, implementation readiness & AI recommendations.", icon: BarChart3, color: "text-rose-500", bg: "bg-rose-100", format: "markdown" },
  { id: "security_compliance", name: "Security & Compliance Guardian", slug: "security_compliance", desc: "Zero-trust architecture, regulatory compliance mapping (SOC2, HIPAA, GDPR), IAM policies & vulnerability mitigation.", icon: ShieldCheck, color: "text-violet-500", bg: "bg-violet-100", format: "markdown" }
];

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface BlueprintVersion {
  id: string;
  created_at: string;
  title: string;
  summary: string;
  content: string;
  format: string;
  key_recommendations: string[];
}

export default function ModulesPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [activeModule, setActiveModule] = useState<typeof aiModules[0] | null>(null);

  // AbortController ref for canceling requests
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  // Per-module loading, results, and errors for true concurrency
  const [loadingModules, setLoadingModules] = useState<Record<string, boolean>>({});
  const [moduleResults, setModuleResults] = useState<Record<string, {
    title?: string;
    summary?: string;
    content: string;
    format: string;
    key_recommendations?: string[];
  }>>({});
  const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({});

  // Phase 4: Version history states per module
  const [moduleVersions, setModuleVersions] = useState<Record<string, BlueprintVersion[]>>({});
  const [selectedVersionId, setSelectedVersionId] = useState<Record<string, string>>({});
  const [loadingVersions, setLoadingVersions] = useState<Record<string, boolean>>({});

  // Step 6 & 7: Export & Continuous Optimization states
  const [refinePrompt, setRefinePrompt] = useState<Record<string, string>>({});
  const [isRefining, setIsRefining] = useState<Record<string, boolean>>({});
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down' | null>>({});
  const [showExportMenu, setShowExportMenu] = useState<Record<string, boolean>>({});
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const isValidUUID = (val?: string) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  // Fetch projects for this workspace on mount
  useEffect(() => {
    async function loadProjects() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      try {
        let loadedProjects: Project[] = [];

        // If workspaceId is a valid UUID, fetch from workspace endpoint
        if (isValidUUID(workspaceId)) {
          const res = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}/projects`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            loadedProjects = await res.json();
          }
        }

        // If no projects found or workspaceId was a placeholder, load user's real projects directly
        if (!loadedProjects || loadedProjects.length === 0) {
          const { data: sbProjects } = await supabase
            .from('projects')
            .select('id, name, description')
            .order('created_at', { ascending: false });
          if (sbProjects) {
            loadedProjects = sbProjects;
          }
        }

        // Strictly enforce ONLY real UUIDs - never allow mock IDs like "1", "test", "default"
        const validProjects = (loadedProjects || []).filter(p => isValidUUID(p.id));
        setProjects(validProjects);
        if (validProjects.length > 0) {
          setSelectedProject(validProjects[0].id);
        } else {
          setSelectedProject("");
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    }
    loadProjects();
  }, [workspaceId]);

  // Load versions for a specific module & project
  const loadVersionsForModule = async (slug: string, projectId: string) => {
    if (!slug || !projectId || !isValidUUID(projectId)) return;
    setLoadingVersions(prev => ({ ...prev, [slug]: true }));
    try {
      let rawData: any[] = [];
      const { data, error } = await supabase
        .from('blueprints')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading blueprint versions from Supabase:", error);
      } else if (data && data.length > 0) {
        rawData = data;
      }

      if (rawData.length === 0) {
        // Fallback to FastAPI endpoint
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          try {
            const res = await fetch(`http://localhost:8000/api/ai/blueprints/${projectId}?module_type=${slug}`, {
              headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (res.ok) {
              const backendVersions = await res.json();
              if (backendVersions && backendVersions.length > 0) {
                rawData = backendVersions;
              }
            }
          } catch (e) {
            console.warn("Backend version fetch fallback failed:", e);
          }
        }
      }

      const currentModuleMeta = aiModules.find(m => m.slug === slug);
      const targetSlug = slug.toLowerCase();
      const targetName = (currentModuleMeta?.name || "").toLowerCase();

      const matching = rawData.filter((row: any) => {
        const type = (row.module_type || row.module_name || "").toLowerCase();
        return type === targetSlug || type === targetName;
      });

      const parsed: BlueprintVersion[] = matching.map((row: any) => {
        const contentObj = row.generated_content || row.data || {};
        return {
          id: row.id,
          created_at: row.created_at,
          title: contentObj.title || `${currentModuleMeta?.name || "Blueprint"} Version`,
          summary: contentObj.summary || "",
          content: typeof contentObj === "string" ? contentObj : (contentObj.content || JSON.stringify(contentObj, null, 2)),
          format: contentObj.format || "markdown",
          key_recommendations: Array.isArray(contentObj.key_recommendations) ? contentObj.key_recommendations : []
        };
      });

      setModuleVersions(prev => ({ ...prev, [slug]: parsed }));

      if (parsed.length > 0) {
        // Default to newest if not yet selected
        setSelectedVersionId(prev => {
          const currentId = prev[slug];
          const exists = parsed.some(p => p.id === currentId);
          return { ...prev, [slug]: exists ? currentId : parsed[0].id };
        });

        // If no active result displayed yet, show newest version
        setModuleResults(prev => {
          if (!prev[slug]) {
            return {
              ...prev,
              [slug]: {
                title: parsed[0].title,
                summary: parsed[0].summary,
                content: parsed[0].content,
                format: parsed[0].format,
                key_recommendations: parsed[0].key_recommendations
              }
            };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setLoadingVersions(prev => ({ ...prev, [slug]: false }));
    }
  };

  // Automatically fetch version history when active module or selected project changes
  useEffect(() => {
    if (activeModule && selectedProject) {
      loadVersionsForModule(activeModule.slug, selectedProject);
    }
  }, [activeModule?.slug, selectedProject]);

  const handleSelectVersion = (slug: string, versionId: string) => {
    const versions = moduleVersions[slug] || [];
    const selected = versions.find(v => v.id === versionId);
    if (selected) {
      setSelectedVersionId(prev => ({ ...prev, [slug]: versionId }));
      setModuleResults(prev => ({
        ...prev,
        [slug]: {
          title: selected.title,
          summary: selected.summary,
          content: selected.content,
          format: selected.format,
          key_recommendations: selected.key_recommendations
        }
      }));
    }
  };

  const handleLaunchModule = (mod: typeof aiModules[0]) => {
    setActiveModule(mod);
  };

  const handleGenerate = async (targetModuleSlug?: string) => {
    const slug = targetModuleSlug || activeModule?.slug;
    if (!slug) return;

    if (!selectedProject || !isValidUUID(selectedProject)) {
      setModuleErrors(prev => ({
        ...prev,
        [slug]: "Invalid project ID. Please select a valid project with a real UUID."
      }));
      return;
    }

    // Pull current project description/context
    const currentProject = projects.find(p => p.id === selectedProject);
    const projectDetails = currentProject?.description || currentProject?.name || "Digital transformation and modernization project";

    // Set only this module as loading
    setLoadingModules(prev => ({ ...prev, [slug]: true }));
    setModuleErrors(prev => ({ ...prev, [slug]: "" }));

    // Create and track AbortController for this module
    const controller = new AbortController();
    abortControllersRef.current[slug] = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setModuleErrors(prev => ({ ...prev, [slug]: "No active session. Please log in again." }));
        setLoadingModules(prev => ({ ...prev, [slug]: false }));
        return;
      }

      // Non-blocking fetch with signal, dynamic module_type, and business_context payload
      const res = await fetch("http://localhost:8000/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          project_id: selectedProject,
          module_type: slug,
          business_context: projectDetails
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errData = await res.json();
        setModuleErrors(prev => ({ ...prev, [slug]: errData.detail || "Generation failed." }));
        return;
      }

      const data = await res.json();
      setModuleResults(prev => ({
        ...prev,
        [slug]: {
          title: data.title,
          summary: data.summary,
          content: data.content,
          format: data.format || "markdown",
          key_recommendations: data.key_recommendations || []
        }
      }));

      // Reload versions so the new generation is recorded in the dropdown immediately
      await loadVersionsForModule(slug, selectedProject);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log(`Generation for ${slug} was cancelled.`);
        setModuleErrors(prev => ({ ...prev, [slug]: "Generation cancelled." }));
        return;
      }
      const message = err instanceof Error ? err.message : "Network error.";
      setModuleErrors(prev => ({ ...prev, [slug]: message }));
      console.error(err);
    } finally {
      // Loading state strictly tied to fetch lifecycle
      setLoadingModules(prev => ({ ...prev, [slug]: false }));
      delete abortControllersRef.current[slug];
    }
  };

  const handleRefine = async (slug: string) => {
    const prompt = refinePrompt[slug];
    if (!prompt?.trim() || !selectedProject) return;

    setIsRefining(prev => ({ ...prev, [slug]: true }));
    setModuleErrors(prev => ({ ...prev, [slug]: "" }));

    try {
      const currentResult = moduleResults[slug];
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      const currentProj = projects.find(p => p.id === selectedProject);

      const res = await fetch("http://localhost:8000/api/ai/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: selectedProject,
          module_type: slug,
          previous_content: currentResult?.content || "",
          refinement_prompt: prompt.trim(),
          business_context: currentProj?.description || ""
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to refine blueprint");
      }

      const refined = await res.json();
      setModuleResults(prev => ({
        ...prev,
        [slug]: {
          title: refined.title,
          summary: refined.summary,
          content: refined.content,
          format: refined.format || "markdown",
          key_recommendations: refined.key_recommendations
        }
      }));

      // Refresh version history
      await loadVersionsForModule(slug, selectedProject);
      setRefinePrompt(prev => ({ ...prev, [slug]: "" }));
    } catch (err: any) {
      console.error("Error refining blueprint:", err);
      setModuleErrors(prev => ({ ...prev, [slug]: err.message || "Failed to optimize blueprint." }));
    } finally {
      setIsRefining(prev => ({ ...prev, [slug]: false }));
    }
  };

  const handleFeedback = (slug: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [slug]: type }));
    setExportNotice(type === 'up' ? "Thank you! Feedback recorded to optimize recommendations." : "Feedback recorded. Use the Refine box below to guide the AI.");
    setTimeout(() => setExportNotice(null), 4000);
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
          const isModLoading = !!loadingModules[mod.slug];
          const hasResult = !!moduleResults[mod.slug];

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleLaunchModule(mod)}
              className={`bg-white rounded-3xl p-6 shadow-sm border ${isModLoading ? 'border-amber-300 ring-2 ring-amber-400/20' : hasResult ? 'border-emerald-300' : 'border-slate-200'} hover:shadow-xl hover:shadow-blue-900/5 transition-all group cursor-pointer flex flex-col h-full relative overflow-hidden`}
            >
              <div className="flex-1">
                <div className={`w-14 h-14 rounded-2xl ${mod.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${mod.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">{mod.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{mod.desc}</p>
              </div>
              <div className="mt-6 flex items-center justify-between text-sm font-bold">
                {isModLoading ? (
                  <span className="flex items-center text-amber-600 animate-pulse">
                    <Loader2 size={16} className="animate-spin mr-1.5" /> Generating in background...
                  </span>
                ) : hasResult ? (
                  <span className="flex items-center text-emerald-600">
                    <Sparkles size={16} className="mr-1.5" /> Ready (View Blueprint)
                  </span>
                ) : (
                  <span className="flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Launch Module <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
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
              onClick={() => setActiveModule(null)}
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
                  onClick={() => setActiveModule(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                {/* Project Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-700">Select Project</label>
                    <Link
                      href={`/dashboard/${workspaceId || 'workspaces'}/projects/new`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      + New Project
                    </Link>
                  </div>
                  {projects.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs space-y-2">
                      <p className="font-bold">No valid projects found in this workspace.</p>
                      <p>Create a project first so AI blueprints can be attached to a real project ID.</p>
                      <Link
                        href={`/dashboard/${workspaceId || 'workspaces'}/projects/new`}
                        className="inline-block px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
                      >
                        + Create New Project
                      </Link>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 sm:text-sm appearance-none cursor-pointer"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                </div>

                {/* Phase 4: Version History Dropdown */}
                {activeModule && (moduleVersions[activeModule.slug]?.length ?? 0) > 0 && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <History size={18} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Version History</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200/70 text-indigo-800">
                            {moduleVersions[activeModule.slug].length} {moduleVersions[activeModule.slug].length === 1 ? 'generation' : 'generations'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {selectedVersionId[activeModule.slug] === moduleVersions[activeModule.slug][0]?.id
                            ? "Displaying latest version"
                            : "Viewing previous version (swap dates below)"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1 sm:flex-initial">
                        <select
                          value={selectedVersionId[activeModule.slug] || moduleVersions[activeModule.slug][0]?.id}
                          onChange={(e) => handleSelectVersion(activeModule.slug, e.target.value)}
                          className="w-full sm:w-auto pl-3 pr-8 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none shadow-2xs"
                        >
                          {moduleVersions[activeModule.slug].map((ver, idx) => {
                            const date = new Date(ver.created_at);
                            const isLatest = idx === 0;
                            const label = `${isLatest ? "★ Latest • " : `v${moduleVersions[activeModule.slug].length - idx} • `}${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
                            return (
                              <option key={ver.id} value={ver.id}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>

                      <Link 
                        href={`/dashboard/${workspaceId}/history`}
                        title="View Full History Log"
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-xl transition-colors flex-shrink-0"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Generate / Regenerate Button & Cancel Action */}
                <div className="space-y-2.5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenerate(activeModule.slug)}
                    disabled={loadingModules[activeModule.slug] || !selectedProject || projects.length === 0}
                    className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent shadow-lg shadow-blue-500/30 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loadingModules[activeModule.slug] ? (
                      <><Loader2 size={18} className="animate-spin mr-2" /> Generating {activeModule.name}...</>
                    ) : (moduleVersions[activeModule.slug]?.length ?? 0) > 0 ? (
                      <><Sparkles size={18} className="mr-2" /> Regenerate {activeModule.name} (Saves New Version)</>
                    ) : (
                      <><Sparkles size={18} className="mr-2" /> Generate {activeModule.name}</>
                    )}
                  </motion.button>

                  {loadingModules[activeModule.slug] && (
                    <motion.button
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        if (abortControllersRef.current[activeModule.slug]) {
                          abortControllersRef.current[activeModule.slug].abort();
                        }
                      }}
                      className="w-full flex items-center justify-center py-2.5 px-4 border border-rose-200 text-sm font-bold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      <X size={16} className="mr-1.5" /> Cancel Generation
                    </motion.button>
                  )}
                </div>

                {/* Error Display */}
                {moduleErrors[activeModule.slug] && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
                    {moduleErrors[activeModule.slug]}
                  </div>
                )}

                {/* Generated Content */}
                {moduleResults[activeModule.slug] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden space-y-3"
                  >
                    <div className="px-5 py-3.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            AI Generated Blueprint • {moduleResults[activeModule.slug].format}
                          </span>
                          {selectedVersionId[activeModule.slug] && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {selectedVersionId[activeModule.slug] === moduleVersions[activeModule.slug]?.[0]?.id ? "Latest" : "Historical"}
                            </span>
                          )}
                        </div>
                        {moduleResults[activeModule.slug].title && (
                          <h4 className="text-base font-black text-slate-900 mt-0.5">
                            {moduleResults[activeModule.slug].title}
                          </h4>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Step 6: Multi-format Export Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowExportMenu(prev => ({ ...prev, [activeModule.slug]: !prev[activeModule.slug] }))}
                            className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs cursor-pointer transition-all"
                          >
                            <Download size={14} className="text-blue-600" />
                            <span>Export</span>
                            <ChevronDown size={12} className="text-slate-400" />
                          </button>

                          {showExportMenu[activeModule.slug] && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs font-semibold space-y-0.5 animate-in fade-in zoom-in-95">
                              <button
                                onClick={() => {
                                  const curProj = projects.find(p => p.id === selectedProject);
                                  exportToPdf({
                                    title: moduleResults[activeModule.slug].title || activeModule.name,
                                    summary: moduleResults[activeModule.slug].summary,
                                    content: moduleResults[activeModule.slug].content,
                                    projectName: curProj?.name,
                                    module_name: activeModule.name,
                                    key_recommendations: moduleResults[activeModule.slug].key_recommendations
                                  });
                                  setShowExportMenu(prev => ({ ...prev, [activeModule.slug]: false }));
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center justify-between cursor-pointer"
                              >
                                <span>📄 PDF Report</span>
                                <span className="text-[10px] text-slate-400 font-mono">.pdf</span>
                              </button>
                              <button
                                onClick={() => {
                                  const curProj = projects.find(p => p.id === selectedProject);
                                  exportToWord({
                                    title: moduleResults[activeModule.slug].title || activeModule.name,
                                    summary: moduleResults[activeModule.slug].summary,
                                    content: moduleResults[activeModule.slug].content,
                                    projectName: curProj?.name,
                                    module_name: activeModule.name,
                                    key_recommendations: moduleResults[activeModule.slug].key_recommendations
                                  });
                                  setShowExportMenu(prev => ({ ...prev, [activeModule.slug]: false }));
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center justify-between cursor-pointer"
                              >
                                <span>📝 Word Document</span>
                                <span className="text-[10px] text-slate-400 font-mono">.doc</span>
                              </button>
                              <button
                                onClick={() => {
                                  const curProj = projects.find(p => p.id === selectedProject);
                                  exportToMarkdown({
                                    title: moduleResults[activeModule.slug].title || activeModule.name,
                                    summary: moduleResults[activeModule.slug].summary,
                                    content: moduleResults[activeModule.slug].content,
                                    projectName: curProj?.name,
                                    module_name: activeModule.name,
                                    key_recommendations: moduleResults[activeModule.slug].key_recommendations
                                  });
                                  setShowExportMenu(prev => ({ ...prev, [activeModule.slug]: false }));
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center justify-between cursor-pointer"
                              >
                                <span>📑 Markdown</span>
                                <span className="text-[10px] text-slate-400 font-mono">.md</span>
                              </button>
                              <button
                                onClick={() => {
                                  const curProj = projects.find(p => p.id === selectedProject);
                                  exportToJson({
                                    title: moduleResults[activeModule.slug].title || activeModule.name,
                                    summary: moduleResults[activeModule.slug].summary,
                                    content: moduleResults[activeModule.slug].content,
                                    projectName: curProj?.name,
                                    module_name: activeModule.name,
                                    key_recommendations: moduleResults[activeModule.slug].key_recommendations
                                  });
                                  setShowExportMenu(prev => ({ ...prev, [activeModule.slug]: false }));
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center justify-between cursor-pointer"
                              >
                                <span>⚙️ JSON Spec</span>
                                <span className="text-[10px] text-slate-400 font-mono">.json</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => navigator.clipboard.writeText(moduleResults[activeModule.slug].content)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {moduleResults[activeModule.slug].summary && (
                      <div className="mx-5 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                        <span className="font-bold text-blue-700 uppercase tracking-wider text-[10px] block mb-1">Executive Summary</span>
                        {moduleResults[activeModule.slug].summary}
                      </div>
                    )}

                    {moduleResults[activeModule.slug].key_recommendations && moduleResults[activeModule.slug].key_recommendations!.length > 0 && (
                      <div className="mx-5">
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1.5">Key Recommendations</span>
                        <div className="flex flex-wrap gap-1.5">
                          {moduleResults[activeModule.slug].key_recommendations!.map((rec, idx) => (
                            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs">
                              • {rec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="px-5">
                      <pre className="p-4 text-sm text-slate-800 whitespace-pre-wrap overflow-x-auto max-h-[360px] overflow-y-auto leading-relaxed font-mono bg-white rounded-xl border border-slate-200">
                        {moduleResults[activeModule.slug].content}
                      </pre>
                    </div>

                    {/* Step 7: Continuous Optimization & Feedback Section */}
                    <div className="mx-5 mb-5 p-4 bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white rounded-2xl border border-indigo-100 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
                        <div>
                          <h5 className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                            <Sparkles size={14} className="text-indigo-600" />
                            <span>Continuous Optimization & Steering (Step 7)</span>
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            AI learns continuously from your feedback to refine architecture and roadmap recommendations.
                          </p>
                        </div>

                        {/* Thumbs Up / Down Rating */}
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-medium text-slate-500">Rate output:</span>
                          <button
                            onClick={() => handleFeedback(activeModule.slug, 'up')}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${feedbackGiven[activeModule.slug] === 'up' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200'}`}
                            title="Helpful blueprint"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button
                            onClick={() => handleFeedback(activeModule.slug, 'down')}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${feedbackGiven[activeModule.slug] === 'down' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200'}`}
                            title="Needs refinement"
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      </div>

                      {exportNotice && (
                        <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 animate-in fade-in">
                          {exportNotice}
                        </div>
                      )}

                      {/* Interactive Optimization Input */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={refinePrompt[activeModule.slug] || ""}
                            onChange={(e) => setRefinePrompt(prev => ({ ...prev, [activeModule.slug]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleRefine(activeModule.slug);
                              }
                            }}
                            placeholder="e.g. Focus on microservices security, add cost breakdown for AWS..."
                            className="flex-1 bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs placeholder:text-slate-400"
                          />
                          <button
                            onClick={() => handleRefine(activeModule.slug)}
                            disabled={isRefining[activeModule.slug] || !refinePrompt[activeModule.slug]?.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5 cursor-pointer shrink-0"
                          >
                            {isRefining[activeModule.slug] ? (
                              <><Loader2 size={13} className="animate-spin" /><span>Refining...</span></>
                            ) : (
                              <><Send size={13} /><span>Optimize</span></>
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Applies your steering instructions and saves a new version in Supabase version history.
                        </span>
                      </div>
                    </div>
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
