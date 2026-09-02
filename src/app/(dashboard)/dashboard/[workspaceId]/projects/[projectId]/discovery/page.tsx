"use client";

import { motion } from "framer-motion";
import { DiscoveryForm } from "@/components/features/discovery/DiscoveryForm";
import { Search } from "lucide-react";

export default function DiscoveryPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 overflow-hidden"
    >
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
          <Search size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Business Discovery Session</h2>
          <p className="text-slate-500 text-sm mt-1">Walk through a guided questionnaire to capture your business context.</p>
        </div>
      </div>
      <DiscoveryForm />
    </motion.div>
  );
}
