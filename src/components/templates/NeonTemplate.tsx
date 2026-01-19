import React from 'react';
import { BackgroundPaths } from '@/components/ui/floating-paths';

export const NeonTemplate: React.FC<{ localTime?: number }> = ({ localTime = 0 }) => {
    return (
        <div className="absolute inset-0 w-full h-full -z-10 bg-slate-950">
            <BackgroundPaths localTime={localTime} title="" />
        </div>
    );
};
