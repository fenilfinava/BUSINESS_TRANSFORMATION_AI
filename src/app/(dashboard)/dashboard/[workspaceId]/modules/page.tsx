"use client";

import { motion } from "framer-motion";
import { 
  Bot, 
  Lightbulb, 
  Search, 
  Briefcase, 
  Map, 
  Cpu, 
  Workflow, 
  PenTool, 
  Database, 
  Clock, 
  BarChart3,
  ArrowRight
} from "lucide-react";

const aiModules = [
  { id: 1, name: "AI Transformation Companion", desc: "Understands business goals, learns context, identifies opportunities & guides your transformation journey.", icon: Bot, color: "text-blue-500", bg: "bg-blue-100" },
  { id: 2, name: "AI Solution Builder", desc: "Recommends AI solutions, automation opportunities, tech stacks & implementation approaches.", icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-100" },
  { id: 3, name: "Business Analysis Engine", desc: "Requirement discovery, process analysis, gap analysis, digital maturity assessment & future state analysis.", icon: Search, color: "text-emerald-500", bg: "bg-emerald-100" },
  { id: 4, name: "AI Business Consultant", desc: "Validates ideas, asks discovery questions & recommends best practices, AI adoption & technology stacks.", icon: Briefcase, color: "text-orange-500", bg: "bg-orange-100" },
  { id: 5, name: "Transformation Planner", desc: "Generates transformation roadmaps for AI adoption, automation, modernization, cloud migration & more.", icon: Map, color: "text-purple-500", bg: "bg-purple-100" },
  { id: 6, name: "Solution Architecture Builder", desc: "Recommends HLD, LLD, architecture, integrations, infrastructure, cloud, security & deployment.", icon: Cpu, color: "text-indigo-500", bg: "bg-indigo-100" },
  { id: 7, name: "Process Intelligence Designer", desc: "Creates workflows, BPMN diagrams, process maps, swimlane diagrams & optimization recommendations.", icon: Workflow, color: "text-green-500", bg: "bg-green-100" },
  { id: 8, name: "AI UX Designer", desc: "Generates wireframes, dashboard concepts, navigation flows, user journeys & UX recommendations.", icon: PenTool, color: "text-pink-500", bg: "bg-pink-100" },
  { id: 9, name: "Database & Integration Designer", desc: "Recommends ER diagrams, database schema, APIs, integration architecture & data flow diagrams.", icon: Database, color: "text-teal-500", bg: "bg-teal-100" },
  { id: 10, name: "AI Planning Engine", desc: "Produces effort estimates, cost estimation, resource planning, timelines, milestones & risk prediction.", icon: Clock, color: "text-cyan-500", bg: "bg-cyan-100" },
  { id: 11, name: "Transformation Dashboard", desc: "Tracks digital maturity, AI readiness, project health, implementation readiness & AI recommendations.", icon: BarChart3, color: "text-rose-500", bg: "bg-rose-100" }
];

export default function ModulesPage() {
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
    </div>
  );
}
