"use client";

import { ProjectCreateForm } from "@/components/features/projects/ProjectCreateForm";
import Link from "next/link";
import { ArrowLeft, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { use } from "react";

export default function NewProjectPage(
  props: { params: Promise<{ workspaceId: string }> }
) {
  const params = use(props.params);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/${params.workspaceId}`}>
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 hover:bg-blue-50 rounded-xl text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </motion.div>
        </Link>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
            <Rocket size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Project</h1>
            <p className="text-slate-500 mt-1 text-sm">Start a new transformation initiative by providing basic details.</p>
          </div>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8"
      >
        <ProjectCreateForm workspaceId={params.workspaceId} />
      </motion.div>
    </div>
  );
}
