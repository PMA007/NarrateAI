import { motion } from 'framer-motion';
import { LucideIcon, Check, Loader2, Eye } from 'lucide-react';

interface AgentCardProps {
    name: string;
    description: string;
    icon: LucideIcon;
    status: 'idle' | 'active' | 'completed';
    color: string;
    hasOutput?: boolean;
    onClick?: () => void;
}

// Tailwind requires full class names to be present as static strings.
// Dynamic interpolation like `border-${color}-500` gets purged.
// We map each color to its full set of classes upfront.
const COLOR_MAP: Record<string, {
    border: string;
    borderActive: string;
    borderCompleted: string;
    bg: string;
    bgActive: string;
    glow: string;
    ping: string;
    dot: string;
    badge: string;
    text: string;
    spinner: string;
    scan: string;
}> = {
    blue: {
        border: 'border-slate-800',
        borderActive: 'border-blue-500',
        borderCompleted: 'border-blue-500/50',
        bg: 'bg-slate-900/50',
        bgActive: 'bg-blue-950/30',
        glow: 'bg-blue-500/5',
        ping: 'bg-blue-400',
        dot: 'bg-blue-500',
        badge: 'bg-blue-500',
        text: 'text-blue-400',
        spinner: 'text-blue-500',
        scan: 'via-blue-500/5',
    },
    indigo: {
        border: 'border-slate-800',
        borderActive: 'border-indigo-500',
        borderCompleted: 'border-indigo-500/50',
        bg: 'bg-slate-900/50',
        bgActive: 'bg-indigo-950/30',
        glow: 'bg-indigo-500/5',
        ping: 'bg-indigo-400',
        dot: 'bg-indigo-500',
        badge: 'bg-indigo-500',
        text: 'text-indigo-400',
        spinner: 'text-indigo-500',
        scan: 'via-indigo-500/5',
    },
    purple: {
        border: 'border-slate-800',
        borderActive: 'border-purple-500',
        borderCompleted: 'border-purple-500/50',
        bg: 'bg-slate-900/50',
        bgActive: 'bg-purple-950/30',
        glow: 'bg-purple-500/5',
        ping: 'bg-purple-400',
        dot: 'bg-purple-500',
        badge: 'bg-purple-500',
        text: 'text-purple-400',
        spinner: 'text-purple-500',
        scan: 'via-purple-500/5',
    },
    pink: {
        border: 'border-slate-800',
        borderActive: 'border-pink-500',
        borderCompleted: 'border-pink-500/50',
        bg: 'bg-slate-900/50',
        bgActive: 'bg-pink-950/30',
        glow: 'bg-pink-500/5',
        ping: 'bg-pink-400',
        dot: 'bg-pink-500',
        badge: 'bg-pink-500',
        text: 'text-pink-400',
        spinner: 'text-pink-500',
        scan: 'via-pink-500/5',
    },
    emerald: {
        border: 'border-slate-800',
        borderActive: 'border-emerald-500',
        borderCompleted: 'border-emerald-500/50',
        bg: 'bg-slate-900/50',
        bgActive: 'bg-emerald-950/30',
        glow: 'bg-emerald-500/5',
        ping: 'bg-emerald-400',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-500',
        text: 'text-emerald-400',
        spinner: 'text-emerald-500',
        scan: 'via-emerald-500/5',
    },
    orange: {
        border: 'border-slate-800',
        borderActive: 'border-orange-500',
        borderCompleted: 'border-orange-500/50',
        bg: 'bg-slate-900/50',
        bgActive: 'bg-orange-950/30',
        glow: 'bg-orange-500/5',
        ping: 'bg-orange-400',
        dot: 'bg-orange-500',
        badge: 'bg-orange-500',
        text: 'text-orange-400',
        spinner: 'text-orange-500',
        scan: 'via-orange-500/5',
    },
    cyan: {
        border: 'border-slate-800',
        borderActive: 'border-cyan-500',
        borderCompleted: 'border-cyan-500/50',
        bg: 'bg-slate-900/50',
        bgActive: 'bg-cyan-950/30',
        glow: 'bg-cyan-500/5',
        ping: 'bg-cyan-400',
        dot: 'bg-cyan-500',
        badge: 'bg-cyan-500',
        text: 'text-cyan-400',
        spinner: 'text-cyan-500',
        scan: 'via-cyan-500/5',
    },
};

export function AgentCard({ name, description, icon: Icon, status, color, hasOutput, onClick }: AgentCardProps) {
    const isActive = status === 'active';
    const isCompleted = status === 'completed';
    const isClickable = isCompleted && hasOutput && onClick;
    const c = COLOR_MAP[color] ?? COLOR_MAP['blue'];

    const borderClass = isActive ? c.borderActive : isCompleted ? c.borderCompleted : c.border;
    const bgClass = isActive ? c.bgActive : c.bg;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={isClickable ? onClick : undefined}
            className={`relative p-3.5 rounded-xl border ${borderClass} ${bgClass} backdrop-blur-sm transition-colors duration-500 overflow-hidden group ${isClickable ? 'cursor-pointer' : ''}`}
            style={isActive ? {
                boxShadow: `0 0 12px 0 var(--tw-shadow-color, rgba(0,0,0,0))`,
            } : undefined}
        >
            {/* Active Glow */}
            {isActive && <div className={`absolute inset-0 ${c.glow}`} />}

            <div className="flex items-center space-x-3 relative z-10">
                {/* Icon Box */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 relative shrink-0">
                    <Icon className={`w-5 h-5 ${isActive || isCompleted ? c.text : 'text-slate-600'} transition-colors duration-300`} />

                    {/* Status Badge */}
                    <div className="absolute -top-1 -right-1">
                        {isActive && (
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.ping} opacity-75`} />
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${c.dot}`} />
                            </span>
                        )}
                        {isCompleted && (
                            <div className={`${c.badge} rounded-full p-0.5`}>
                                <Check className="w-2 h-2 text-black" strokeWidth={4} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm leading-tight ${isActive ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                        {name}
                    </h3>
                    <p className="text-xs mt-0.5">
                        {isActive ? (
                            <span className={`${c.text} animate-pulse font-medium`}>Processing...</span>
                        ) : isCompleted ? (
                            <span className="text-slate-500">Completed ✓</span>
                        ) : (
                            <span className="text-slate-600">{description}</span>
                        )}
                    </p>
                </div>

                {/* Right side indicator */}
                {isActive && <Loader2 className={`w-4 h-4 ${c.spinner} animate-spin shrink-0`} />}
                {isCompleted && hasOutput && (
                    <div className={`shrink-0 flex items-center space-x-1 text-xs ${c.text} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-medium">View</span>
                    </div>
                )}
                {isCompleted && !hasOutput && (
                    <Check className="w-4 h-4 text-slate-600 shrink-0" />
                )}
            </div>

            {/* Scanline animation for active state */}
            {isActive && (
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent ${c.scan} to-transparent bg-[length:100%_200%] animate-scanline pointer-events-none`} />
            )}
        </motion.div>
    );
}
