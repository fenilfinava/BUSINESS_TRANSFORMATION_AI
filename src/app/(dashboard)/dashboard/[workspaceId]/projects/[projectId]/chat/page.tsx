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

  const handleGenerate = async (prompt?: string) => {
    const textToSend = prompt || input;
    if (!textToSend.trim()) return;
    
    if (!prompt) {
      setMessages(prev => [...prev, { role: "user", text: textToSend }]);
      setInput("");
    }
    
    setIsGenerating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          project_id: projectId,
          prompt: textToSend,
          uploaded_documents: [],
          language: "en"
        })
      });

      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                let messageText = "";
                if (data.message) {
                   messageText = data.message;
                } else {
                   messageText = `Module ${data.module} finished. Check the ${data.target_tab} tab.`;
                }
                setMessages(prev => [...prev, { role: "ai", text: messageText }]);
              } catch (e) {
                console.error("Error parsing JSON chunk:", dataStr, e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, an error occurred during generation." }]);
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
            transition={{ delay: i * 0.15 }}
            className={`flex space-x-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
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
              <div className={`text-sm p-4 rounded-2xl leading-relaxed ${
                msg.role === 'ai' 
                  ? 'text-slate-700 bg-slate-50 border border-slate-100' 
                  : 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 inline-block text-left shadow-lg shadow-blue-500/20'
              }`}>
                {msg.text}
              </div>
            </div>
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
