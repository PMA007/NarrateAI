'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, Check, Sparkles, AlertCircle } from 'lucide-react';

// Define Wizard Steps
type WizardStep = 'topic' | 'specs' | 'outline' | 'style' | 'generating';


// --- Agent Output Card ---
const AGENT_META: Record<string, { label: string; emoji: string; color: string }> = {
    research_decision: { label: 'Research Decision', emoji: '🔍', color: 'border-blue-500/40 bg-blue-950/20' },
    question_agent: { label: 'Question Agent', emoji: '❓', color: 'border-sky-500/40 bg-sky-950/20' },
    research_agent: { label: 'Research Agent', emoji: '🌐', color: 'border-teal-500/40 bg-teal-950/20' },
    flow_agent: { label: 'Flow Agent', emoji: '🌊', color: 'border-indigo-500/40 bg-indigo-950/20' },
    content_agent: { label: 'Content Agent', emoji: '📝', color: 'border-purple-500/40 bg-purple-950/20' },
    slide_designer: { label: 'Slide Designer', emoji: '🎨', color: 'border-pink-500/40 bg-pink-950/20' },
    slide_agent: { label: 'Slide Agent', emoji: '🔧', color: 'border-orange-500/40 bg-orange-950/20' },
    narration_agent: { label: 'Narration Agent', emoji: '🎤', color: 'border-emerald-500/40 bg-emerald-950/20' },
    assembler: { label: 'Assembler', emoji: '📦', color: 'border-cyan-500/40 bg-cyan-950/20' },
};

function AgentOutputCard({ agentId, output }: { agentId: string; output: any }) {
    const [open, setOpen] = useState(false);
    const meta = AGENT_META[agentId] ?? { label: agentId, emoji: '🤖', color: 'border-neutral-700 bg-neutral-900/20' };

    const renderContent = () => {
        switch (output?.type) {
            case 'research_decision':
                return (
                    <p className={`text-sm ${output.needsResearch ? 'text-blue-300' : 'text-slate-400'}`}>
                        {output.needsResearch ? '🔍 Web research required — queuing search queries.' : '✅ Research skipped — topic covered by built-in knowledge.'}
                    </p>
                );
            case 'queries':
                return (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {(output.queries || []).map((q: string, i: number) => (
                            <div key={i} className="text-xs bg-black/30 rounded p-2">
                                <span className="text-sky-400 font-bold">{i + 1}. </span>
                                <span className="text-neutral-200">{q}</span>
                            </div>
                        ))}
                    </div>
                );
            case 'research':
                return (
                    <pre className="text-xs text-teal-200 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                        {output.notes || 'No research notes.'}
                    </pre>
                );
            case 'flow':
                return (
                    <ol className="list-decimal list-inside space-y-1">
                        {(output.slides || []).map((s: any, i: number) => (
                            <li key={i} className="text-sm text-indigo-200">{typeof s === 'string' ? s : s.title || s.focus || JSON.stringify(s)}</li>
                        ))}
                    </ol>
                );
            case 'content':
                return (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(output.slides || []).map((s: any, i: number) => (
                            <div key={i} className="text-xs bg-black/30 rounded p-2 space-y-1">
                                <p className="font-bold text-purple-300">Slide {i + 1}: {s.title}</p>
                                {s.key_points?.length > 0 && (
                                    <ul className="list-disc list-inside text-neutral-300">
                                        {(s.key_points || []).slice(0, 3).map((p: string, j: number) => <li key={j}>{p}</li>)}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                );
            case 'designs':
                return (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {(output.designs || []).map((d: any, i: number) => (
                            <div key={i} className="text-xs bg-black/30 rounded p-2 flex justify-between">
                                <span className="text-pink-300">Slide {d.slide_number || i + 1}</span>
                                <span className="text-white font-mono">{d.layout}</span>
                            </div>
                        ))}
                    </div>
                );
            case 'slides':
                return (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(output.slides || []).map((s: any, i: number) => (
                            <div key={i} className="text-xs bg-black/30 rounded p-2 space-y-1">
                                <p className="font-bold text-orange-300">Slide {i + 1}: {s.title}</p>
                                <p className="text-neutral-400">Layout: <span className="text-white">{s.layout}</span></p>
                            </div>
                        ))}
                    </div>
                );
            case 'narration':
                return (
                    <p className="text-sm text-emerald-300">
                        ✅ Per-element voiceover narration written for {output.slideCount || '?'} slides.
                    </p>
                );
            case 'assembler':
                return (
                    <p className="text-sm text-cyan-300">
                        ✅ Finalized video package — <strong>{output.slideCount}</strong> slides ready.
                    </p>
                );
            default:
                return <pre className="text-xs text-neutral-400 whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>;
        }
    };

    return (
        <div className={`border rounded-lg overflow-hidden ${meta.color}`}>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
            >
                <span className="flex items-center gap-2 text-sm font-medium text-neutral-200">
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                    <span className="text-xs text-green-400 font-normal">✓ done</span>
                </span>
                <span className="text-neutral-500 text-xs">{open ? '▲ hide' : '▼ show'}</span>
            </button>
            {open && (
                <div className="px-4 pb-4 pt-1 border-t border-white/5 font-mono">
                    {renderContent()}
                </div>
            )}
        </div>
    );
}

// --- Agent Pipeline Graph ---
const AGENT_PIPELINE = [
    { id: 'research_decision', label: 'Decision', emoji: '🔍' },
    { id: 'question_agent', label: 'Questions', emoji: '❓' },
    { id: 'research_agent', label: 'Research', emoji: '🌐' },
    { id: 'flow_agent', label: 'Flow', emoji: '🌊' },
    { id: 'content_agent', label: 'Content', emoji: '📝' },
    { id: 'slide_designer', label: 'Designer', emoji: '🎨' },
    { id: 'slide_agent', label: 'Slides', emoji: '🔧' },
    { id: 'narration_agent', label: 'Narration', emoji: '🎤' },
    { id: 'assembler', label: 'Assemble', emoji: '📦' },
];

function AgentGraph({ activeAgent, completedAgents }: { activeAgent: string; completedAgents: string[] }) {
    return (
        <div className="w-full">
            {/* horizontal scrollable row */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
                {AGENT_PIPELINE.map((agent, idx) => {
                    const isActive = activeAgent === agent.id;
                    const isCompleted = completedAgents.includes(agent.id);
                    const isPending = !isActive && !isCompleted;

                    return (
                        <div key={agent.id} className="flex items-center">
                            {/* Node */}
                            <div className={`relative flex flex-col items-center gap-1 transition-all duration-300`}>
                                {/* Circle */}
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center text-xl
                                    border-2 transition-all duration-500
                                    ${isActive
                                        ? 'border-cyan-400 bg-cyan-950 shadow-[0_0_20px_4px_rgba(34,211,238,0.35)] scale-110'
                                        : isCompleted
                                            ? 'border-green-500 bg-green-950'
                                            : 'border-neutral-700 bg-neutral-900 opacity-40'
                                    }
                                `}>
                                    {isCompleted
                                        ? <span className="text-green-400 text-lg">✓</span>
                                        : <span>{agent.emoji}</span>
                                    }
                                    {/* Active pulse ring */}
                                    {isActive && (
                                        <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-50" />
                                    )}
                                </div>
                                {/* Label */}
                                <span className={`text-[10px] font-medium whitespace-nowrap transition-colors ${isActive ? 'text-cyan-300' :
                                    isCompleted ? 'text-green-400' :
                                        'text-neutral-600'
                                    }`}>
                                    {agent.label}
                                </span>
                            </div>

                            {/* Arrow connector (not after last) */}
                            {idx < AGENT_PIPELINE.length - 1 && (
                                <div className={`flex-1 mx-1 h-px min-w-[12px] transition-colors duration-500 ${completedAgents.includes(agent.id)
                                    ? 'bg-green-500/50'
                                    : 'bg-neutral-700'
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


export default function CreateWizard() {
    const router = useRouter();
    const { setScript } = useStore();

    // State
    const [step, setStep] = useState<WizardStep>('topic');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Data
    const [topic, setTopic] = useState('');
    const [genre, setGenre] = useState('general');
    const [slideCount, setSlideCount] = useState(5);
    const [outline, setOutline] = useState<string[]>([]);
    const [template, setTemplate] = useState('neon');
    const [specsReasoning, setSpecsReasoning] = useState('');

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

    // --- Log Viewer Component ---
    function LogViewer({ logs, thought }: { logs: string[], thought: string }) {
        return (
            <div className="w-full bg-black/80 rounded-lg p-4 font-mono text-xs text-green-400 h-64 overflow-y-auto space-y-1 border border-neutral-800 shadow-inner">
                {logs.length === 0 && !thought && <span className="text-neutral-500 animate-pulse">Waiting for agent...</span>}
                {logs.map((log, i) => (
                    <div key={i} className="border-l-2 border-green-500/30 pl-2 mb-2">
                        <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                        {log}
                    </div>
                ))}
                {thought && (
                    <div className="border-l-2 border-cyan-500/50 pl-2 text-cyan-300 animate-pulse">
                        <span className="opacity-50 mr-2">🤔 Thinking...</span>
                        <div className="whitespace-pre-wrap">{thought}</div>
                    </div>
                )}
                <div id="log-end" />
            </div>
        );
    }

    const [logs, setLogs] = useState<string[]>([]);
    const [currentThought, setCurrentThought] = useState('');
    const [activeAgent, setActiveAgent] = useState('');

    // Per-agent output tracking
    interface AgentOutput { agentId: string; output: any; }
    const [agentOutputs, setAgentOutputs] = useState<AgentOutput[]>([]);

    const handleFinalGeneration = async () => {
        setIsLoading(true);
        setStep('generating');
        setError('');
        setLogs([]);
        setAgentOutputs([]);
        setActiveAgent('');

        try {
            const response = await fetch('/api/wizard/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, genre, outline, template })
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
                                setLogs(prev => [...prev, event.message]);
                                setCurrentThought('');
                            } else if (event.type === 'agent_active') {
                                setActiveAgent(event.agentId);
                            } else if (event.type === 'token') {
                                setCurrentThought(prev => prev + event.message);
                            } else if (event.type === 'agent_complete') {
                                setActiveAgent('');
                                setAgentOutputs(prev => [...prev, { agentId: event.agentId, output: event.output }]);
                            } else if (event.type === 'result') {
                                const data = event.data;
                                // Safely extract slides - data can be the script directly
                                // or it could be wrapped in finalScript, or be the array itself
                                const rawSlides = Array.isArray(data)
                                    ? data
                                    : (data?.slides ?? data?.finalScript?.slides ?? []);
                                const finalScript = {
                                    topic,
                                    template: template as any,
                                    slides: Array.isArray(rawSlides) ? rawSlides : []
                                };
                                setScript(finalScript);
                                router.push('/studio');
                                return;
                            } else if (event.type === 'error') {
                                throw new Error(event.message);
                            }
                        } catch (e) {
                            console.error("Parse Error", e);
                        }
                    }
                }
            }

        } catch (e: any) {
            setError(e.message);
            setStep('style'); // Go back on error
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Helpers ---

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl">

                {/* Progress Bar */}
                <div className="mb-8 flex justify-between items-center text-sm text-neutral-500">
                    <span className={step === 'topic' ? 'text-cyan-400 font-bold' : ''}>1. Topic</span>
                    <span className={step === 'specs' ? 'text-cyan-400 font-bold' : ''}>2. Specs</span>
                    <span className={step === 'outline' ? 'text-cyan-400 font-bold' : ''}>3. Outline</span>
                    <span className={step === 'style' ? 'text-cyan-400 font-bold' : ''}>4. Style</span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">

                    {/* Loading Overlay (only for non-generating steps or initial load) */}
                    {isLoading && step !== 'generating' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
                            <p className="text-cyan-200 animate-pulse font-medium">
                                AI is thinking...
                            </p>
                        </div>
                    )}

                    <AnimatePresence mode="wait">

                        {/* STEP 1: TOPIC */}
                        {step === 'topic' && (
                            <motion.div
                                key="topic"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                        What should we create today?
                                    </h2>
                                    <p className="text-neutral-400">Enter a topic and select a genre to get started.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Topic</label>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="e.g., The History of the Internet, Quantum Physics..."
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Genre</label>
                                        <select
                                            value={genre}
                                            onChange={(e) => setGenre(e.target.value)}
                                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none appearance-none"
                                        >
                                            <option value="general">General / Explainer</option>
                                            <option value="history">History / Documentary</option>
                                            <option value="science">Science / Education</option>
                                            <option value="tech">Technology / Engineering</option>
                                            <option value="coding">Coding / Tutorial</option>
                                            <option value="story">Storytelling / Fiction</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleTopicSubmit}
                                    disabled={!topic.trim()}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
                                >
                                    <span>Continue</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 2: SPECS */}
                        {step === 'specs' && (
                            <motion.div
                                key="specs"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white">Project Scope</h2>
                                    <p className="text-neutral-400">We analyzed your topic. Here's our recommendation.</p>
                                </div>

                                <div className="bg-cyan-900/20 border border-cyan-800/50 p-4 rounded-lg flex items-start space-x-3">
                                    <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5" />
                                    <div>
                                        <h3 className="font-medium text-cyan-300 text-sm">AI Insight</h3>
                                        <p className="text-sm text-cyan-100/80 mt-1">{specsReasoning}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-3">
                                        Number of Slides: <span className="text-cyan-400 font-bold text-lg ml-2">{slideCount}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="3" max="15"
                                        value={slideCount}
                                        onChange={(e) => setSlideCount(parseInt(e.target.value))}
                                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                    <div className="flex justify-between text-xs text-neutral-500 mt-2">
                                        <span>Short (3)</span>
                                        <span>Standard (8)</span>
                                        <span>Long (15)</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSpecsSubmit}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
                                >
                                    <span>Draft Outline</span>
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
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white">Review Outline</h2>
                                    <p className="text-neutral-400">Here's the plan. You can edit any slide title.</p>
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {outline.map((title, idx) => (
                                        <div key={idx} className="flex items-center space-x-3 bg-neutral-800/50 p-3 rounded-md border border-neutral-700/50">
                                            <span className="text-neutral-500 font-mono text-sm w-6 text-center">{idx + 1}</span>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => {
                                                    const newOutline = [...outline];
                                                    newOutline[idx] = e.target.value;
                                                    setOutline(newOutline);
                                                }}
                                                className="flex-1 bg-transparent border-none text-white focus:ring-0 text-sm font-medium"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleSpecsSubmit} // Re-generate
                                        className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-3 rounded-lg transition-all text-sm"
                                    >
                                        Regenerate
                                    </button>
                                    <button
                                        onClick={handleOutlineSubmit}
                                        className="flex-[2] bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
                                    >
                                        <span>Looks Good</span>
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
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white">Choose a Style</h2>
                                    <p className="text-neutral-400">Select the visual theme for your video.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'neon', name: 'Neon Dark', color: 'bg-slate-900 border-cyan-500' },
                                        { id: 'retro', name: 'Retro 80s', color: 'bg-indigo-900 border-pink-500' },
                                        { id: 'brutalist', name: 'Brutalist', color: 'bg-neutral-100 text-black border-black' },
                                        { id: 'nanobanna', name: 'Nano Banana', color: 'bg-yellow-100 text-black border-yellow-500' },
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTemplate(t.id)}
                                            className={`p-4 rounded-xl border-2 transition-all text-left ${template === t.id
                                                ? 'border-cyan-500 ring-2 ring-cyan-500/20 ' + (t.id === 'brutalist' || t.id === 'nanobanna' ? 'bg-white text-black' : 'bg-neutral-800 text-white')
                                                : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 text-neutral-400'
                                                }`}
                                        >
                                            <div className="font-bold">{t.name}</div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleFinalGeneration}
                                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    <span>Create Video</span>
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 5: GENERATING */}
                        {step === 'generating' && (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="py-6 space-y-5"
                            >
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-1">
                                        Agentic Generation In Progress
                                    </h3>
                                    <p className="text-neutral-500 text-xs">Watch each AI agent work through the pipeline</p>
                                </div>

                                {/* Agent Pipeline Graph */}
                                <AgentGraph
                                    activeAgent={activeAgent}
                                    completedAgents={agentOutputs.map(a => a.agentId)}
                                />

                                {/* Live Log Viewer */}
                                <LogViewer logs={logs} thought={currentThought} />

                                {/* Per-Agent Output Cards */}
                                {agentOutputs.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-neutral-500 text-left font-mono uppercase tracking-widest">Agent Outputs</p>
                                        {agentOutputs.map((a, i) => (
                                            <AgentOutputCard key={i} agentId={a.agentId} output={a.output} />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {error && (
                        <div className="mt-6 bg-red-900/20 border border-red-800/50 text-red-200 p-4 rounded-lg flex items-center space-x-3 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
