"use client";

import React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function MovingBorder({
  children,
  duration = 2000,
  rx = "30%",
  ry = "30%",
  className,
  containerClassName,
  borderClassName,
  as: Component = "button",
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: React.ElementType;
  [key: string]: unknown;
}) {
  return (
    <Component
      className={cn(
        "bg-transparent relative text-xl p-[1px] overflow-hidden",
        containerClassName
      )}
      {...otherProps}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ padding: "2px" }}
      >
        <MovingBorderSVG duration={duration} rx={rx} ry={ry}>
          <rect
            fill="none"
            width="100%"
            height="100%"
            rx={rx}
            ry={ry}
            strokeWidth="2"
            className={cn("stroke-violet-400", borderClassName)}
          />
        </MovingBorderSVG>
      </div>

      <div
        className={cn(
          "relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 backdrop-blur-xl text-slate-900 dark:text-white flex items-center justify-center w-full h-full text-sm antialiased rounded-full",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
}

export function MovingBorderSVG({
  children,
  duration = 2000,
  rx,
  ry,
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
}) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).x
  );
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).y
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef as React.RefObject<SVGRectElement>}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        <div className="h-4 w-4 rounded-full bg-[radial-gradient(#a78bfa_40%,transparent_60%)]" />
      </motion.div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
      >
        {children}
      </svg>
    </>
  );
}

export function Button({
  children,
  className,
  borderRadius,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  borderRadius?: string;
  [key: string]: unknown;
}) {
  return (
    <MovingBorder
      containerClassName="rounded-full"
      className={cn(
        "px-6 py-3 font-semibold",
        className
      )}
      style={{ borderRadius: borderRadius || "9999px" }}
      {...props}
    >
      {children}
    </MovingBorder>
  );
}
