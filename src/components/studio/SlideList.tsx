import React from 'react';
import { useStore } from '@/lib/store';
import { Scroll, Layout, FileText, BarChart, List, Code, Network, Table, GitMerge } from 'lucide-react';
import { SlideCategory } from '@/components/themes/types';

const LAYOUT_ICONS: Record<string, any> = {
    title: Layout,
    text_features: List,
    columns_3: Layout,
    grid_cards: Layout,
    comparison: GitMerge,
    process_flow: Network,
    chart_bar: BarChart,
    chart_line: BarChart,
    coding: Code,
    table: Table
};

export function SlideList() {
    const { script, currentTime, seek, activeElementId } = useStore();

    if (!script) return null;

    // Calculate active slide index based on time
    let activeIndex = 0;
    let cumulativeTime = 0;
    for (let i = 0; i < script.slides.length; i++) {
        const duration = script.slides[i].duration || 10;
        if (currentTime >= cumulativeTime && currentTime < cumulativeTime + duration) {
            activeIndex = i;
            break;
        }
        cumulativeTime += duration;
    }
    // Handle end case
    if (currentTime >= cumulativeTime && script.slides.length > 0) {
        activeIndex = script.slides.length - 1;
    }

    const handleSlideClick = (index: number) => {
        // Calculate start time for this slide
        let time = 0;
        for (let i = 0; i < index; i++) {
            time += (script.slides[i].duration || 10);
        }
        seek(time + 3); // Seek to 3s to ensures animations (which start ~0.3s) are visible
    };

    return (
        <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full">
            <div className="h-16 border-b border-neutral-800 flex items-center px-6">
                <h2 className="font-semibold text-neutral-200 flex items-center gap-2">
                    <Scroll className="w-4 h-4 text-cyan-500" />
                    Slides
                </h2>
                <span className="ml-auto text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                    {script.slides.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {script.slides.map((slide, index) => {
                    const isActive = index === activeIndex;
                    const Icon = LAYOUT_ICONS[slide.layout] || FileText;

                    return (
                        <button
                            key={index}
                            onClick={() => handleSlideClick(index)}
                            className={`
                                w-full text-left p-3 rounded-lg border transition-all group relative
                                ${isActive
                                    ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                    : 'bg-neutral-800/50 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'}
                            `}
                        >
                            {/* Number Badge */}
                            <div className={`
                                absolute top-3 right-3 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded
                                ${isActive ? 'bg-cyan-500 text-black' : 'bg-neutral-700 text-neutral-400 group-hover:bg-neutral-600'}
                            `}>
                                {index + 1}
                            </div>

                            <div className="flex items-start gap-3">
                                <div className={`
                                    p-2 rounded-md shrink-0
                                    ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-neutral-700/50 text-neutral-400 group-hover:text-neutral-300'}
                                `}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className={`
                                        text-sm font-medium truncate mb-1 pr-6
                                        ${isActive ? 'text-cyan-100' : 'text-neutral-300 group-hover:text-white'}
                                    `}>
                                        {slide.title || 'Untitled Slide'}
                                    </h4>
                                    <p className="text-xs text-neutral-500 truncate">
                                        {slide.layout.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>

                            {/* Time Indicator */}
                            {isActive && (
                                <div className="mt-2 h-0.5 bg-neutral-700 rounded-full overflow-hidden w-full">
                                    <div className="h-full bg-cyan-500 animate-pulse w-full" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
