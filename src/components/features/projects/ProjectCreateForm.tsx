"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";

const projectSchema = z.object({
  name: z.string().min(3, { message: "Project name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  industry: z.string().min(1, { message: "Please select an industry" }),
  teamSize: z.string().min(1, { message: "Please select a team size" }),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectCreateForm({ workspaceId }: { workspaceId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (data: ProjectFormValues) => {
    setIsLoading(true);
    console.log("Creating project:", data);
    
    setTimeout(() => {
      setIsLoading(false);
      alert("Project created successfully! (Mock)");
      router.push(`/dashboard/${workspaceId}`);
    }, 1500);
  };

  const inputClass = "block w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-900 sm:text-sm";

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
        <input
          id="name"
          type="text"
          {...register("name")}
          placeholder="e.g. ERP Cloud Migration"
          className={inputClass}
        />
        {errors.name && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-bold text-slate-700 mb-2">Description</label>
        <textarea
          id="description"
          rows={4}
          {...register("description")}
          placeholder="Describe the goals and objectives of this project..."
          className={inputClass}
        />
        {errors.description && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="industry" className="block text-sm font-bold text-slate-700 mb-2">Industry</label>
          <select id="industry" {...register("industry")} className={inputClass}>
            <option value="">Select Industry</option>
            <option value="finance">Financial Services</option>
            <option value="healthcare">Healthcare</option>
            <option value="retail">Retail & E-commerce</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="technology">Technology & Software</option>
            <option value="other">Other</option>
          </select>
          {errors.industry && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.industry.message}</p>}
        </div>

        <div>
          <label htmlFor="teamSize" className="block text-sm font-bold text-slate-700 mb-2">Target Team Size</label>
          <select id="teamSize" {...register("teamSize")} className={inputClass}>
            <option value="">Select Size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="500+">500+ employees</option>
          </select>
          {errors.teamSize && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.teamSize.message}</p>}
        </div>
      </div>

      <div className="pt-5 flex justify-end space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => router.push(`/dashboard/${workspaceId}`)}
          className="bg-white py-3 px-6 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-lg shadow-blue-500/30 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 cursor-pointer transition-all"
        >
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Creating...</>
          ) : (
            <><Rocket size={16} className="mr-2" /> Create Project</>
          )}
        </motion.button>
      </div>
    </form>
  );
}
