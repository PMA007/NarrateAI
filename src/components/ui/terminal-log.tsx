'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface LogEntry {
    time: string;
    text: string;
}

interface TerminalLogProps {
    logs: LogEntry[];
    thought: string;
    title?: string;
    isComplete?: boolean;
    /** The structured output from agent_complete — shown in Historical mode */
    output?: any;
}

function renderOutputValue(value: any, depth = 0): React.ReactNode {
    if (value === null || value === undefined) return <span className="text-slate-500">null</span>;
    if (typeof value === 'boolean') return <span className="text-purple-400">{String(value)}</span>;
    if (typeof value === 'number') return <span className="text-yellow-400">{value}</span>;
    if (typeof value === 'string') {
        // Long strings get truncated with full text available on hover
        if (value.length > 200) {
            return <span className="text-green-300/80">{value.substring(0, 200)}<span className="text-slate-500">… ({value.length} chars)</span></span>;
        }
        return <span className="text-green-300/80">{value}</span>;
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return <span className="text-slate-500">[]</span>;
        return (
            <div className="ml-3 border-l border-slate-700/60 pl-2 space-y-1">
                {value.slice(0, 8).map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                        <span className="text-slate-600 shrink-0 text-[9px] mt-0.5">[{i}]</span>
                        <div>{renderOutputValue(item, depth + 1)}</div>
                    </div>
                ))}
                {value.length > 8 && (
                    <div className="text-slate-500 text-[10px]">… and {value.length - 8} more items</div>
                )}
            </div>
        );
    }
    if (typeof value === 'object') {
        const entries = Object.entries(value);
        return (
            <div className="ml-3 border-l border-slate-700/60 pl-2 space-y-1.5">
                {entries.map(([k, v]) => (
                    <div key={k} className="flex items-start gap-1.5">
                        <span className="text-cyan-400/70 shrink-0 text-[10px] font-mono mt-0.5">{k}:</span>
                        <div className="min-w-0">{renderOutputValue(v, depth + 1)}</div>
                    </div>
                ))}
            </div>
        );
    }
    return <span className="text-slate-400">{String(value)}</span>;
}

export function TerminalLog({ logs, thought, title, isComplete, output }: TerminalLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, thought, output]);

    return (
        <div className="w-full h-full bg-[#0a0f18] rounded-xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden font-mono text-xs relative group">

            {/* Header / Title Bar */}
            <div className={`bg-slate-900/80 backdrop-blur-md px-4 py-2 flex items-center justify-between border-b ${isComplete ? 'border-green-900/50' : 'border-slate-800'} z-10 transition-colors`}>
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
                <div className={`text-[10px] uppercase tracking-wider font-bold ${isComplete ? 'text-green-500/70' : 'text-slate-600'}`}>
                    {isComplete ? 'Historical' : 'Live'}
                </div>
            </div>

            {/* Scrollable Content */}
            <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 relative"
            >
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,3px_100%] opacity-20" />

                {logs.length === 0 && !thought && !output && (
                    <div className="text-slate-600 italic">Initializing agent connection...</div>
                )}

                {logs.map((log, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className="flex items-start space-x-2"
                    >
                        <span className="text-slate-600 shrink-0">[{log.time}]</span>
                        {log.text.includes('Thinking') ? (
                            <span className="text-cyan-300 font-bold">{log.text}</span>
                        ) : log.text.includes('Error') ? (
                            <span className="text-red-400">{log.text}</span>
                        ) : (
                            <span className="text-green-400/90">{log.text}</span>
                        )}
                    </motion.div>
                ))}

                {/* Streaming thought text (for live token-streaming agents) */}
                {thought && !isComplete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-l-2 border-cyan-500/30 pl-3 py-1 mt-4"
                    >
                        <span className="text-[10px] uppercase font-bold tracking-widest mb-1 block text-cyan-500">
                            Active Thought Process
                        </span>
                        <div className="text-cyan-300/80 whitespace-pre-wrap leading-relaxed">
                            {thought}
                            <span className="animate-pulse inline-block w-1.5 h-3 bg-cyan-400 ml-1 align-middle" />
                        </div>
                    </motion.div>
                )}

                {/* Historical view - structured output data */}
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-l-2 border-cyan-500/30 pl-3 py-1 mt-4"
                    >
                        <span className="text-[10px] uppercase font-bold tracking-widest mb-2 block text-slate-400">
                            Agent Output Data
                        </span>

                        {output ? (
                            <div className="space-y-1.5 text-[11px]">
                                {renderOutputValue(output)}
                            </div>
                        ) : thought ? (
                            <div className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                                {thought}
                            </div>
                        ) : (
                            <span className="italic text-slate-600">No structured output captured for this agent.</span>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
