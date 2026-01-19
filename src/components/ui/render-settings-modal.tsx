"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Film, MonitorPlay, Sparkles, Check } from "lucide-react";
import { useState } from "react";

interface RenderSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartRender: (mode: 'default' | 'high-quality') => void;
    initialMode?: 'default' | 'high-quality';
}

export function RenderSettingsModal({ isOpen, onClose, onStartRender, initialMode = 'default' }: RenderSettingsModalProps) {
    const [selectedMode, setSelectedMode] = useState<'default' | 'high-quality'>(initialMode);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-800">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Export Video</h3>
                                <p className="text-sm text-neutral-400">Choose your rendering engine preferences</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-neutral-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Option 1: Fast / Direct */}
                            <div
                                onClick={() => setSelectedMode('default')}
                                className={`relative group cursor-pointer rounded-xl p-6 border-2 transition-all duration-300 ${selectedMode === 'default'
                                    ? 'border-cyan-500 bg-cyan-950/10'
                                    : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                                    }`}
                            >
                                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${selectedMode === 'default'
                                    ? 'bg-cyan-500 border-cyan-500'
                                    : 'border-neutral-600'
                                    }`}>
                                    {selectedMode === 'default' && <Check className="w-3 h-3 text-white" />}
                                </div>

                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${selectedMode === 'default' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-neutral-800 text-neutral-400'
                                    }`}>
                                    <MonitorPlay className="w-6 h-6" />
                                </div>

                                <h4 className="text-lg font-bold text-white mb-2">Direct Recording</h4>
                                <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 mb-4">
                                    <span className="bg-cyan-950/50 px-2 py-0.5 rounded">FASTEST</span>
                                    <span className="bg-cyan-950/50 px-2 py-0.5 rounded">LOW MEMORY</span>
                                </div>
                                <p className="text-sm text-neutral-400 leading-relaxed">
                                    Records your screen in real-time. Best for quick exports or low-end devices. Requires keeping the tab visible.
                                </p>
                            </div>

                            {/* Option 2: High Quality */}
                            <div
                                onClick={() => setSelectedMode('high-quality')}
                                className={`relative group cursor-pointer rounded-xl p-6 border-2 transition-all duration-300 ${selectedMode === 'high-quality'
                                    ? 'border-purple-500 bg-purple-950/10'
                                    : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                                    }`}
                            >
                                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${selectedMode === 'high-quality'
                                    ? 'bg-purple-500 border-purple-500'
                                    : 'border-neutral-600'
                                    }`}>
                                    {selectedMode === 'high-quality' && <Check className="w-3 h-3 text-white" />}
                                </div>

                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${selectedMode === 'high-quality' ? 'bg-purple-500/20 text-purple-400' : 'bg-neutral-800 text-neutral-400'
                                    }`}>
                                    <Film className="w-6 h-6" />
                                </div>

                                <h4 className="text-lg font-bold text-white mb-2">High Quality Render</h4>
                                <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 mb-4">
                                    <span className="bg-purple-950/50 px-2 py-0.5 rounded">BEST QUALITY</span>
                                    <span className="bg-purple-950/50 px-2 py-0.5 rounded">OFFLINE</span>
                                </div>
                                <p className="text-sm text-neutral-400 leading-relaxed">
                                    Frame-by-frame rendering engine. detailed, perfect audio sync, and 30fps smoothness. CPU/RAM intensive.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-neutral-900/50 border-t border-neutral-800 flex justify-end">
                            <button
                                onClick={onClose}
                                className="mr-4 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onStartRender(selectedMode)}
                                className={`px-6 py-2 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${selectedMode === 'default'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 shadow-purple-500/25'
                                    }`}
                            >
                                <span className="flex items-center space-x-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Start Export</span>
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
