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
    setIsLoadingWorkspaces(true);
    try {
      // 1. Ensure user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingWorkspaces(false);
        return;
      }

      // 2. Fetch all workspaces for this user
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("Supabase query workspaces error:", error);
      }

      let fetchedList: Workspace[] = (data as Workspace[]) || [];

      // Fallback check to FastAPI backend if direct Supabase client returns empty (e.g. RLS sync)
      if (fetchedList.length === 0) {
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
                fetchedList = backendWs;
              }
            }
          }
        } catch (e) {
          console.warn("Backend workspace fallback fetch:", e);
        }
      }

      if (fetchedList && fetchedList.length > 0) {
        setWorkspaces(fetchedList);

        // 3. Auto-select remembered workspace or first workspace if none is active
        let targetWorkspace = fetchedList[0];

        if (typeof window !== "undefined") {
          const savedId = localStorage.getItem("active_workspace_id");
          const urlMatch = window.location.pathname.match(/\/dashboard\/([0-9a-fA-F-]{36})/);
          const currentUrlId = urlMatch ? urlMatch[1] : null;

          const candidateId = currentUrlId || savedId;
          if (candidateId) {
            const match = fetchedList.find((w) => w.id === candidateId);
            if (match) {
              targetWorkspace = match;
            }
          }
        }

        setActiveWorkspace(targetWorkspace);
      } else {
        setWorkspaces([]);
        setActiveWorkspace(null);
      }
    } catch (err) {
      console.error("Failed to initialize workspaces:", err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, [setActiveWorkspace, setIsLoadingWorkspaces, setWorkspaces]);

  useEffect(() => {
    initializeWorkspaces();

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        initializeWorkspaces();
      } else if (event === "SIGNED_OUT") {
        setWorkspaces([]);
        setActiveWorkspace(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("active_workspace_id");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeWorkspaces, setActiveWorkspace, setWorkspaces]);

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
