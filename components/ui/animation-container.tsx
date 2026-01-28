"use client";

import { useRef, useEffect, useState } from 'react';

interface AnimationContainerProps {
    children: React.ReactNode;
    delay?: number;
    reverse?: boolean;
    className?: string;
}

export function AnimationContainer({ children, className, reverse, delay = 0 }: AnimationContainerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(true); // Start visible
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        // Only animate on desktop
        if (window.innerWidth < 768) return;

        const el = ref.current;
        if (!el) return;

        // Check if already in viewport
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            // Already visible, no animation
            return;
        }

        // Not in viewport, will animate
        setShouldAnimate(true);
        setIsVisible(false);

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={shouldAnimate ? {
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : `translateY(${reverse ? '-20px' : '20px'})`,
                transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
            } : undefined}
        >
            {children}
        </div>
    );
}
