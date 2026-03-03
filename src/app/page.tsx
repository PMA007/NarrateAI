'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, Check, Sparkles, AlertCircle, Wand2, Search, HelpCircle, Globe, LibraryBig, FileText, Palette, Blocks, Mic, Package, X, ChevronRight } from 'lucide-react';
import { NarrateLogo } from '@/components/ui/narrate-logo';
import { AgentFlowGraph } from '@/components/ui/agent-graph';
import { TerminalLog } from '@/components/ui/terminal-log';
import { SARVAM_VOICES, SARVAM_LANGUAGES, AZURE_VOICES, GEMINI_VOICES } from '@/lib/voices';

// Define Wizard Steps
type WizardStep = 'topic' | 'specs' | 'outline' | 'style' | 'generating';

// All 9 agents in the pipeline
const ALL_AGENTS = [
    { id: 'research_decision', name: 'Research Decision', desc: 'Evaluating research needs', icon: Search, color: 'blue' },
    { id: 'question_agent', name: 'Question Agent', desc: 'Generating search queries', icon: HelpCircle, color: 'sky' },
    { id: 'research_agent', name: 'Research Agent', desc: 'Searching the web', icon: Globe, color: 'teal' },
    { id: 'flow_agent', name: 'Flow Agent', desc: 'Planning slide distribution', icon: LibraryBig, color: 'indigo' },
    { id: 'content_agent', name: 'Content Agent', desc: 'Generating slide content', icon: FileText, color: 'purple' },
    { id: 'slide_designer', name: 'Slide Designer', desc: 'Choosing visual layouts', icon: Palette, color: 'pink' },
    { id: 'slide_agent', name: 'Slide Agent', desc: 'Structuring final JSON', icon: Blocks, color: 'orange' },
    { id: 'narration_agent', name: 'Narration Agent', desc: 'Writing voiceover scripts', icon: Mic, color: 'emerald' },
    { id: 'assembler', name: 'Assembler', desc: 'Packaging final script', icon: Package, color: 'cyan' },
];

// One-liner summaries per agent output type (shown in the post-completion agent grid)
function getAgentOneliner(output: any): string {
    if (!output) return 'No output captured.';
    switch (output.type) {
        case 'research_decision':
            return output.needsResearch ? 'Web research required — proceeding to search.' : 'Research skipped — using existing knowledge.';
        case 'queries':
            return `Generated ${output.queries?.length ?? 0} targeted search queries.`;
        case 'research':
            return (output.notes && output.notes !== 'No research results found.')
                ? 'Web research gathered & synthesized.'
                : 'No results found — proceeding with built-in knowledge.';
        case 'flow':
            return `Planned ${output.slides?.length ?? 0}-slide content distribution.`;
        case 'content':
            return `Generated rich content for ${output.slides?.length ?? 0} slides.`;
        case 'designs':
            return `Selected visual layouts for ${output.designs?.length ?? 0} slides.`;
        case 'slides':
            return `Structured ${output.slides?.length ?? 0} slides into final JSON.`;
        case 'narration':
            return `Authored voiceover scripts for ${output.slideCount ?? 0} slides.`;
        case 'assembler':
            return `Assembled ${output.slideCount} slides into final package.`;
        default:
            return 'Completed.';
    }
}

// Static icon colors for the inspector modal (Tailwind JIT can't resolve dynamic class strings)
const MODAL_ICON_COLORS: Record<string, string> = {
    blue: '#60a5fa', sky: '#38bdf8', teal: '#2dd4bf', indigo: '#818cf8',
    purple: '#c084fc', pink: '#f472b6', orange: '#fb923c', emerald: '#34d399', cyan: '#22d3ee',
};

function AgentOutputModal({ agentId, output, onClose }: { agentId: string; output: any; onClose: () => void }) {
    const agent = ALL_AGENTS.find(a => a.id === agentId);
    if (!agent) return null;

    const renderOutput = () => {
        if (!output) return <p className="text-slate-400 text-sm">No output recorded.</p>;

        switch (output.type) {
            case 'research_decision':
                return (
                    <div className={`flex items-center space-x-3 p-4 rounded-lg border ${output.needsResearch ? 'bg-blue-950/30 border-blue-800/50' : 'bg-slate-900 border-slate-800'}`}>
                        <Search className="w-5 h-5 text-blue-400 shrink-0" />
                        <p className="text-sm text-slate-300">{output.needsResearch ? 'Web research is required for this topic. Proceeding to generate search queries.' : 'This topic can be covered from built-in knowledge. Skipping research phase.'}</p>
                    </div>
                );
            case 'queries':
                return (
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Generated Search Queries ({output.queries?.length || 0})</p>
                        <div className="space-y-2">
                            {(output.queries || []).map((q: string, i: number) => (
                                <div key={i} className="flex items-center space-x-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <span className="text-xs text-slate-500 font-mono w-5 shrink-0">{i + 1}</span>
                                    <span className="text-sm text-sky-200">{q}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'research':
                return (
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Research Notes</p>
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-950 p-4 rounded-lg max-h-64 overflow-y-auto">{output.notes || 'No research notes available.'}</pre>
                    </div>
                );
            case 'flow':
                return (
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Slide Flow Plan ({output.slides?.length || 0} slides)</p>
                        <div className="space-y-2">
                            {(output.slides || []).map((s: any, i: number) => (
                                <div key={i} className="flex items-center space-x-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <span className="text-xs text-slate-500 font-mono w-5 shrink-0">{i + 1}</span>
                                    <span className="text-sm text-slate-200">{typeof s === 'string' ? s : s.title || s.focus || JSON.stringify(s)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'content':
                return (
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Slide Content ({output.slides?.length || 0} slides)</p>
                        <div className="space-y-3">
                            {(output.slides || []).map((s: any, i: number) => (
                                <div key={i} className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-xs text-slate-500 font-mono">{i + 1}</span>
                                        <span className="text-sm font-bold text-slate-100">{s.title}</span>
                                    </div>
                                    {s.key_points && <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">{(Array.isArray(s.key_points) ? s.key_points : []).slice(0, 4).map((b: string, j: number) => <li key={j}>{b}</li>)}</ul>}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'designs':
                return (
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Visual Layout Decisions ({output.designs?.length || 0} slides)</p>
                        <div className="space-y-2">
                            {(output.designs || []).map((d: any, i: number) => (
                                <div key={i} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <span className="text-sm text-slate-200">Slide {d.slide_number || i + 1}</span>
                                    <span className="text-xs text-pink-300 font-mono border border-pink-800/50 px-2 py-0.5 rounded">{d.layout}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'slides':
                return (
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Final Slide JSON ({output.slides?.length || 0} slides)</p>
                        <div className="space-y-3">
                            {(output.slides || []).map((s: any, i: number) => (
                                <div key={i} className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-xs text-slate-500 font-mono">{i + 1}</span>
                                        <span className="text-sm font-bold text-slate-100">{s.title}</span>
                                        <span className="ml-auto text-xs text-slate-600 font-mono border border-slate-700 px-1.5 py-0.5 rounded">{s.layout}</span>
                                    </div>
                                    {s.content?.bullets && <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">{s.content.bullets.slice(0, 3).map((b: string, j: number) => <li key={j}>{b}</li>)}</ul>}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'narration':
                return (
                    <div className="flex items-center space-x-3 p-4 rounded-lg border bg-emerald-950/30 border-emerald-800/50">
                        <Mic className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-sm text-slate-300">Per-element voiceover narration authored for <span className="text-emerald-300 font-bold">{output.slideCount || '?'}</span> slides.</p>
                    </div>
                );
            case 'assembler':
                return (
                    <div className="flex items-center space-x-3 p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/50">
                        <Check className="w-5 h-5 text-cyan-400 shrink-0" />
                        <p className="text-sm text-slate-300">Final video script assembled with <span className="text-cyan-300 font-bold">{output.slideCount}</span> slides. Ready for studio.</p>
                    </div>
                );
            default:
                return <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40" onClick={onClose} />
            {/* Drawer panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed right-0 top-0 bottom-0 z-50 w-[440px] max-w-[92vw] bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0"
                    style={{ borderTopColor: MODAL_ICON_COLORS[agent.color] ?? '#334155', borderTopWidth: 2 }}>
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                            <agent.icon className="w-5 h-5" style={{ color: MODAL_ICON_COLORS[agent.color] ?? '#94a3b8' }} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">{agent.name}</h3>
                            <p className="text-xs text-slate-500">Agent Output Inspector</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-1 custom-scrollbar">
                    {renderOutput()}
                </div>
            </motion.div>
        </>
    );
}

export default function Home() {
    const router = useRouter();
    const {
        setScript,
        ttsProvider, setTTSProvider,
        selectedVoice, setVoice,
        narrationLanguage, setNarrationLanguage,
        contentLanguage, setContentLanguage,
    } = useStore();

    // State
    const [step, setStep] = useState<WizardStep>('topic');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    // Data
    const [topic, setTopic] = useState('');
    const [genre, setGenre] = useState('general');
    const [slideCount, setSlideCount] = useState(5);
    const [outline, setOutline] = useState<string[]>([]);
    const [template, setTemplate] = useState('neon');
    const [specsReasoning, setSpecsReasoning] = useState('');

    const [activeAgent, setActiveAgent] = useState<string>('');
    const [completedAgents, setCompletedAgents] = useState<string[]>([]);
    const [agentOutputs, setAgentOutputs] = useState<Record<string, any>>({});
    const [inspectedAgent, setInspectedAgent] = useState<string | null>(null);
    // Per-agent logs: stores { logs: string[], thought: string } keyed by agentId
    const [agentLogs, setAgentLogs] = useState<Record<string, { logs: { time: string, text: string }[]; thought: string }>>({});
    // Which agent's log panel is showing on the right
    const [selectedAgent, setSelectedAgent] = useState<string>('');

    // --- Actions ---

    const handleTopicSubmit = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/wizard/specs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, genre })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setSlideCount(data.recommendedSlideCount || 5);
            setSpecsReasoning(data.reasoning || '');
            setStep('specs');
        } catch (e: any) {
            setError(e.message || "Failed to analyze topic");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSpecsSubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/wizard/outline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, genre, slideCount })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setOutline(data.outline || []);
            setStep('outline');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOutlineSubmit = () => {
        setStep('style');
    };

    const [logs, setLogs] = useState<{ time: string, text: string }[]>([]);
    const [currentThought, setCurrentThought] = useState('');
    const activeAgentRef = useRef<string>('');

    const handleFinalGeneration = async () => {
        setIsLoading(true);
        setStep('generating');
        setError('');
        setLogs([]);
        setIsComplete(false);
        setActiveAgent('');
        activeAgentRef.current = '';
        setCompletedAgents([]);
        setAgentOutputs({});
        setCurrentThought('');
        setAgentLogs({});
        setSelectedAgent('');

        try {
            const response = await fetch('/api/wizard/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, genre, outline, template, language: contentLanguage })
            });

            if (!response.ok) throw new Error(response.statusText);
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const event = JSON.parse(line.substring(6));

                            if (event.type === 'log') {
                                const newLog = {
                                    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                                    text: event.message
                                };
                                setLogs(prev => [...prev, newLog]);
                                setCurrentThought('');
                                // Also add log to per-agent store
                                // Prefer explicit agentId from event, fall back to ref (sync) then state (async)
                                setAgentLogs(prev => {
                                    const aid = event.agentId || activeAgentRef.current;
                                    if (!aid) return prev;
                                    const existing = prev[aid] || { logs: [], thought: '' };
                                    return { ...prev, [aid]: { ...existing, logs: [...existing.logs, newLog] } };
                                });
                            } else if (event.type === 'agent_active') {
                                activeAgentRef.current = event.agentId;
                                // Mark previous active agent as completed
                                setActiveAgent(prev => {
                                    if (prev) setCompletedAgents(c => c.includes(prev) ? c : [...c, prev]);
                                    return event.agentId;
                                });
                                // Auto-select the newly active agent in the log panel
                                setSelectedAgent(event.agentId);
                                // Ensure agent logs exist for this agent without wiping out history
                                setAgentLogs(prev => {
                                    const existing = prev[event.agentId] || { logs: [], thought: '' };
                                    return {
                                        ...prev,
                                        [event.agentId]: { ...existing }
                                    };
                                });
                            } else if (event.type === 'agent_complete') {
                                console.log('[agent_complete] Received for:', event.agentId, 'output:', event.output);
                                setAgentOutputs(prev => ({ ...prev, [event.agentId]: event.output }));
                                setCompletedAgents(prev => prev.includes(event.agentId) ? prev : [...prev, event.agentId]);

                                // For agents using structured output, they might not emit 'token' chunks. 
                                // We inject their final output payload as a JSON thought block here if they have one.
                                if (event.output && typeof event.output === 'object') {
                                    setAgentLogs(prev => {
                                        const existing = prev[event.agentId] || { logs: [], thought: '' };
                                        // Only append if the thought string is relatively empty (meaning it didn't stream properly)
                                        if (existing.thought.trim().length < 50) {
                                            const formattedOutput = `\n\`\`\`json\n${JSON.stringify(event.output, null, 2)}\n\`\`\`\n`;
                                            return { ...prev, [event.agentId]: { ...existing, thought: existing.thought + formattedOutput } };
                                        }
                                        return prev;
                                    });
                                }

                                // DO NOT clear thought for completed agent so it can be viewed later.
                            } else if (event.type === 'token') {
                                setCurrentThought(prev => prev + event.message);
                                // Route token to active agent's per-agent thought (using ref for fresh value)
                                setAgentLogs(prev => {
                                    const aid = activeAgentRef.current;
                                    if (!aid) return prev;
                                    const existing = prev[aid] || { logs: [], thought: '' };
                                    return { ...prev, [aid]: { ...existing, thought: existing.thought + event.message } };
                                });
                            } else if (event.type === 'result') {
                                const data = event.data;
                                const finalScript = {
                                    topic,
                                    template: template as any,
                                    slides: Array.isArray(data) ? data : data.slides || (data.finalScript && data.finalScript.slides)
                                };
                                useStore.getState().setScript(finalScript);
                                // Mark last agent as done
                                setActiveAgent('');
                                setCompletedAgents(ALL_AGENTS.map(a => a.id));
                                setIsComplete(true);
                                return;
                            } else if (event.type === 'error') {
                                throw new Error(event.message);
                            }
                        } catch (e) {
                            console.error('[SSE] JSON Parse Error on line:', line.substring(0, 200), '\nError:', e);
                        }
                    }
                }
            }

        } catch (e: any) {
            setError(e.message);
            setStep('style');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Helpers ---

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0f172a,transparent)] opacity-40 z-0" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 z-50" />

            <div className="w-full max-w-4xl z-10 flex flex-col items-center">

                {/* Header / Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col items-center"
                >
                    <NarrateLogo className="scale-125 mb-4" />
                    <p className="text-slate-400 text-center max-w-md mx-auto leading-relaxed">
                        Transform your ideas into cinematic video narratives using autonomous AI agents.
                    </p>
                </motion.div>

                {/* Progress Bar (Only show if started) */}
                <AnimatePresence>
                    {topic && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="w-full max-w-2xl mb-8 flex justify-between items-center text-xs uppercase tracking-widest font-bold text-neutral-600"
                        >
                            <span className={step === 'topic' ? 'text-cyan-400' : ''}>1. Concept</span>
                            <div className="h-px bg-neutral-800 flex-1 mx-4" />
                            <span className={step === 'specs' ? 'text-cyan-400' : ''}>2. Blueprint</span>
                            <div className="h-px bg-neutral-800 flex-1 mx-4" />
                            <span className={step === 'outline' ? 'text-cyan-400' : ''}>3. Narrative</span>
                            <div className="h-px bg-neutral-800 flex-1 mx-4" />
                            <span className={step === 'style' ? 'text-cyan-400' : ''}>4. Aesthetic</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/5">

                    {/* Loading Overlay (only for non-generating steps or initial load) */}
                    {isLoading && step !== 'generating' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
                            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
                            <p className="text-cyan-200 animate-pulse font-medium bg-cyan-950/50 px-4 py-1 rounded-full text-sm border border-cyan-500/20">
                                Consulting Agents...
                            </p>
                        </div>
                    )}

                    <AnimatePresence mode="wait">

                        {/* STEP 1: TOPIC */}
                        {step === 'topic' && (
                            <motion.div
                                key="topic"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4 text-center">
                                    <h2 className="text-3xl font-bold text-white">
                                        What's your story?
                                    </h2>
                                    <p className="text-slate-400">Tell us what you want to explain, teach, or narrate.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                        <textarea
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="e.g., Explain Quantum Entanglement like I'm 5, or create a Documentary about the Fall of Rome..."
                                            className="relative w-full h-32 bg-slate-950 border border-slate-700/50 rounded-xl p-5 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none text-lg placeholder:text-slate-600 transition-all font-light"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Narrative Style</label>
                                            <select
                                                value={genre}
                                                onChange={(e) => setGenre(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                                            >
                                                <option value="general">Explainer (General)</option>
                                                <option value="history">Documentary (History)</option>
                                                <option value="science">Scientific Review</option>
                                                <option value="tech">Tech Deep Dive</option>
                                                <option value="coding">Coding Tutorial</option>
                                                <option value="story">Cinematic Story</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                        <div className="flex items-end">
                                            <button
                                                onClick={handleTopicSubmit}
                                                disabled={!topic.trim()}
                                                className="w-full h-[50px] bg-white text-black hover:bg-cyan-50 disabled:bg-slate-800 disabled:text-slate-600 font-bold rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-white/5 active:scale-95 transform duration-200"
                                            >
                                                <span>Begin Analysis</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: SPECS */}
                        {step === 'specs' && (
                            <motion.div
                                key="specs"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-bold text-white">Architectural Blueprint</h2>
                                    <p className="text-slate-400 text-sm">Our AI architect analyzed your request.</p>
                                </div>

                                <div className="bg-cyan-950/30 border border-cyan-800/30 p-5 rounded-2xl flex items-start space-x-4 backdrop-blur-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Sparkles className="w-20 h-20 text-cyan-400" />
                                    </div>
                                    <Sparkles className="w-6 h-6 text-cyan-400 mt-1 shrink-0 relative z-10" />
                                    <div className="relative z-10">
                                        <h3 className="font-bold text-cyan-300 text-sm uppercase tracking-wide mb-1">AI Reasoning</h3>
                                        <p className="text-sm text-cyan-100/80 leading-relaxed font-light">{specsReasoning}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-sm font-medium text-slate-300">
                                            Recommended Length
                                        </label>
                                        <span className="text-cyan-400 font-bold text-xl">{slideCount} Slides</span>
                                    </div>

                                    <input
                                        type="range"
                                        min="3" max="15"
                                        value={slideCount}
                                        onChange={(e) => setSlideCount(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 uppercase font-bold tracking-wider">
                                        <span>Short (3)</span>
                                        <span>Documentary (8)</span>
                                        <span>Feature (15)</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSpecsSubmit}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/20 active:scale-95"
                                >
                                    <span>Generate Narrative Arc</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 3: OUTLINE */}
                        {step === 'outline' && (
                            <motion.div
                                key="outline"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-bold text-white">Narrative Structure</h2>
                                    <p className="text-slate-400 text-sm">Review the flow. Edit titles to fine-tune the story.</p>
                                </div>

                                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar p-1">
                                    {outline.map((title, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={idx}
                                            className="flex items-center space-x-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80 transition-all group"
                                        >
                                            <span className="text-slate-500 font-mono text-xs w-6 text-center group-hover:text-cyan-400 transition-colors">{idx + 1}</span>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => {
                                                    const newOutline = [...outline];
                                                    newOutline[idx] = e.target.value;
                                                    setOutline(newOutline);
                                                }}
                                                className="flex-1 bg-transparent border-none text-slate-200 focus:ring-0 text-sm font-medium placeholder:text-slate-600"
                                            />
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="flex space-x-3 pt-4 border-t border-slate-800/50">
                                    <button
                                        onClick={handleSpecsSubmit} // Re-generate
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition-all text-sm font-medium"
                                    >
                                        Regenerate
                                    </button>
                                    <button
                                        onClick={handleOutlineSubmit}
                                        className="flex-[2] bg-white text-black hover:bg-slate-100 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-white/5 active:scale-95"
                                    >
                                        <span>Confirm Structure</span>
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: STYLE */}
                        {step === 'style' && (
                            <motion.div
                                key="style"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-bold text-white">Visual Aesthetic</h2>
                                    <p className="text-slate-400 text-sm">Choose the lens through which to tell your story.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'neon', name: 'Neon Dark', desc: 'Cyberpunk & sleek', color: 'border-cyan-500' },
                                        { id: 'retro', name: 'Retro 80s', desc: 'VHS & Nostalgia', color: 'border-pink-500' },
                                        { id: 'brutalist', name: 'Brutalist', desc: 'Bold & Raw', color: 'border-[#CBF400]' },
                                        { id: 'nanobanna', name: 'Nano Banana', desc: 'Clean & Tech', color: 'border-[#FFD700]' },
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTemplate(t.id)}
                                            className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden group ${template === t.id
                                                ? `ring-2 ring-offset-2 ring-offset-slate-900 ${t.color} bg-slate-800`
                                                : 'border-slate-800 hover:border-slate-600 bg-slate-900/30'
                                                }`}
                                        >
                                            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-3xl transition-transform duration-500 ${template === t.id ? 'scale-150 opacity-20' : 'scale-0'}`} />

                                            <div className="font-bold text-slate-200 group-hover:text-white">{t.name}</div>
                                            <div className="text-xs text-slate-500 mt-1 font-medium">{t.desc}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* ── Voice & Language ─────────────────────────── */}
                                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Voice &amp; Language</p>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Slide Content Language */}
                                        <div>
                                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Slide Content Language</label>
                                            <select
                                                value={contentLanguage}
                                                onChange={e => setContentLanguage(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                {['English','Telugu','Hindi','Tamil','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi','Odia'].map(l => (
                                                    <option key={l} value={l}>{l}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* TTS Engine */}
                                        <div>
                                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">TTS Engine</label>
                                            <select
                                                value={ttsProvider}
                                                onChange={e => {
                                                    const p = e.target.value as any;
                                                    setTTSProvider(p);
                                                    if (p === 'sarvam') { setVoice('shubh'); setNarrationLanguage('te-IN'); }
                                                    else if (p === 'azure') { setVoice('te-IN-MohanNeural'); }
                                                    else if (p === 'gemini') { setVoice('default'); }
                                                    else { setVoice('te'); }
                                                }}
                                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <option value="sarvam">🎙 Sarvam AI (bulbul:v3)</option>
                                                <option value="google">🔊 Google TTS (free)</option>
                                                <option value="azure">☁️ Azure Neural TTS</option>
                                                <option value="gemini">✨ Gemini TTS</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Narration Language — Sarvam & Google */}
                                        {(ttsProvider === 'sarvam' || ttsProvider === 'google') && (
                                            <div>
                                                <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Narration Language</label>
                                                <select
                                                    value={narrationLanguage}
                                                    onChange={e => setNarrationLanguage(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                                                >
                                                    {Object.entries(SARVAM_LANGUAGES).map(([code, label]) => (
                                                        <option key={code} value={code}>{label} ({code})</option>
                                                    ))}
                                                    <option value="en-US">English US (en-US)</option>
                                                </select>
                                            </div>
                                        )}

                                        {/* Voice / Speaker selector */}
                                        <div className={ttsProvider === 'sarvam' || ttsProvider === 'google' ? '' : 'col-span-2'}>
                                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                                                {ttsProvider === 'gemini' ? 'Speaking Style' : 'Voice / Speaker'}
                                            </label>

                                            {ttsProvider === 'sarvam' && (
                                                <select value={selectedVoice} onChange={e => setVoice(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                                                    <optgroup label="♀ Female">
                                                        {Object.entries(SARVAM_VOICES).filter(([,v]) => v.gender === 'Female').map(([id,v]) => (
                                                            <option key={id} value={id}>{v.name}</option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="♂ Male">
                                                        {Object.entries(SARVAM_VOICES).filter(([,v]) => v.gender === 'Male').map(([id,v]) => (
                                                            <option key={id} value={id}>{v.name}</option>
                                                        ))}
                                                    </optgroup>
                                                </select>
                                            )}

                                            {ttsProvider === 'azure' && (
                                                <select value={selectedVoice} onChange={e => setVoice(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                                                    {Object.entries(
                                                        Object.entries(AZURE_VOICES).reduce((acc, [id, v]) => {
                                                            if (!acc[v.language]) acc[v.language] = [];
                                                            acc[v.language].push({ id, ...v });
                                                            return acc;
                                                        }, {} as Record<string, any[]>)
                                                    ).map(([lang, voices]) => (
                                                        <optgroup key={lang} label={lang}>
                                                            {voices.map((v: any) => <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>)}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            )}

                                            {ttsProvider === 'google' && (
                                                <div className="bg-slate-900 border border-slate-700 text-slate-400 text-sm rounded-lg px-3 py-2 italic">
                                                    Auto (based on narration language)
                                                </div>
                                            )}

                                            {ttsProvider === 'gemini' && (
                                                <select value={selectedVoice} onChange={e => setVoice(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500">
                                                    {Object.keys(GEMINI_VOICES).map(style => (
                                                        <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleFinalGeneration}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-5 rounded-xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center space-x-3 active:scale-95 text-lg mt-4"
                                >
                                    <Wand2 className="w-5 h-5 animate-pulse" />
                                    <span>Ignite Engine</span>
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 5: GENERATING */}
                        {step === 'generating' && (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="py-1 space-y-4"
                            >
                                {/* Agent Inspector Modal (output details) */}
                                <AnimatePresence>
                                    {inspectedAgent && (
                                        <AgentOutputModal
                                            agentId={inspectedAgent}
                                            output={agentOutputs[inspectedAgent]}
                                            onClose={() => setInspectedAgent(null)}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    {isComplete ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center">
                                                <Check className="w-3.5 h-3.5 text-green-400" />
                                            </div>
                                            <h3 className="text-sm font-bold text-white">Generation Complete</h3>
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center space-x-1.5 text-cyan-400 bg-cyan-950/30 px-2.5 py-1 rounded-full border border-cyan-800/40">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span className="text-xs font-mono">Agents Working</span>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-600">Click a node · view its log</p>
                                </div>

                                {/* ── Two-panel: [Graph] + [Log] ── */}
                                <div className="grid grid-cols-5 gap-3">

                                    {/* LEFT 2/5 — Agent Graph */}
                                    <div className="col-span-2 flex flex-col bg-slate-950/20 rounded-xl border border-white/5 relative">
                                        <AgentFlowGraph
                                            activeAgent={activeAgent}
                                            completedAgents={completedAgents}
                                            selectedAgent={selectedAgent}
                                            onSelect={(id) => {
                                                setSelectedAgent(id);
                                                if (agentOutputs[id]) setInspectedAgent(id);
                                            }}
                                        />
                                    </div>

                                    {/* RIGHT 3/5 — Log Panel */}
                                    <div className="col-span-3 flex flex-col gap-3">
                                        <div className="flex-1 min-h-0" style={{ height: '320px' }}>
                                            {(() => {
                                                const selMeta = ALL_AGENTS.find(a => a.id === selectedAgent);
                                                const selLog = agentLogs[selectedAgent] || { logs: [], thought: '' };
                                                const selDone = completedAgents.includes(selectedAgent);
                                                return (
                                                    <TerminalLog
                                                        logs={selLog.logs && selLog.logs.length > 0 ? selLog.logs : (selectedAgent ? [] : logs)}
                                                        thought={selDone ? selLog.thought : (activeAgent === selectedAgent ? (selLog.thought || currentThought) : '')}
                                                        title={selMeta?.name ?? (selectedAgent ? selectedAgent : 'System')}
                                                        isComplete={selDone}
                                                        output={selDone ? agentOutputs[selectedAgent] : undefined}
                                                    />
                                                );
                                            })()}
                                        </div>

                                        {/* Action area */}
                                        {isComplete ? (
                                            <div className="space-y-2">
                                                {/* Agent summary grid */}
                                                <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl overflow-hidden">
                                                    <div className="px-3 py-1.5 border-b border-slate-800/60 flex items-center justify-between">
                                                        <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500">Agent Results</span>
                                                        <span className="text-[9px] text-slate-600">click to inspect</span>
                                                    </div>
                                                    <div className="divide-y divide-slate-800/40">
                                                        {ALL_AGENTS.map(agent => {
                                                            const out = agentOutputs[agent.id];
                                                            const done = completedAgents.includes(agent.id);
                                                            const isSelected = selectedAgent === agent.id;
                                                            return (
                                                                <button
                                                                    key={agent.id}
                                                                    onClick={() => {
                                                                        setSelectedAgent(agent.id);
                                                                        if (out) setInspectedAgent(agent.id);
                                                                    }}
                                                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                                                                        isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-900/60'
                                                                    } ${done ? '' : 'opacity-40'}`}
                                                                >
                                                                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-slate-900">
                                                                        <agent.icon className="w-3 h-3" style={{ color: done ? MODAL_ICON_COLORS[agent.color] : '#475569' }} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="text-[10px] font-bold text-slate-300 block leading-tight">{agent.name}</span>
                                                                        <span className="text-[9px] text-slate-500 block truncate leading-tight mt-0.5">
                                                                            {done ? getAgentOneliner(out) : 'Waiting...'}
                                                                        </span>
                                                                    </div>
                                                                    {done && out && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <motion.button
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    onClick={() => router.push('/studio')}
                                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 active:scale-95"
                                                >
                                                    <span>Enter Studio</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-slate-600 space-y-1">
                                                {ALL_AGENTS.map(a => (
                                                    <div key={a.id} className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                                                            background: completedAgents.includes(a.id) ? '#22c55e'
                                                                : activeAgent === a.id ? '#22d3ee' : '#1e293b'
                                                        }} />
                                                        <span style={{ color: completedAgents.includes(a.id) ? '#22c55e' : activeAgent === a.id ? '#22d3ee' : '#334155' }}>{a.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}


                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 bg-red-950/20 border border-red-900/50 text-red-200 p-4 rounded-xl flex items-center space-x-3 text-sm backdrop-blur-md"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="absolute bottom-6 text-slate-600 text-xs font-mono">
                v2.1 • Research & Narration Engine Online
            </div>
        </div>
    );
}

