"use client";

import { Stage } from "@/components/canvas/Stage";

interface SlideThumbnailProps {
    slide: any;
    template: 'neon' | 'retro';
    isSelected?: boolean;
    onClick?: () => void;
}

export function SlideThumbnail({ slide, template, isSelected, onClick }: SlideThumbnailProps) {
    // Create a mini mono-slide script for this thumbnail
    const singleSlideScript = {
        template,
        slides: [{ ...slide, duration: 10, startTime: 0 }]
    };

    return (
        <div
            onClick={onClick}
            className={`
                relative w-48 aspect-video rounded-lg overflow-hidden cursor-pointer transition-all duration-200
                border-2 flex-shrink-0
                ${isSelected
                    ? (template === 'neon'
                        ? 'border-cyan-500 shadow-lg shadow-cyan-900/50 scale-105'
                        : 'border-blue-700 shadow-lg shadow-blue-900/50 scale-105')
                    : 'border-transparent hover:border-white/20 hover:scale-105 opacity-70 hover:opacity-100'
                }
            `}
        >
            <div className="absolute inset-0 pointer-events-none">
                {/* 
                   We render the Stage at full resolution but scaled down via CSS container queries or transform. 
                   Actually, Stage is responsive to width/height props. We can pass small width/height! 
                   But font sizes are fixed in pixels in the SVG. 
                   SO: We must render at full HD (1920x1080) and scale the SVG via viewBox (handled by Stage) 
                   OR transform the container. 
                   The Stage component takes width/height props and sets SVG viewBox to `0 0 width height`.
                   IF we pass width=1920, height=1080, it will render huge.
                   BUT we can force the wrapper div to be small.
                */}
                <div style={{ width: '1920px', height: '1080px', transform: 'scale(0.1)', transformOrigin: 'top left' }}>
                    <Stage
                        script={singleSlideScript}
                        currentTime={2} // Show a frame a bit into the animation
                        isPlaying={false} // Static thumbnail
                        width={1920}
                        height={1080}
                    />
                </div>
            </div>

            {/* Label Overlay */}
            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 backdrop-blur-sm">
                <p className="text-[10px] text-center font-medium text-white truncate px-1">
                    {slide.title}
                </p>
            </div>
        </div>
    );
}
