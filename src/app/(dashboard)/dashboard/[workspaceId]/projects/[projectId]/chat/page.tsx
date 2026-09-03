"use client";

import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ChatPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! I've reviewed your project workspace. What would you like to focus on today? We can design target architectures, discuss business transformation, or generate strategic blueprints." }
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProjectContext() {
      if (!projectId) return;
      const { data: proj } = await supabase.from('projects').select('name').eq('id', projectId).single();
      if (proj?.name) {
        setMessages([
          { role: "ai", text: `Hello! I've reviewed your ${proj.name} project details. What would you like to focus on today? We can design the target architecture, plan milestones, or generate strategic blueprints.` }
        ]);
      }
    }
    loadProjectContext();
  }, [projectId]);

  // Dedicated container ref for internal scrolling only (no window scrollIntoView)
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Helper function to pause execution and respect rate limits
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleGenerate = async (prompt?: string) => {
    const textToSend = prompt || input;
    if (!textToSend.trim() || isGenerating) return;

    if (!prompt) {
      setMessages(prev => [...prev, { role: "user", text: textToSend }]);
      setInput("");
    } else {
      setMessages(prev => [...prev, { role: "user", text: `Action requested: ${prompt}` }]);
    }

    setIsGenerating(true);

    // Multi-module generation triggers (Generate HLD or Find Gaps)
    const isMultiModule = textToSend === "Generate HLD" || textToSend === "Find Gaps";

    if (isMultiModule) {
      const modules = textToSend === "Generate HLD"
        ? [
            { name: "Solution Architecture Builder", slug: "solution_architecture", title: "Target Cloud & Architecture Specification" },
            { name: "Database & Integration Designer", slug: "database_designer", title: "Enterprise Database & API Schema" },
            { name: "Transformation Planner", slug: "transformation_planner", title: "Implementation Roadmap & Milestones" }
          ]
        : [
            { name: "Business Analysis Engine", slug: "business_analysis", title: "Gap Analysis & Digital Maturity Assessment" },
            { name: "AI Solution Builder", slug: "solution_builder", title: "AI & Automation Opportunity Strategy" },
            { name: "Security & Compliance Guardian", slug: "security_compliance", title: "Security, Governance & Compliance Review" }
          ];

      const successfulGenerations: { module: string; slug: string; title: string; content: string }[] = [];

      for (const mod of modules) {
        try {
          // 1. Update UI to show current module is processing
          setMessages(prev => [...prev, { role: "system", text: `Querying LLM for ${mod.name}...` }]);

          // 2. Fetch from Next.js backend API (Gemini 3.6 Flash)
          const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              prompt: `Act as ${mod.name}. Formulate a comprehensive, actionable ${mod.title} for this project. Focus on enterprise standards, high depth, and concrete implementation specifications.`
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Failed on ${mod.name}`);
          }

          if (!data.text) {
            throw new Error(`Empty response received for ${mod.name}`);
          }

          // 3. Save the ACTUAL content immediately
          const generatedContent = data.text;
          successfulGenerations.push({
            module: mod.name,
            slug: mod.slug,
            title: mod.title,
            content: generatedContent
          });

          // Append to chat stream
          setMessages(prev => [
            ...prev,
            {
              role: "ai",
              text: `### 🎯 ${mod.name}\n**${mod.title}**\n\n${generatedContent}`
            }
          ]);

          setMessages(prev => [...prev, { role: "system", text: `Module ${mod.name} finished. Check the chat tab.` }]);

          // 4. Wait 1 second before querying next module to avoid HTTP 429 Too Many Requests
          await delay(1000);

        } catch (err: any) {
          console.error(`Error generating ${mod.name}:`, err);
          setMessages(prev => [...prev, { role: "system", text: `Error in ${mod.name}: ${err.message}` }]);
          break;
        }
      }

      // PHASE 2: SAVE TO HISTORY ONLY AFTER SUCCESSFUL RESOLUTION
      if (successfulGenerations.length > 0) {
        for (const gen of successfulGenerations) {
          try {
            await fetch("/api/ai/save-blueprint", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId,
                moduleType: gen.slug,
                title: gen.title,
                summary: gen.content.slice(0, 240) + "...",
                content: gen.content,
                key_recommendations: []
              })
            });
          } catch (saveErr) {
            console.warn(`Could not save ${gen.module} to database:`, saveErr);
          }
        }
        setMessages(prev => [...prev, { role: "system", text: `All ${successfulGenerations.length} blueprints successfully saved to History & Solutions!` }]);
      }

      setIsGenerating(false);
      return;
    }

    // Standard conversation handling
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: textToSend,
          history: messages.filter(m => m.role === "user" || m.role === "ai").slice(-6)
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Chat request failed");
      }

      if (data.text) {
        setMessages(prev => [...prev, { role: "ai", text: data.text }]);
      } else {
        throw new Error("No response returned from AI.");
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "ai", text: `⚠️ Error: ${err.message || "Failed to generate response."}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">AI Transformation Assistant</h2>
            <p className="text-xs text-slate-500">Powered by Enterprise AI Brain</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <motion.button onClick={() => handleGenerate("Generate HLD")} disabled={isGenerating} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-bold transition-all shadow-sm disabled:opacity-50">
            <Sparkles size={12} className="inline mr-1" />Generate HLD
          </motion.button>
          <motion.button onClick={() => handleGenerate("Find Gaps")} disabled={isGenerating} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-bold transition-all shadow-sm disabled:opacity-50">
            Find Gaps
          </motion.button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div ref={chatScrollContainerRef} className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={msg.role === 'system' ? 'w-full flex justify-center my-1' : `flex space-x-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {msg.role === 'system' ? (
              <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>{msg.text}</span>
              </span>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'ai' 
                    ? 'bg-blue-100' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-900'
                } ${msg.role === 'user' ? 'ml-4' : ''}`}>
                  {msg.role === 'ai' 
                    ? <Bot size={18} className="text-blue-600" /> 
                    : <User size={18} className="text-white" />
                  }
                </div>
                <div className={msg.role === 'user' ? 'text-right' : ''}>
                  <p className="text-xs font-bold text-slate-500 mb-1.5">{msg.role === 'ai' ? 'AI Assistant' : 'You'}</p>
                  <div className={`text-sm p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'ai' 
                      ? 'text-slate-700 bg-slate-50 border border-slate-100' 
                      : 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 inline-block text-left shadow-lg shadow-blue-500/20'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/30">
        <div className="relative">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            disabled={isGenerating}
            placeholder="Ask AI to generate architectures, analyze requirements..."
            className="block w-full rounded-2xl border border-slate-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm pl-5 pr-14 py-4 bg-white text-slate-900 resize-none outline-none transition-all"
          ></textarea>
          <motion.button 
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
