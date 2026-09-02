"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_40%,transparent_100%)]"></div>
      
      {/* Abstract Glowing Organic Blobs (Mesh Gradient Style) */}
      {/* Top Left Blue Blob */}
      <motion.div 
        animate={{ 
          x: [0, 50, 0, -30, 0],
          y: [0, 30, -50, 20, 0],
          scale: [1, 1.1, 0.9, 1.05, 1],
          borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "50% 50% 50% 50% / 50% 50% 50% 50%", "30% 70% 70% 30% / 30% 30% 70% 70%", "40% 60% 70% 30% / 40% 50% 60% 50%"]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-blue-400/20 blur-[80px]"
      />
      
      {/* Bottom Right Orange Blob */}
      <motion.div 
        animate={{ 
          x: [0, -60, 20, -40, 0],
          y: [0, -40, 30, -20, 0],
          scale: [1, 1.2, 0.9, 1.1, 1],
          borderRadius: ["60% 40% 30% 70% / 60% 30% 70% 40%", "40% 60% 50% 50% / 50% 50% 50% 50%", "50% 50% 70% 30% / 30% 70% 30% 70%", "60% 40% 30% 70% / 60% 30% 70% 40%"]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[10%] -right-[10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] bg-orange-400/15 blur-[90px]"
      />
      
      {/* Center Right Green Blob */}
      <motion.div 
        animate={{ 
          x: [0, 40, -30, 20, 0],
          y: [0, -50, 20, -40, 0],
          scale: [0.9, 1.1, 1, 1.2, 0.9],
          borderRadius: ["50% 50% 20% 80% / 25% 80% 20% 75%", "30% 70% 50% 50% / 50% 30% 70% 50%", "60% 40% 60% 40% / 40% 60% 40% 60%", "50% 50% 20% 80% / 25% 80% 20% 75%"]
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[20%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-emerald-400/15 blur-[70px]"
      />

      {/* Subtle Moving Lines for tech vibe */}
      <motion.div 
        animate={{ y: ['-100vh', '100vh'] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-[20%] w-px h-[200vh] bg-gradient-to-b from-transparent via-blue-500/10 to-transparent"
      />
      <motion.div 
        animate={{ y: ['100vh', '-100vh'] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-[70%] w-px h-[200vh] bg-gradient-to-b from-transparent via-orange-500/10 to-transparent"
      />
      <motion.div 
        animate={{ x: ['-100vw', '100vw'] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className="absolute top-[40%] left-0 w-[200vw] h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"
      />

      {/* Floating Magic Particles */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            y: "110vh", 
            x: `${(i * 100) / 25}vw`,
            opacity: 0,
            scale: 0.5
          }}
          animate={{ 
            y: "-10vh",
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5],
            x: `${((i * 100) / 25) + (i % 2 === 0 ? 5 : -5)}vw`
          }}
          transition={{ 
            duration: 15 + (i % 10),
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.4
          }}
          className={`absolute w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
            i % 3 === 0 ? "bg-blue-400" : i % 3 === 1 ? "bg-emerald-400" : "bg-orange-400"
          }`}
        />
      ))}
    </div>
  );
}
