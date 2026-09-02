"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const steps = ["Business Context", "Current Challenges", "Tech Stack", "Goals & Budget"];

export function DiscoveryForm() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const inputClass = "block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900";

  return (
    <div>
      {/* Stepper */}
      <div className="mb-10 border-b border-slate-100 pb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <motion.div 
                animate={{ 
                  scale: index === currentStep ? 1.1 : 1,
                  backgroundColor: index < currentStep ? "#dcfce7" : index === currentStep ? "#2563eb" : "#f1f5f9"
                }}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all
                  ${index < currentStep ? 'text-green-600' : 
                    index === currentStep ? 'text-white shadow-lg shadow-blue-500/30' : 
                    'text-slate-500'}`}
              >
                {index < currentStep ? <CheckCircle size={18} /> : index + 1}
              </motion.div>
              <span className={`mt-2.5 text-xs font-bold ${index <= currentStep ? 'text-slate-900' : 'text-slate-400'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <motion.div 
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[250px]"
      >
        {currentStep === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Company Overview</label>
              <textarea rows={4} className={inputClass} placeholder="Describe what the company does..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
              <input type="text" className={inputClass} placeholder="Who are your customers?" />
            </div>
          </div>
        )}
        
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Primary Pain Points</label>
              <textarea rows={4} className={inputClass} placeholder="What are the main problems you are trying to solve?" />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Current Technologies</label>
              <input type="text" className={inputClass} placeholder="e.g. AWS, React, Node.js" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Legacy Systems to Migrate</label>
              <textarea rows={3} className={inputClass} placeholder="Describe any legacy systems..." />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Key Performance Indicators (KPIs)</label>
              <textarea rows={3} className={inputClass} placeholder="How will you measure success?" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Timeline</label>
                <select className={inputClass}>
                  <option>1-3 Months</option>
                  <option>3-6 Months</option>
                  <option>6+ Months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Budget Range</label>
                <select className={inputClass}>
                  <option>&lt; $50k</option>
                  <option>$50k - $200k</option>
                  <option>&gt; $200k</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-10 flex justify-between pt-5 border-t border-slate-100">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={prevStep} 
          disabled={currentStep === 0}
          className="px-6 py-3 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition-all"
        >
          Previous
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={nextStep}
          className="px-6 py-3 border border-transparent rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 cursor-pointer transition-all"
        >
          {currentStep === steps.length - 1 ? 'Submit & Analyze' : 'Next Step'}
        </motion.button>
      </div>
    </div>
  );
}
