import React from 'react';
import { useStore, AnimationConfig } from '@/lib/store';
import {
    Type, ArrowUp, ArrowDown, Maximize,
    Zap, Activity, Move, MousePointerClick,
    X, PlayCircle
} from 'lucide-react';

const ANIMATION_PRESETS: { label: string; type: AnimationConfig['type']; icon: any }[] = [
    { label: 'None', type: 'none', icon: X },
    { label: 'Fade In', type: 'fade', icon: Activity },
    { label: 'Typewriter', type: 'typewriter', icon: Type },
    { label: 'Slide Up', type: 'slide_up', icon: ArrowUp },
    { label: 'Slide Down', type: 'slide_down', icon: ArrowDown },
    { label: 'Scale In', type: 'scale_in', icon: Maximize },
    { label: 'Blur In', type: 'blur_in', icon: Zap },
];

export function AnimationPanel() {
    const {
        activeElementId,
        elementAnimations,
        setElementAnimation,
        setActiveElement
    } = useStore();

    if (!activeElementId) {
        return (
            <div className="w-80 bg-neutral-900 border-l border-neutral-800 p-6 flex flex-col items-center justify-center text-center h-full">
                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <MousePointerClick className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-neutral-200 font-medium mb-2">No Selection</h3>
                <p className="text-neutral-400 text-sm">
                    Select an element on the canvas to apply animations.
                </p>
            </div>
        );
    }

    const currentAnim = elementAnimations[activeElementId] || { type: 'none', duration: 1.0, delay: 0 };

    const handleSelect = (type: AnimationConfig['type']) => {
        if (!activeElementId) return;

        // Create new config
        const newConfig: AnimationConfig = {
            type,
            duration: currentAnim.duration || 1.0,
            delay: currentAnim.delay || 0.0,
            ease: 'easeOut'
        };

        setElementAnimation(activeElementId, newConfig);

        // Trigger preview
        useStore.getState().triggerPreview();
    };

    const updateConfig = (key: keyof AnimationConfig, value: any) => {
        setElementAnimation(activeElementId, {
            ...currentAnim,
            [key]: value
        });
        useStore.getState().triggerPreview();
    };

    return (
        <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full">
            {/* Header */}
            <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-6">
                <h2 className="font-semibold text-neutral-200">Animate</h2>
                <button
                    onClick={() => setActiveElement(null)}
                    className="text-neutral-500 hover:text-neutral-300"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Animation Grid */}
                <div>
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">In Animation</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {ANIMATION_PRESETS.map((preset) => (
                            <button
                                key={preset.type}
                                onClick={() => handleSelect(preset.type)}
                                className={`
                                    flex flex-col items-center justify-center p-4 rounded-xl border transition-all
                                    ${currentAnim.type === preset.type
                                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                                        : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-700'}
                                `}
                            >
                                <preset.icon className="w-6 h-6 mb-2" />
                                <span className="text-xs font-medium">{preset.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Settings */}
                {currentAnim.type !== 'none' && (
                    <div className="space-y-6 border-t border-neutral-800 pt-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Duration</span>
                                <span className="text-neutral-200">{currentAnim.duration}s</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="3.0"
                                step="0.1"
                                value={currentAnim.duration}
                                onChange={(e) => updateConfig('duration', parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Delay</span>
                                <span className="text-neutral-200">{currentAnim.delay}s</span>
                            </div>
                            <input
                                type="range"
                                min="0.0"
                                max="5.0"
                                step="0.1"
                                value={currentAnim.delay}
                                onChange={(e) => updateConfig('delay', parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
