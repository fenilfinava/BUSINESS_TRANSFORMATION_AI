"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Search, Save, AlertCircle } from "lucide-react";
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
    </div>
  );
}
