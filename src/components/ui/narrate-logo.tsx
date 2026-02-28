'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function NarrateLogo({ className = "", small = false }: { className?: string, small?: boolean }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={`absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 blur-sm opacity-50 ${small ? 'w-6 h-6' : 'w-10 h-10'}`}
                />
                <div className={`relative bg-black rounded-full flex items-center justify-center border border-white/10 ${small ? 'w-6 h-6' : 'w-10 h-10'}`}>
                    <Sparkles className={`${small ? 'w-3 h-3' : 'w-5 h-5'} text-cyan-400`} />
                </div>
            </div>
            <div className="flex flex-col">
                <span className={`font-bold tracking-tight text-white leading-none ${small ? 'text-lg' : 'text-2xl'}`}>
                    Narrate<span className="text-cyan-400">AI</span>
                </span>
                {!small && (
                    <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
                        Agentic Video Engine
                    </span>
                )}
            </div>
        </div>
    );
}
