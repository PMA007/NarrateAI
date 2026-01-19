'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { FONT_OPTIONS, FontKey } from '@/lib/fonts';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiquidSVG } from '@/components/ui/liquid-svg';
import { AZURE_VOICES } from '@/lib/voices';

import { TemplatePreviewModal } from '@/components/ui/template-preview-modal';
import { Eye } from 'lucide-react';

export default function Home() {
    const router = useRouter();
    const { setScript, setAudioUrl, setFont, selectedFont, ttsProvider, setTTSProvider, selectedVoice, setVoice, suggestions, setSuggestions } = useStore();

    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('English');
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState('');
    const [template, setTemplate] = useState<any>('neon');

    // Preview Modal State
    const [previewTemplate, setPreviewTemplate] = useState<any>('neon');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleGenerate = () => {
        if (!topic) return;
        const url = new URL('/editor', window.location.href);
        url.searchParams.set('topic', topic);
        url.searchParams.set('language', language);
        url.searchParams.set('font', selectedFont);
        url.searchParams.set('template', template);
        router.push(url.toString());
    };

    const openPreview = (tmpl: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent selection when clicking preview
        setPreviewTemplate(tmpl);
        setIsPreviewOpen(true);
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b,transparent)] opacity-40" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />

            <TemplatePreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                template={previewTemplate}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 max-w-xl w-full space-y-8"
            >
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center space-x-2 bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-800 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium text-slate-300">AI Video Architect</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                        Concept to Video.
                        <br />
                        <span className="text-white">Instantly.</span>
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Generate cinematic, narrated educational videos from a single prompt.
                        NotebookLM style, real-time rendering.
                    </p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">What do you want to learn?</label>
                        <input
                            type="text"
                            placeholder="e.g. Quantum Physics, History of Rome, How LLMs work..."
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 text-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isGenerating}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Additional Instructions (Optional)</label>
                        <textarea
                            placeholder="e.g. Focus on the mathematical proof, make it funny, use a dark tone..."
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 resize-none h-24"
                            value={suggestions}
                            onChange={(e) => setSuggestions(e.target.value)}
                            disabled={isGenerating}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Language</label>
                            <select
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                disabled={isGenerating}
                            >
                                <option value="English">English</option>
                                <option value="Telugu">Telugu</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Spanish">Spanish</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Voice AI</label>
                            <select
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                value={ttsProvider}
                                onChange={(e) => setTTSProvider(e.target.value as any)}
                                disabled={isGenerating}
                            >
                                <option value="azure">Azure Neural</option>
                                <option value="google">Google TTS</option>
                                <option value="gemini">Gemini 2.5 Flash</option>
                            </select>
                        </div>

                        {/* Azure Voice Selector (Only if Azure is selected) */}
                        {ttsProvider === 'azure' && (
                            <div className="space-y-2 col-span-3">
                                <label className="text-sm font-medium text-slate-300 ml-1">Azure Voice</label>
                                <select
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={selectedVoice}
                                    onChange={(e) => setVoice(e.target.value)}
                                    disabled={isGenerating}
                                >
                                    {Object.entries(AZURE_VOICES).map(([voiceId, config]) => (
                                        <option key={voiceId} value={voiceId}>
                                            {config.name} ({config.language}, {config.gender})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Font</label>
                            <select
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
                                onChange={(e) => setFont(e.target.value as FontKey)}
                                disabled={isGenerating}
                            >
                                {Object.entries(FONT_OPTIONS).map(([key, option]) => (
                                    <option key={key} value={key}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300 ml-1">Design Style</label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Neon Dark Option */}
                            <button
                                onClick={() => setTemplate('neon')}
                                className={`group relative rounded-xl border overflow-hidden transition-all duration-300 ${template === 'neon'
                                    ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                                    : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                                    }`}
                            >
                                <div className="h-24 w-full bg-slate-950 relative overflow-hidden">
                                    {/* Neon Preview Visual */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#06b6d4,transparent)] opacity-20" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-cyan-500/30 rounded-full" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 border border-cyan-500/50 rounded-full animate-pulse" />

                                    {/* Preview Button */}
                                    <div
                                        onClick={(e) => openPreview('neon', e)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-cyan-500 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-30"
                                        title="Preview Design"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-900/90 text-left border-t border-slate-800">
                                    <div className="font-semibold text-white text-sm">Neon Dark</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Animated Lines</div>
                                </div>
                            </button>

                            {/* Retro Option */}
                            <button
                                onClick={() => setTemplate('retro')}
                                className={`group relative rounded-xl border overflow-hidden transition-all duration-300 ${template === 'retro'
                                    ? 'border-blue-700 ring-2 ring-blue-700/20 shadow-lg shadow-blue-700/10'
                                    : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                                    }`}
                            >
                                <div className="h-24 w-full relative overflow-hidden bg-[#0b1220]">
                                    {/* Retro Preview Visual */}
                                    <div className="absolute inset-0 bg-[#0b1220]" />
                                    {/* Radial Gradient */}
                                    <div className="absolute inset-0 opacity-100" style={{
                                        background: 'radial-gradient(120% 120% at 20% 18%, #f2f6ff 0%, #d5e3f6 35%, #a4bcd6 70%, #8aa3be 100%)'
                                    }} />
                                    {/* Ring */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-[#243a8a] rounded-full" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-[#243a8a] rounded-full opacity-60" />

                                    {/* Preview Button */}
                                    <div
                                        onClick={(e) => openPreview('retro', e)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/10 hover:bg-blue-800 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-30"
                                        title="Preview Design"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-900/90 text-left border-t border-slate-800 z-20 relative">
                                    <div className="font-semibold text-white text-sm">Retro</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Classic Blue</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!topic || isGenerating}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{status}</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                <span>Generate Video</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </main>
    );
}
