"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { AnimatedBackground } from "@/components/common/AnimatedBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <AnimatedBackground />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col items-center"
      >
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20 mb-4">
          <Zap size={32} className="text-white fill-white" />
        </div>
        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          AI Nexus
        </h2>
        <p className="mt-2 text-center text-sm text-blue-600 font-semibold tracking-widest uppercase">
          Transformation Platform
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-white/70 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-slate-200/50 border border-white sm:rounded-3xl sm:px-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
