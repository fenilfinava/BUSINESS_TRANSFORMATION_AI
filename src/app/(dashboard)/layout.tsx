"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, Settings, Users, LogOut, Zap, History } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = (params?.workspaceId as string) || "";
  const [workspaceName, setWorkspaceName] = useState<string>("Workspace");
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // 1. Strict Route Protection
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!session || error) {
          console.log("No active session found in dashboard. Redirecting to login...");
          router.replace('/login');
          return;
        }
        if (session.user?.email) {
          setUserEmail(session.user.email);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        router.replace('/login');
      } finally {
        setIsAuthChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  // 2. Fetch Real Workspace Info
  useEffect(() => {
    async function loadWorkspaceInfo() {
      if (!workspaceId) return;
      try {
        const { data } = await supabase
          .from("workspaces")
          .select("name")
          .eq("id", workspaceId)
          .single();
        if (data?.name) {
          setWorkspaceName(data.name);
        }
      } catch (err) {
        console.error("Failed to load workspace info:", err);
      }
    }
    loadWorkspaceInfo();
  }, [workspaceId]);

  // 3. Clear Session & Flush Cache on Sign Out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    router.replace('/login');
    router.refresh();
  };

  const handleSwitchWorkspace = () => {
    router.push('/workspaces');
    router.refresh();
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentWsId = workspaceId || "1";

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
          {[
            { name: "Dashboard", href: `/dashboard/${currentWsId}`, exact: true, icon: LayoutDashboard, iconColor: "text-blue-400" },
            { name: "AI Modules", href: `/dashboard/${currentWsId}/modules`, exact: false, icon: Zap, iconColor: "text-yellow-400" },
            { name: "Projects", href: `/dashboard/${currentWsId}/projects`, exact: false, icon: FolderKanban, iconColor: "text-purple-400" },
            { name: "History", href: `/dashboard/${currentWsId}/history`, exact: false, icon: History, iconColor: "text-indigo-400" },
            { name: "Team", href: `/dashboard/${currentWsId}/team`, exact: false, icon: Users, iconColor: "text-emerald-400" },
          ].map((link) => {
            const isActive = link.exact 
              ? pathname === link.href 
              : pathname.startsWith(link.href);
              
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name}
                href={link.href} 
                className={`group flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all border ${
                  isActive 
                    ? "bg-white/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] border-white/10" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent hover:border-white/5"
                }`}
              >
                <Icon size={20} className={`${isActive ? link.iconColor : 'group-hover:' + link.iconColor} transition-colors`} />
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/5 relative z-10 space-y-2">
          <Link 
            href={`/dashboard/${currentWsId}/settings`} 
            className={`group flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all ${
              pathname.startsWith(`/dashboard/${currentWsId}/settings`)
                ? "bg-white/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-white/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5"
            }`}
          >
            <Settings size={20} className={`${pathname.startsWith(`/dashboard/${currentWsId}/settings`) ? 'text-slate-300' : 'group-hover:text-slate-300'} transition-colors`} />
            <span className="font-medium text-sm">Settings</span>
          </Link>
          <button onClick={handleSwitchWorkspace} className="w-full text-left group flex items-center space-x-4 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all mt-2 cursor-pointer">
            <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
            <span className="font-medium text-sm">Exit Workspace</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        {/* Header - Transparent & Floating */}
        <header className="h-24 flex items-center justify-between px-10 pt-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{workspaceName}</h2>
            <span className="bg-white/60 backdrop-blur-md border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-500 shadow-sm">Enterprise</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href={`/dashboard/${currentWsId}/settings`} className="bg-white/80 backdrop-blur-md shadow-sm border border-slate-200 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all">
              <Settings size={18} />
            </Link>
            
            <div className="relative group cursor-pointer">
              <div className="h-11 w-11 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white transition-transform group-hover:scale-105">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="absolute right-0 mt-2 w-52 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right group-hover:scale-100 scale-95 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-800">User Profile</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{userEmail}</p>
                </div>
                <div className="p-2">
                  <Link href={`/dashboard/${currentWsId}/settings`} className="block px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Account Settings</Link>
                  <button onClick={handleSwitchWorkspace} className="w-full text-left block px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">Switch Workspace</button>
                </div>
                <div className="p-2 border-t border-slate-100">
                  <button onClick={handleSignOut} className="w-full text-left block px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">Sign out</button>
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

