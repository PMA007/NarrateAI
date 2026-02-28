import React from 'react';
import { nanobannaTheme } from '@/components/themes/nanobanna';

export const NanoBannaTemplate: React.FC<{ localTime?: number, children?: React.ReactNode }> = ({ children }) => {
    const theme = nanobannaTheme;
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.background,
            zIndex: -1,
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `linear-gradient(${theme.colors.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.grid} 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                opacity: 0.5,
                zIndex: 0
            }} />

            {/* Render Slide Content */}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                {children}
            </div>
        </div>
    );
};
