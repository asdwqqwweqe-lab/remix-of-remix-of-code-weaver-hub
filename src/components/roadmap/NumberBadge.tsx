import React from 'react';
import { cn } from '@/lib/utils';

type BadgeShape = 'circle' | 'square' | 'hexagon' | 'diamond';

interface NumberBadgeProps {
  number: number;
  shape: BadgeShape;
  colorClass: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Pre-defined color palettes for different levels
export const roadmapColors = {
  // Main roadmap colors
  roadmap: [
    'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/30',
    'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-blue-500/30',
    'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30',
    'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-500/30',
    'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/30',
    'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-500/30',
    'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-fuchsia-500/30',
    'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/30',
  ],
  // Section colors
  section: [
    'bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-sky-400/30',
    'bg-gradient-to-br from-lime-400 to-green-500 text-white shadow-lime-400/30',
    'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-400/30',
    'bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-pink-400/30',
    'bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-indigo-400/30',
    'bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-teal-400/30',
    'bg-gradient-to-br from-fuchsia-400 to-pink-500 text-white shadow-fuchsia-400/30',
    'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-400/30',
  ],
  // Topic colors
  topic: [
    'bg-gradient-to-br from-blue-300 to-sky-400 text-blue-900 shadow-blue-300/30',
    'bg-gradient-to-br from-green-300 to-emerald-400 text-green-900 shadow-green-300/30',
    'bg-gradient-to-br from-yellow-300 to-amber-400 text-yellow-900 shadow-yellow-300/30',
    'bg-gradient-to-br from-pink-300 to-rose-400 text-pink-900 shadow-pink-300/30',
    'bg-gradient-to-br from-purple-300 to-violet-400 text-purple-900 shadow-purple-300/30',
    'bg-gradient-to-br from-cyan-300 to-teal-400 text-cyan-900 shadow-cyan-300/30',
    'bg-gradient-to-br from-orange-300 to-amber-400 text-orange-900 shadow-orange-300/30',
    'bg-gradient-to-br from-indigo-300 to-blue-400 text-indigo-900 shadow-indigo-300/30',
  ],
  // Sub-topic colors
  subTopic: [
    'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 shadow-slate-200/30',
    'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 shadow-gray-200/30',
    'bg-gradient-to-br from-zinc-200 to-zinc-300 text-zinc-700 shadow-zinc-200/30',
    'bg-gradient-to-br from-stone-200 to-stone-300 text-stone-700 shadow-stone-200/30',
  ],
};

export function getColorByIndex(level: 'roadmap' | 'section' | 'topic' | 'subTopic', index: number): string {
  const colors = roadmapColors[level];
  return colors[index % colors.length];
}

const sizeClasses = {
  sm: 'w-5 h-5 text-[10px]',
  md: 'w-7 h-7 text-xs',
  lg: 'w-9 h-9 text-sm',
};

export const NumberBadge: React.FC<NumberBadgeProps> = ({
  number,
  shape,
  colorClass,
  size = 'md',
  className,
}) => {
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-md',
    hexagon: 'clip-hexagon',
    diamond: 'rotate-45',
  };

  const content = (
    <span className={shape === 'diamond' ? '-rotate-45 block' : ''}>
      {number}
    </span>
  );

  return (
    <div
      className={cn(
        'flex items-center justify-center font-bold shadow-lg',
        sizeClasses[size],
        shapeClasses[shape],
        colorClass,
        className
      )}
      style={{
        clipPath: shape === 'hexagon' 
          ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          : undefined,
      }}
    >
      {content}
    </div>
  );
};

// Tree connector line component
export const TreeConnector: React.FC<{
  isLast?: boolean;
  hasChildren?: boolean;
  level: number;
}> = ({ isLast = false, hasChildren = false, level }) => {
  const levelColors = [
    'border-violet-400',
    'border-sky-400',
    'border-emerald-400',
    'border-amber-400',
  ];
  
  const colorClass = levelColors[Math.min(level, levelColors.length - 1)];
  
  return (
    <div className="flex items-center h-full">
      <div 
        className={cn(
          'w-4 border-r-2 border-dashed h-full',
          colorClass
        )} 
      />
      <div 
        className={cn(
          'w-3 border-t-2 border-dashed',
          colorClass
        )}
      />
    </div>
  );
};

export default NumberBadge;
