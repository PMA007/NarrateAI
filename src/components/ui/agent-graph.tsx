'use client';

/**
 * AgentFlowGraph — reflects the ACTUAL wizard-graph.ts LangGraph topology:
 *
 *  START
 *    │
 *  research_decision  (decides if web research is needed)
 *    │
 *   ┌───── YES ──────┐
 *   │                 │
 *  question_agent    (skip)
 *   │                 │
 *  research_agent     │
 *   │                 │
 *   └─────────────────┘
 *    │
 *  flow_agent         (plans content distribution across slides)
 *    │
 *  content_agent      (generates raw content per slide)
 *    │
 *  slide_designer     (picks best visual layout per slide)
 *    │
 *  slide_agent        (generates final slide JSON)
 *    │
 *  narration_agent    (writes per-element narration)
 *    │
 *  assembler          (packages final production script)
 *    │
 *  END
 */

// ─── Graph topology (mirrors addNode / addEdge in wizard-graph.ts) ────────────

/** Sentinel nodes that bracket the real pipeline */
const SENTINELS = ['__start__', '__end__'];

/** Real node definitions — id matches the addNode() call in wizard-graph.ts */
export const GRAPH_NODES = [
    {
        id: '__start__',
        label: 'START',
        sublabel: 'Entry point',
        kind: 'sentinel' as const,
    },
    {
        id: 'research_decision',
        label: 'Research Decision',
        sublabel: 'Needs web research?',
        color: '#60a5fa',       // blue-400
        note: 'Conditional: routes to research or skips',
    },
    {
        id: 'question_agent',
        label: 'Question Agent',
        sublabel: 'Generates search queries',
        color: '#38bdf8',       // sky-400
        note: 'Only runs when research is needed',
    },
    {
        id: 'research_agent',
        label: 'Research Agent',
        sublabel: 'Searches the web',
        color: '#2dd4bf',       // teal-400
    },
    {
        id: 'flow_agent',
        label: 'Flow Agent',
        sublabel: 'Plans slide distribution',
        color: '#818cf8',       // indigo-400
    },
    {
        id: 'content_agent',
        label: 'Content Agent',
        sublabel: 'Generates slide content',
        color: '#c084fc',       // purple-400
    },
    {
        id: 'slide_designer',
        label: 'Slide Designer',
        sublabel: 'Picks visual layouts',
        color: '#f472b6',       // pink-400
    },
    {
        id: 'slide_agent',
        label: 'Slide Agent',
        sublabel: 'Structures final JSON',
        color: '#fb923c',       // orange-400
    },
    {
        id: 'narration_agent',
        label: 'Narration Agent',
        sublabel: 'Per-element voiceover',
        color: '#34d399',       // emerald-400
    },
    {
        id: 'assembler',
        label: 'Assembler',
        sublabel: 'Packages final script',
        color: '#22d3ee',       // cyan-400
    },
    {
        id: '__end__',
        label: 'END',
        sublabel: 'Video script ready',
        kind: 'sentinel' as const,
    },
];

/** Edges — mirrors addEdge() / addConditionalEdges() in wizard-graph.ts */
export const GRAPH_EDGES: { from: string; to: string; label?: string; dashed?: boolean }[] = [
    { from: '__start__', to: 'research_decision' },
    // Conditional branch: research needed → question_agent; else → flow_agent
    { from: 'research_decision', to: 'question_agent', label: 'yes', dashed: true },
    { from: 'research_decision', to: 'flow_agent', label: 'no', dashed: true },
    { from: 'question_agent', to: 'research_agent' },
    { from: 'research_agent', to: 'flow_agent' },
    // Main pipeline
    { from: 'flow_agent', to: 'content_agent' },
    { from: 'content_agent', to: 'slide_designer' },
    { from: 'slide_designer', to: 'slide_agent' },
    { from: 'slide_agent', to: 'narration_agent' },
    { from: 'narration_agent', to: 'assembler' },
    { from: 'assembler', to: '__end__' },
];

// ─── Layout ──────────────────────────────────────────────────────────────────

const NODE_W = 180;
const NODE_H = 40;
const SENT_R = 14;     // sentinel (circle) radius
const VSTEP = 64;     // vertical gap between node centres
const CX = 130;    // horizontal centre of the SVG
const SVG_W = 260;

function nodeY(i: number) { return 30 + i * VSTEP; }

// ─── Component ───────────────────────────────────────────────────────────────

interface AgentFlowGraphProps {
    activeAgent: string;
    completedAgents: string[];
    selectedAgent: string;
    onSelect: (id: string) => void;
}

export function AgentFlowGraph({
    activeAgent,
    completedAgents,
    selectedAgent,
    onSelect,
}: AgentFlowGraphProps) {

    const totalNodes = GRAPH_NODES.length;
    const SVG_H = 30 + (totalNodes - 1) * VSTEP + 40;

    // Helper: colour for a node
    const nodeColor = (node: typeof GRAPH_NODES[number]) =>
        'color' in node ? node.color! : '#64748b';

    const isActive = (id: string) => activeAgent === id;
    const isDone = (id: string) => completedAgents.includes(id) || (id === '__start__' && completedAgents.length > 0);
    const isSelected = (id: string) => selectedAgent === id;
    const isSentinel = (id: string) => SENTINELS.includes(id);

    return (
        <div className="w-full h-[460px] max-h-[560px] flex flex-col items-center overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
            {/* Legend */}
            <div className="flex items-center gap-3 mb-2 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-slate-700 border border-slate-600" /> Pending</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-cyan-900 border border-cyan-400" style={{ boxShadow: '0 0 6px #22d3ee80' }} /> Active</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-950 border border-green-500" /> Done</span>
            </div>

            <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                width="100%"
                height={SVG_H}
                style={{ overflow: 'visible', flexShrink: 0 }}
            >
                <defs>
                    {/* Arrow markers */}
                    <marker id="ag-arrow-idle" viewBox="0 0 10 10" refX="9" refY="5"
                        markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M0,0 L10,5 L0,10 z" fill="#1e293b" />
                    </marker>
                    <marker id="ag-arrow-done" viewBox="0 0 10 10" refX="9" refY="5"
                        markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M0,0 L10,5 L0,10 z" fill="#22c55e" opacity="0.8" />
                    </marker>
                    {/* Glow filter for active node */}
                    <filter id="ag-glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* ── EDGES ── */}
                {GRAPH_EDGES.map((edge, i) => {
                    const fromIdx = GRAPH_NODES.findIndex(n => n.id === edge.from);
                    const toIdx = GRAPH_NODES.findIndex(n => n.id === edge.to);
                    const fromNode = GRAPH_NODES[fromIdx];
                    const toNode = GRAPH_NODES[toIdx];

                    const done = isDone(edge.from);
                    const color = done ? '#22c55e' : '#1e293b';

                    // Source bottom-centre
                    const x1 = CX;
                    const y1 = isSentinel(edge.from)
                        ? nodeY(fromIdx) + SENT_R          // sentinel circle bottom
                        : nodeY(fromIdx) + NODE_H / 2 + 1; // rect bottom

                    // Target top-centre
                    const x2 = CX;
                    const y2 = isSentinel(edge.to)
                        ? nodeY(toIdx) - SENT_R            // sentinel circle top
                        : nodeY(toIdx) - NODE_H / 2 - 6;  // rect top (leave room for arrowhead)

                    const midY = (y1 + y2) / 2;

                    return (
                        <g key={i}>
                            <path
                                d={`M ${x1} ${y1} C ${x1} ${midY} ${x2} ${midY} ${x2} ${y2}`}
                                stroke={color}
                                strokeWidth={done ? 1.8 : 1.2}
                                strokeOpacity={done ? 0.75 : 1}
                                strokeDasharray={edge.dashed ? '4 3' : 'none'}
                                fill="none"
                                markerEnd={done ? 'url(#ag-arrow-done)' : 'url(#ag-arrow-idle)'}
                            />
                            {edge.label && (
                                <text
                                    x={CX + 6} y={(y1 + y2) / 2 - 2}
                                    fontSize="7" fill={done ? '#22c55e80' : '#1e293b'}
                                    fontFamily="ui-monospace, monospace"
                                    textAnchor="start"
                                    style={{ userSelect: 'none' }}
                                >
                                    {edge.label}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* ── NODES ── */}
                {GRAPH_NODES.map((node, i) => {
                    const cy = nodeY(i);
                    const act = isActive(node.id);
                    const done = isDone(node.id);
                    const sel = isSelected(node.id);
                    const acc = nodeColor(node);

                    if (isSentinel(node.id)) {
                        // Render as a small filled circle with label
                        return (
                            <g key={node.id}>
                                <circle cx={CX} cy={cy} r={SENT_R}
                                    fill={done ? '#14532d' : '#0f172a'}
                                    stroke={done ? '#22c55e' : '#334155'}
                                    strokeWidth="1.5"
                                />
                                <text x={CX} y={cy + 4} textAnchor="middle"
                                    fontSize="7.5" fontWeight="800"
                                    fill={done ? '#22c55e' : '#475569'}
                                    fontFamily="ui-monospace, monospace"
                                    style={{ userSelect: 'none', letterSpacing: '0.1em' }}
                                >
                                    {node.label}
                                </text>
                            </g>
                        );
                    }

                    // Real agent node → rounded rect
                    const rx = CX - NODE_W / 2;
                    const ry = cy - NODE_H / 2;

                    return (
                        <g
                            key={node.id}
                            onClick={() => onSelect(node.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Glow backdrop for active */}
                            {act && (
                                <rect x={rx - 4} y={ry - 4} width={NODE_W + 8} height={NODE_H + 8}
                                    rx="10" fill={`${acc}18`}
                                    stroke={acc} strokeWidth="1" strokeOpacity="0.3"
                                    style={{ filter: 'blur(4px)' }}
                                />
                            )}

                            {/* Selection outline */}
                            {sel && !act && (
                                <rect x={rx - 3} y={ry - 3} width={NODE_W + 6} height={NODE_H + 6}
                                    rx="9" fill="none"
                                    stroke={acc} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5"
                                />
                            )}

                            {/* Main rect */}
                            <rect
                                x={rx} y={ry} width={NODE_W} height={NODE_H}
                                rx="7"
                                fill={act ? `${acc}18` : done ? `${acc}0e` : '#0f172a'}
                                stroke={act ? acc : done ? acc : sel ? '#334155' : '#1e293b'}
                                strokeWidth={act || done ? 1.8 : 1}
                                style={{
                                    filter: act ? `drop-shadow(0 0 6px ${acc}60)` : 'none',
                                    transition: 'all 0.4s ease',
                                }}
                            />

                            {/* Left accent bar */}
                            <rect
                                x={rx} y={ry + 6} width={3} height={NODE_H - 12}
                                rx="1.5"
                                fill={act ? acc : done ? acc : '#1e293b'}
                                opacity={act || done ? 0.9 : 0.4}
                            />

                            {/* Status indicator (right side) */}
                            {done ? (
                                <text x={rx + NODE_W - 12} y={cy + 5} textAnchor="middle"
                                    fontSize="11" fill="#22c55e" style={{ userSelect: 'none' }}>
                                    ✓
                                </text>
                            ) : act ? (
                                /* Pulsing dot */
                                <circle cx={rx + NODE_W - 12} cy={cy} r="4"
                                    fill={acc} opacity="0.9">
                                    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.2s" repeatCount="indefinite" />
                                    <animate attributeName="r" values="4;6;4" dur="1.2s" repeatCount="indefinite" />
                                </circle>
                            ) : (
                                <circle cx={rx + NODE_W - 12} cy={cy} r="3"
                                    fill="#1e293b" stroke="#2d3f55" strokeWidth="1" />
                            )}

                            {/* Node label */}
                            <text
                                x={rx + 14} y={cy - 4}
                                fontSize="10" fontWeight="700"
                                fontFamily="ui-sans-serif, system-ui, sans-serif"
                                fill={act ? acc : done ? `${acc}dd` : '#94a3b8'}
                                style={{ userSelect: 'none', transition: 'fill 0.3s' }}
                            >
                                {node.label}
                            </text>

                            {/* Sub-label */}
                            <text
                                x={rx + 14} y={cy + 10}
                                fontSize="7.5"
                                fontFamily="ui-monospace, monospace"
                                fill={act ? `${acc}99` : done ? `${acc}66` : '#334155'}
                                style={{ userSelect: 'none' }}
                            >
                                {node.sublabel}
                            </text>

                            {/* Note badge (for improver / merger / researcher) */}
                            {'note' in node && node.note && (
                                <text
                                    x={rx + NODE_W - 16} y={ry - 5}
                                    fontSize="6.5"
                                    fontFamily="ui-monospace, monospace"
                                    fill={acc}
                                    textAnchor="end"
                                    opacity="0.55"
                                    style={{ userSelect: 'none' }}
                                >
                                    ⚙ conditional
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
