"use client";

import { motion } from "framer-motion";
import { Users, Mail, Shield, UserPlus } from "lucide-react";

export default function TeamPage() {
  const teamMembers = [
    { id: "1", name: "Alice Johnson", email: "alice@acmecorp.com", role: "Workspace Admin", color: "from-blue-500 to-indigo-600" },
    { id: "2", name: "Bob Smith", email: "bob@acmecorp.com", role: "Solution Architect", color: "from-emerald-500 to-teal-600" },
    { id: "3", name: "Charlie Davis", email: "charlie@acmecorp.com", role: "Business Analyst", color: "from-purple-500 to-pink-600" },
    { id: "4", name: "Diana Lee", email: "diana@acmecorp.com", role: "AI Engineer", color: "from-orange-500 to-red-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage access and roles for your workspace members.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30"
        >
          <UserPlus size={18} />
          <span>Invite Member</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {teamMembers.map((member, i) => (
          <motion.div 
            key={member.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -2, scale: 1.01 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-5">
              <div className={`h-14 w-14 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:scale-110 transition-transform`}>
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{member.name}</h3>
                <div className="flex items-center text-sm text-slate-500 mt-1 space-x-3">
                  <span className="flex items-center"><Mail size={14} className="mr-1.5 text-slate-400" /> {member.email}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200">
                <Shield size={14} className="mr-2 text-blue-500" /> {member.role}
              </span>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-blue-600 hover:bg-blue-50 font-bold text-sm px-4 py-2 rounded-xl transition-colors"
              >
                Edit
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
