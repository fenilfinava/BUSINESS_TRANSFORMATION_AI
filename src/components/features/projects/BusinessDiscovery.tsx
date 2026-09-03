"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Search, Save, AlertCircle, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface BusinessDiscoveryProps {
  projectId: string;
}

const steps = ["Business Context", "Current Challenges", "Tech Stack", "Goals & Budget"];

export function BusinessDiscovery({ projectId }: BusinessDiscoveryProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Discovery Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);

  // Form State
  const [companyOverview, setCompanyOverview] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [currentTech, setCurrentTech] = useState("");
  const [legacySystems, setLegacySystems] = useState("");
  const [kpis, setKpis] = useState("");
  const [timeline, setTimeline] = useState("3-6 Months");
  const [budget, setBudget] = useState("$50k - $200k");

  useEffect(() => {
    async function loadExistingContext() {
      if (!projectId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("context_description")
        .eq("id", projectId)
        .single();

      if (data?.context_description) {
        setCompanyOverview(data.context_description);
      }
    }
    loadExistingContext();
  }, [projectId]);

  const handleSaveDiscovery = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const summaryContext = [
        companyOverview ? `Overview: ${companyOverview}` : "",
        targetAudience ? `Audience: ${targetAudience}` : "",
        painPoints ? `Pain Points: ${painPoints}` : "",
        currentTech ? `Tech: ${currentTech}` : "",
        legacySystems ? `Legacy Systems: ${legacySystems}` : "",
        kpis ? `KPIs: ${kpis}` : "",
        `Timeline: ${timeline}`,
        `Budget: ${budget}`,
      ]
        .filter(Boolean)
        .join(" | ");

      const { error } = await supabase
        .from("projects")
        .update({ context_description: summaryContext })
        .eq("id", projectId);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      // Trigger Gemini AI Discovery Analysis
      setIsAnalyzing(true);
      try {
        const aiRes = await fetch("/api/ai/discovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            companyOverview,
            targetAudience,
            painPoints,
            currentTech,
            legacySystems,
            kpis,
            timeline,
            budget
          })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.analysis) {
            setAiAnalysis(aiData.analysis);
          }
        }
      } catch (aiErr) {
        console.warn("AI Discovery generation error:", aiErr);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (err: any) {
      console.error("Failed to save discovery context:", err);
      setErrorMessage(err.message || "Failed to save discovery context.");
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSaveDiscovery();
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const inputClass =
    "block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900";

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
            <Search size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Business Discovery Session</h2>
            <p className="text-slate-500 text-sm mt-1">
              Capture strategic requirements to power personalized AI blueprints.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 text-sm text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl font-bold border border-emerald-200"
          >
            <CheckCircle size={16} />
            <span>Saved to Project</span>
          </motion.div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center space-x-2">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stepper Header */}
      <div className="border-b border-slate-100 pb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <motion.div
                animate={{
                  scale: index === currentStep ? 1.08 : 1,
                  backgroundColor: index < currentStep ? "#dcfce7" : index === currentStep ? "#2563eb" : "#f1f5f9",
                }}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all
                  ${index < currentStep ? "text-green-600" : index === currentStep ? "text-white shadow-lg shadow-blue-500/30" : "text-slate-500"}`}
              >
                {index < currentStep ? <CheckCircle size={18} /> : index + 1}
              </motion.div>
              <span
                className={`mt-2.5 text-xs font-bold ${index <= currentStep ? "text-slate-900" : "text-slate-400"}`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="min-h-[260px]"
      >
        {currentStep === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Company Overview & Mission</label>
              <textarea
                rows={4}
                value={companyOverview}
                onChange={e => setCompanyOverview(e.target.value)}
                className={inputClass}
                placeholder="Describe what the company does, its core products, and business goals..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Target Customers & Market</label>
              <input
                type="text"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                className={inputClass}
                placeholder="e.g. Enterprise B2B clients, retail consumers, healthcare providers..."
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Primary Pain Points & Bottlenecks</label>
              <textarea
                rows={4}
                value={painPoints}
                onChange={e => setPainPoints(e.target.value)}
                className={inputClass}
                placeholder="What are the critical operational, technical, or cost challenges to solve?"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Current Technologies in Use</label>
              <input
                type="text"
                value={currentTech}
                onChange={e => setCurrentTech(e.target.value)}
                className={inputClass}
                placeholder="e.g. AWS, Oracle, Postgres, React, Docker..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Legacy Systems to Modernize</label>
              <textarea
                rows={3}
                value={legacySystems}
                onChange={e => setLegacySystems(e.target.value)}
                className={inputClass}
                placeholder="Describe on-prem servers, legacy databases, or monolithic software to replace..."
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Key Performance Indicators (KPIs)</label>
              <textarea
                rows={3}
                value={kpis}
                onChange={e => setKpis(e.target.value)}
                className={inputClass}
                placeholder="e.g. 40% reduction in processing time, 99.99% uptime, $2M cost savings..."
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Timeline</label>
                <select value={timeline} onChange={e => setTimeline(e.target.value)} className={inputClass}>
                  <option>1-3 Months</option>
                  <option>3-6 Months</option>
                  <option>6-12 Months</option>
                  <option>1+ Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Budget Range</label>
                <select value={budget} onChange={e => setBudget(e.target.value)} className={inputClass}>
                  <option>&lt; $50k</option>
                  <option>$50k - $200k</option>
                  <option>$200k - $500k</option>
                  <option>&gt; $500k</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-slate-100">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-all"
        >
          Previous
        </motion.button>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveDiscovery}
            disabled={isSaving}
            className="px-5 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center space-x-2 transition-all"
          >
            <Save size={16} />
            <span>{isSaving ? "Saving..." : "Save Progress"}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={nextStep}
            disabled={isSaving}
            className="px-6 py-3 border border-transparent rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 cursor-pointer transition-all"
          >
            {currentStep === steps.length - 1 ? (isSaving ? "Saving..." : "Complete & Save") : "Next Step"}
          </motion.button>
        </div>
      </div>

      {/* AI Discovery Analysis Section */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center space-x-4 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Loader2 size={20} className="animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">Formulating AI Strategic Analysis...</h4>
            <p className="text-xs text-blue-700 mt-0.5">
              Gemini is identifying digital maturity gaps, automation opportunities, and target architectures from your discovery session.
            </p>
          </div>
        </motion.div>
      )}

      {aiAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-2xl border border-indigo-800/50 space-y-6"
        >
          <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
            <div className="bg-indigo-500/20 text-indigo-300 p-2.5 rounded-xl border border-indigo-400/30">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                Step 2 &bull; AI Opportunity Discovery
              </span>
              <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
                Strategic Discovery Analysis
              </h3>
            </div>
          </div>

          {aiAnalysis.summary && (
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-slate-200 leading-relaxed">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                Executive Synthesis
              </span>
              {aiAnalysis.summary}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiAnalysis.gap_analysis && aiAnalysis.gap_analysis.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <AlertCircle size={14} />
                  <span>Identified Gaps & Constraints</span>
                </span>
                <div className="space-y-2">
                  {aiAnalysis.gap_analysis.map((gap: string, i: number) => (
                    <div key={i} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-100 flex items-start space-x-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis.ai_opportunities && aiAnalysis.ai_opportunities.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle size={14} />
                  <span>High-Impact AI & Automation Initiatives</span>
                </span>
                <div className="space-y-2">
                  {aiAnalysis.ai_opportunities.map((opp: string, i: number) => (
                    <div key={i} className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-100 flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">&check;</span>
                      <span>{opp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {aiAnalysis.recommended_architecture && (
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-300 space-y-1.5">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                Target Architecture Recommendation
              </span>
              <p className="leading-relaxed">{aiAnalysis.recommended_architecture}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
