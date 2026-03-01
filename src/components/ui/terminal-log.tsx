'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TerminalLogProps {
    logs: string[];
    thought: string;
    title?: string;
}

export function TerminalLog({ logs, thought, title }: TerminalLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, thought]);

    return (
        <div className="w-full h-full bg-[#0a0f18] rounded-xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden font-mono text-xs relative group">

            {/* Header / Title Bar */}
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 flex items-center justify-between border-b border-slate-800 z-10">
                <div className="flex items-center space-x-2">
                    <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                    </div>
                    <span className="text-slate-500 ml-2 text-[10px] font-semibold tracking-wider uppercase">
                        {title ?? 'Narrate.System.Log'}
                    </span>
                </div>
                <div className="text-[10px] text-slate-600">
                    LIVE
                </div>
            </div>

            {/* Scrollable Content */}
            <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 relative"
            >
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,3px_100%] opacity-20" />

                {logs.length === 0 && !thought && (
                    <div className="text-slate-600 italic">Initializing agent swarm connection...</div>
                )}

                {logs.map((log, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className="flex items-start space-x-2"
                    >
                        <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                        {log.includes('Thinking') ? (
                            <span className="text-cyan-300 font-bold">{log}</span>
                        ) : log.includes('Error') ? (
                            <span className="text-red-400">{log}</span>
                        ) : (
                            <span className="text-green-400/90">{log}</span>
                        )}
                    </motion.div>
                ))}

                {thought && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-l-2 border-cyan-500/30 pl-3 py-1 mt-4"
                    >
                        <span className="text-cyan-500 text-[10px] uppercase font-bold tracking-widest mb-1 block">
                            Active Thought Process
                        </span>
                        <div className="text-cyan-300/80 whitespace-pre-wrap leading-relaxed">
                            {thought}
                            <span className="animate-pulse inline-block w-1.5 h-3 bg-cyan-400 ml-1 align-middle" />
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
