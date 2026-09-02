"use client";

import { motion } from "framer-motion";
import { Layers, Zap, Server, Shield, ArrowRight, FileDown } from "lucide-react";

export default function SolutionsPage() {
  const recommendations = [
    {
      title: "AWS Cloud Native Architecture",
      category: "Architecture",
      icon: Server,
      description: "Migrate legacy on-premise ERP to a modern, scalable AWS architecture using EKS (Kubernetes) and Amazon Aurora.",
      roi: "High",
      complexity: "High",
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Automated Data Pipeline",
      category: "Data & AI",
      icon: Zap,
      description: "Implement a real-time data pipeline using Apache Kafka to sync inventory data across legacy and new systems.",
      roi: "Medium",
      complexity: "Medium",
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      title: "Zero-Trust Security Model",
      category: "Security",
      icon: Shield,
      description: "Adopt a Zero-Trust architecture for all internal APIs and microservices to comply with new regulations.",
      roi: "High",
      complexity: "Medium",
      color: "bg-emerald-100 text-emerald-600"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Recommendations & Solutions</h2>
          <p className="text-slate-500 text-sm mt-2">Based on your discovery sessions, here are the proposed solutions.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 bg-white border border-slate-200 px-5 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <FileDown size={16} />
          <span>Export Report</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((rec, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all group cursor-pointer flex flex-col"
          >
            <div className="flex items-center space-x-3 mb-5">
              <div className={`p-3 rounded-2xl ${rec.color}`}>
                <rec.icon size={22} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{rec.category}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{rec.title}</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed flex-1">{rec.description}</p>
            
            <div className="flex items-center justify-between pt-5 border-t border-slate-100">
              <div className="flex space-x-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ROI</p>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">{rec.roi}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complexity</p>
                  <p className="text-sm font-bold text-amber-600 mt-0.5">{rec.complexity}</p>
                </div>
              </div>
              <div className="text-blue-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                Details <ArrowRight size={14} className="ml-1" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
