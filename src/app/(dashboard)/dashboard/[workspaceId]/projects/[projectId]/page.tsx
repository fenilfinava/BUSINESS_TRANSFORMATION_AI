"use client";

import { motion } from "framer-motion";
import { Activity, Target, Clock, TrendingUp, MessageSquare, Search, Lightbulb } from "lucide-react";
import Link from "next/link";

export default function ProjectOverview() {
  const stats = [
    { label: "Discovery Score", value: "72%", icon: Search, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "AI Insights", value: "18", icon: Lightbulb, color: "text-yellow-600", bg: "bg-yellow-100" },
    { label: "Project Health", value: "Good", icon: Activity, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Days Active", value: "34", icon: Clock, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  const quickActions = [
    { label: "Start Discovery", desc: "Begin a guided business analysis session", icon: Search, href: "discovery", color: "from-emerald-500 to-teal-600" },
    { label: "AI Chat", desc: "Ask AI to generate architectures & solutions", icon: MessageSquare, href: "chat", color: "from-blue-500 to-indigo-600" },
    { label: "View Solutions", desc: "Review AI-generated recommendations", icon: Lightbulb, href: "solutions", color: "from-purple-500 to-pink-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className={`w-11 h-11 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-black text-slate-900 mb-5">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-lg">{action.label}</h4>
                  <p className="text-sm text-slate-500 mt-1">{action.desc}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Info Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100"
      >
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 mt-0.5">
            <TrendingUp size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">AI Insight</h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Based on your discovery data, this project has strong alignment with cloud-native architecture patterns. 
              Navigate to the <strong className="text-blue-600">AI Chat</strong> to get instant recommendations, 
              or explore <strong className="text-blue-600">Solutions</strong> to see generated blueprints.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
