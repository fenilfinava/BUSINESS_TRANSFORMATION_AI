import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, FolderKanban, Settings, Users, LogOut, Zap } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3f4f6] relative flex overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 blur-[120px] pointer-events-none" />
      
      {/* Sidebar - Floating style */}
      <aside className="w-64 my-6 ml-6 rounded-3xl bg-slate-950 text-white flex flex-col h-[calc(100vh-3rem)] shadow-2xl shadow-slate-900/20 border border-slate-800/50 relative overflow-hidden z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
        
        <div className="p-6 border-b border-white/5 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-wide uppercase">AI Nexus</h1>
              <p className="text-[10px] text-blue-300 uppercase tracking-widest font-semibold mt-0.5">Transformation</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-3 relative z-10">
          <Link href="/dashboard/1" className="group flex items-center space-x-4 px-4 py-3 bg-white/10 rounded-2xl text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-white/10">
            <LayoutDashboard size={20} className="text-blue-400" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/dashboard/1/modules" className="group flex items-center space-x-4 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all border border-transparent hover:border-white/5">
            <Zap size={20} className="group-hover:text-yellow-400 transition-colors" />
            <span className="font-medium">AI Modules</span>
          </Link>
          <Link href="/dashboard/1/projects" className="group flex items-center space-x-4 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all border border-transparent hover:border-white/5">
            <FolderKanban size={20} className="group-hover:text-purple-400 transition-colors" />
            <span className="font-medium">Projects</span>
          </Link>
          <Link href="/dashboard/1/team" className="group flex items-center space-x-4 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all border border-transparent hover:border-white/5">
            <Users size={20} className="group-hover:text-emerald-400 transition-colors" />
            <span className="font-medium">Team</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-white/5 relative z-10 space-y-2">
          <Link href="/dashboard/1/settings" className="group flex items-center space-x-4 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all">
            <Settings size={20} className="group-hover:text-slate-300 transition-colors" />
            <span className="font-medium text-sm">Settings</span>
          </Link>
          <Link href="/workspaces" className="group flex items-center space-x-4 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all mt-2">
            <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
            <span className="font-medium text-sm">Exit Workspace</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        {/* Header - Transparent & Floating */}
        <header className="h-24 flex items-center justify-between px-10 pt-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Acme Corp Workspace</h2>
            <span className="bg-white/60 backdrop-blur-md border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-500 shadow-sm">Enterprise</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/dashboard/1/settings" className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all">
              <Settings size={18} />
            </Link>
            
            <div className="relative group cursor-pointer">
              <div className="h-11 w-11 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white transition-transform group-hover:scale-105">
                U
              </div>
              <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right group-hover:scale-100 scale-95 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-800">User Profile</p>
                  <p className="text-xs text-slate-500 mt-0.5">user@example.com</p>
                </div>
                <div className="p-2">
                  <Link href="/dashboard/1/settings" className="block px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Account Settings</Link>
                  <Link href="/workspaces" className="block px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Switch Workspace</Link>
                </div>
                <div className="p-2 border-t border-slate-100">
                  <Link href="/login" className="block px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">Sign out</Link>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 px-10 pb-10 overflow-auto no-scrollbar">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
