"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, RotateCcw } from "lucide-react";
import { Stage } from "@/components/canvas/Stage";
import { SlideThumbnail } from "@/components/ui/slide-thumbnail";
import { DUMMY_PREVIEW_SCRIPT } from "@/lib/dummy-data";

interface TemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: 'neon' | 'retro';
}

export function TemplatePreviewModal({ isOpen, onClose, template }: TemplatePreviewModalProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    // Script with injected template
    const baseScript = DUMMY_PREVIEW_SCRIPT;
    const previewScript = { ...baseScript, template };
    const totalDuration = previewScript.slides.reduce((acc: number, s: any) => acc + (s.duration || 3), 0);

    useEffect(() => {
        let frameId: number;
        let lastTime = performance.now();

        const loop = () => {
            if (!isPlaying) {
                lastTime = performance.now();
                frameId = requestAnimationFrame(loop);
                return;
            }

            const now = performance.now();
            const delta = (now - lastTime) / 1000;
            lastTime = now;

            setCurrentTime(prev => {
                const next = prev + delta;
                if (next >= totalDuration) return 0; // Loop
                return next;
            });

            frameId = requestAnimationFrame(loop);
        };

        if (isOpen) {
            frameId = requestAnimationFrame(loop);
        }

        return () => cancelAnimationFrame(frameId);
    }, [isOpen, isPlaying, totalDuration]);

    useEffect(() => {
        if (isOpen) {
            setCurrentTime(0);
            setIsPlaying(true);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-6xl h-[85vh] bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900/50 backdrop-blur border-b border-neutral-800 z-10 absolute top-0 w-full">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {template === 'neon' ? 'Neon Dark' : 'Retro'} Preview
                                </h3>
                                <p className="text-xs text-neutral-400">Live Render Demo • 60 FPS</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-neutral-400" />
                            </button>
                        </div>

                        {/* Stage Area */}
                        <div className="flex-1 relative bg-black/50">
                            <Stage
                                script={previewScript as any}
                                currentTime={currentTime}
                                isPlaying={isPlaying}
                                width={1280}
                                height={720}
                            />

                            {/* Floating Controls Overlay */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300">
                                <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:text-cyan-400 transition-colors">
                                    <Play className={`w-5 h-5 ${isPlaying ? 'fill-current' : ''}`} />
                                </button>
                                <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-500"
                                        style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                                    />
                                </div>
                                <button onClick={() => setCurrentTime(0)} className="p-2 hover:text-cyan-400 transition-colors">
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Thumbnail Strip */}
                        <div className="h-32 bg-neutral-900 border-t border-neutral-800 p-4 flex items-center space-x-4 overflow-x-auto">
                            {previewScript.slides.map((slide: any) => {
                                const isActive = currentTime >= (slide.startTime || 0) && currentTime < ((slide.startTime || 0) + (slide.duration || 3));
                                return (
                                    <SlideThumbnail
                                        key={slide.slide_id}
                                        slide={slide as any}
                                        template={template}
                                        isSelected={isActive}
                                        onClick={() => setCurrentTime(slide.startTime || 0)}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
