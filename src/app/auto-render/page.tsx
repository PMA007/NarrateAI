'use client';

/**
 * /auto-render — Headless render page for Puppeteer (Native Screenshot Mode)
 *
 * This page ONLY mounts the React `<Stage>` component and provides a global
 * `window.seekToFrame(frame)` function. It does NO capturing itself.
 *
 * Flow:
 *   1. Puppeteer injects window.__RENDER_PARAMS__
 *   2. This page loads font CSS.
 *   3. Puppeteer calls `await window.seekToFrame(f)`.
 *   4. The React state updates. Once DOM is flushed and fonts are ready,
 *      it sets `window.__FRAME_READY__ = true`.
 *   5. Puppeteer takes a native `page.screenshot({ clip: ... })` perfectly.
 */

import { useEffect, useState, useCallback } from 'react';
import { Stage } from '@/components/canvas/Stage';
import { FONT_OPTIONS, FontKey } from '@/lib/fonts';

declare global {
    interface Window {
        __RENDER_PARAMS__: {
            jobId: string;
            script: any;
            font: string;
            width?: number;
            height?: number;
            fps?: number;
        };
        seekToFrame: (f: number) => Promise<void>;
        __FRAME_READY__: boolean;
    }
}

export default function AutoRenderFramePage() {
    const [script, setScript] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [fontCss, setFontCss] = useState('');
    const [fps, setFps] = useState(30);

    // Initialization
    useEffect(() => {
        async function run() {
            const params = window.__RENDER_PARAMS__;
            if (!params) return;

            setScript(params.script);
            setFps(params.fps || 30);

            // Load Fonts
            const fontConfig = FONT_OPTIONS[params.font as FontKey] || FONT_OPTIONS['Modern'];
            const fontUrls: string[] = [fontConfig.url];
            const template = params.script.template || 'neon';

            if (template === 'brutalist') {
                fontUrls.push('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap');
                fontUrls.push('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100..700&display=swap');
            } else if (template === 'nanobanna') {
                fontUrls.push('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Fira+Code&display=swap');
            }

            try {
                const cssArray = await Promise.all(fontUrls.map(u => fetch(u).then(r => r.text())));
                setFontCss(cssArray.join('\n'));
            } catch (e) { }

            await document.fonts.ready;

            // Initial frame setup
            window.__FRAME_READY__ = true;
        }

        // Very quick timeout just to let the DOM init
        setTimeout(run, 50);
    }, []);

    // Provide the seek function to Puppeteer
    useEffect(() => {
        window.seekToFrame = async (frame: number) => {
            window.__FRAME_READY__ = false;

            const time = frame / fps;
            setCurrentTime(time);

            // Wait for paint: double requestAnimationFrame ensures the browser has composed the frame
            await new Promise<void>(resolve => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resolve();
                    });
                });
            });
            
            // Ensure fonts are still fully loaded
            await document.fonts.ready;

            window.__FRAME_READY__ = true;
        };
    }, [fps]);

    // Load fonts identically to parent window
    useEffect(() => {
        if (!fontCss) return;
        const style = document.createElement('style');
        style.innerHTML = fontCss;
        style.setAttribute('data-font-loader', 'true');
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, [fontCss]);

    if (!script) {
        return <div style={{ background: '#0f172a', width: '100vw', height: '100vh' }} />;
    }

    return (
        <>
            {/* Force-hide Next.js dev indicator overlay so it never appears in screenshots */}
            <style>{`
                nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast],
                #__next-build-indicator, [data-next-mark], nextjs-dev-tools-widget,
                [class*="nextjs"], [id*="__nextjs"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    width: 0 !important;
                    height: 0 !important;
                    overflow: hidden !important;
                }
            `}</style>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1280px',
                height: '720px',
                overflow: 'hidden',
                background: '#000000',
            }}>
                    <Stage
                    script={script}
                    currentTime={currentTime}
                />
            </div>
        </>
    );
}
