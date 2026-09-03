"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { create } from "zustand";

export interface Workspace {
  id: string;
  name: string;
  user_id?: string;
  owner_id?: string;
  created_at?: string;
  role?: string;
  color?: string;
  icon?: string;
  [key: string]: any;
}

// 1. Zustand Store definition for direct state access/updates
interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoadingWorkspaces: boolean;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setIsLoadingWorkspaces: (loading: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  isLoadingWorkspaces: true,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (workspace) => {
    if (typeof window !== "undefined" && workspace?.id) {
      localStorage.setItem("active_workspace_id", workspace.id);
    }
    set({ activeWorkspace: workspace });
  },
  setIsLoadingWorkspaces: (loading) => set({ isLoadingWorkspaces: loading }),
}));

// 2. React Context definition
interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoadingWorkspaces: boolean;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  activeWorkspace: null,
  isLoadingWorkspaces: true,
  setActiveWorkspace: () => {},
  setWorkspaces: () => {},
  refreshWorkspaces: async () => {},
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspacesState] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspacesState] = useState<boolean>(true);

  const setActiveWorkspace = useCallback((workspace: Workspace | null) => {
    setActiveWorkspaceState(workspace);
    useWorkspaceStore.getState().setActiveWorkspace(workspace);
    if (typeof window !== "undefined") {
      if (workspace?.id) {
        localStorage.setItem("active_workspace_id", workspace.id);
      } else {
        localStorage.removeItem("active_workspace_id");
      }
    }
  }, []);

  const setWorkspaces = useCallback((list: Workspace[]) => {
    setWorkspacesState(list);
    useWorkspaceStore.getState().setWorkspaces(list);
  }, []);

  const setIsLoadingWorkspaces = useCallback((loading: boolean) => {
    setIsLoadingWorkspacesState(loading);
    useWorkspaceStore.getState().setIsLoadingWorkspaces(loading);
  }, []);

  const initializeWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true); // Ensure it starts loading
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.warn("No authenticated user found.");
        setWorkspaces([]);
        setActiveWorkspace(null);
        return;
      }

      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Supabase Error fetching workspaces:", error.message);
        // Don't throw, just fail gracefully so the user sees the 'Create Workspace' fallback
        setWorkspaces([]); 
        setActiveWorkspace(null);
        return;
      }

      let list: Workspace[] = (data as Workspace[]) || [];

      // Fallback check to FastAPI backend if direct Supabase client returns empty (e.g. RLS sync)
      if (list.length === 0) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.access_token) {
            const res = await fetch("http://localhost:8000/api/workspaces", {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
              const backendWs = await res.json();
              if (backendWs && backendWs.length > 0) {
                list = backendWs;
              }
            }
          }
        } catch (e) {
          console.warn("Backend workspace fallback fetch:", e);
        }
      }

      setWorkspaces(list);

      if (list.length > 0) {
        let targetWorkspace = list[0];
        if (typeof window !== "undefined") {
          const savedId = localStorage.getItem("active_workspace_id");
          const urlMatch = window.location.pathname.match(/\/dashboard\/([0-9a-fA-F-]{36})/);
          const candidateId = (urlMatch ? urlMatch[1] : null) || savedId;
          if (candidateId) {
            const match = list.find((w) => w.id === candidateId);
            if (match) targetWorkspace = match;
          }
        }
        setActiveWorkspace(targetWorkspace);
      } else {
        setActiveWorkspace(null);
      }
    } catch (err) {
      console.error("Unexpected JS Error in initializeWorkspaces:", err);
      setWorkspaces([]);
      setActiveWorkspace(null);
    } finally {
      // CRITICAL FIX: This guarantees the loading spinner turns off no matter what happens
      setIsLoadingWorkspaces(false);
    }
  }, [setActiveWorkspace, setIsLoadingWorkspaces, setWorkspaces]);

  useEffect(() => {
    initializeWorkspaces();

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        initializeWorkspaces();
      } else if (event === "SIGNED_OUT") {
        setWorkspaces([]);
        setActiveWorkspace(null);
        setIsLoadingWorkspaces(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("active_workspace_id");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeWorkspaces, setActiveWorkspace, setIsLoadingWorkspaces, setWorkspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoadingWorkspaces,
        setActiveWorkspace,
        setWorkspaces,
        refreshWorkspaces: initializeWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
