import React from 'react';
import { motion } from 'framer-motion';

interface CodingCanvasProps {
    code: string;
    fileName?: string;
    language?: string;
    highlightLines?: number[]; // 1-based index
    theme?: 'dark' | 'light';
    fontSize?: number;
}

const KEYWORDS = [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break',
    'import', 'export', 'default', 'from', 'class', 'extends', 'implements', 'interface', 'type', 'async', 'await',
    'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'void', 'null', 'undefined', 'true', 'false'
];

const SIMPLE_TOKENIZER = (code: string) => {
    // Very basic tokenizer for visual flair
    // Splits by space, but keeps delimiters. ideally we'd use a real library.
    // This is just a visual approximation for "Coding Mode".
    return code;
};

// Helper to wrap keywords in spans
const highlightSyntax = (line: string) => {
    const parts = line.split(/(\s+|[(){}[\]=.,;])/);
    return parts.map((part, i) => {
        if (KEYWORDS.includes(part)) {
            return <span key={i} style={{ color: '#C678DD', fontWeight: 'bold' }}>{part}</span>; // Purple
        } else if (part.startsWith('"') || part.startsWith("'") || part.startsWith('`')) {
            return <span key={i} style={{ color: '#98C379' }}>{part}</span>; // Green
        } else if (part.match(/^\d+$/)) {
            return <span key={i} style={{ color: '#D19A66' }}>{part}</span>; // Orange
        } else if (part.startsWith('//')) {
            return <span key={i} style={{ color: '#5C6370', fontStyle: 'italic' }}>{part}</span>; // Grey comment
        } else if (['{', '}', '(', ')', '[', ']', ';'].includes(part)) {
            return <span key={i} style={{ color: '#ABB2BF' }}>{part}</span>; // White-ish
        } else if (['func', 'console'].some(k => part.includes(k))) {
            return <span key={i} style={{ color: '#61AFEF' }}>{part}</span>; // Blue
        }
        return <span key={i} style={{ color: '#ABB2BF' }}>{part}</span>;
    });
};

export const CodingCanvas: React.FC<CodingCanvasProps> = ({
    code,
    fileName = 'algorithm.ts',
    language = 'typescript',
    highlightLines = [],
    theme = 'dark',
    fontSize = 14
}) => {
    const safeCode = typeof code === 'string' ? code : String(code || '');
    const lines = safeCode.split('\n');

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1E1E1E', // VS Code Dark Bg
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace"
        }}>
            {/* Title Bar (macOS Style) */}
            <div style={{
                height: '32px',
                backgroundColor: '#252526',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                borderBottom: '1px solid #111'
            }}>
                {/* Traffic Lights */}
                <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF5F56' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FFBD2E' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27C93F' }}></div>
                </div>
                {/* Filename */}
                <div style={{
                    color: '#CCCCCC',
                    fontSize: '13px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    opacity: 0.8
                }}>
                    {fileName}
                </div>
            </div>

            {/* Editor Area */}
            <div style={{
                flex: 1,
                padding: '20px 0',
                overflowY: 'auto',
                position: 'relative',
                backgroundColor: '#282C34' // One Dark Bg
            }}>
                {lines.map((line, index) => {
                    const lineNum = index + 1;
                    const isHighlighted = highlightLines.includes(lineNum);

                    return (
                        <div key={index} style={{
                            display: 'flex',
                            lineHeight: '1.5',
                            fontSize: `${fontSize}px`,
                            backgroundColor: isHighlighted ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                            transition: 'background-color 0.3s ease'
                        }}>
                            {/* Line Number */}
                            <div style={{
                                width: '50px',
                                textAlign: 'right',
                                paddingRight: '15px',
                                color: isHighlighted ? '#E5E5E5' : '#495162',
                                userSelect: 'none',
                                fontSize: `${fontSize * 0.9}px`,
                                paddingTop: '2px'
                            }}>
                                {lineNum}
                            </div>

                            {/* Code Line */}
                            <div style={{
                                flex: 1,
                                paddingRight: '20px',
                                whiteSpace: 'pre',
                                color: '#ABB2BF', // Default text color
                                opacity: (highlightLines.length > 0 && !isHighlighted) ? 0.4 : 1, // Dim non-active lines
                                transition: 'opacity 0.3s'
                            }}>
                                {highlightSyntax(line)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Status Bar */}
            <div style={{
                height: '22px',
                backgroundColor: '#21252B',
                color: '#9Da5b4',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px'
            }}>
                <span style={{ marginRight: '15px' }}>master*</span>
                <span style={{ marginRight: '15px' }}>{language}</span>
                <span style={{ marginLeft: 'auto' }}>Ln {highlightLines[0] || 1}, Col 1</span>
                <span style={{ marginLeft: '15px' }}>UTF-8</span>
            </div>
        </div>
    );
};
