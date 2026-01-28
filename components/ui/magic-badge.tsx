"use client";

import { cn } from '@/lib/utils';

interface MagicBadgeProps {
    title: string;
    className?: string;
}

export function MagicBadge({ title, className }: MagicBadgeProps) {
    return (
        <div className={cn(
            "relative inline-flex h-8 overflow-hidden rounded-full p-[1.5px] focus:outline-none select-none",
            className
        )}>
            <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#7c3aed_0%,#c4b5fd_50%,#7c3aed_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white px-4 py-1 text-sm font-medium text-purple-700 backdrop-blur-3xl">
                {title}
            </span>
        </div>
    );
}
