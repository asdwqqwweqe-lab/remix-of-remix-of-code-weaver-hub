import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TextImageProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gradient' | 'solid' | 'pattern';
}

const TextImage = ({ text, className, size = 'md', variant = 'gradient' }: TextImageProps) => {
  // Generate consistent color from text
  const colors = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 40) % 360;
    
    return {
      primary: `hsl(${hue1}, 70%, 45%)`,
      secondary: `hsl(${hue2}, 70%, 55%)`,
      accent: `hsl(${(hue1 + 180) % 360}, 60%, 50%)`
    };
  }, [text]);

  // Get first letter or first two letters
  const initials = useMemo(() => {
    const words = text.trim().split(/\s+/);
    if (words.length === 1) {
      return text.slice(0, 2).toUpperCase();
    }
    return (words[0][0] + (words[1]?.[0] || '')).toUpperCase();
  }, [text]);

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-20 h-20 text-xl',
    lg: 'w-32 h-32 text-3xl'
  };

  const getBackground = () => {
    switch (variant) {
      case 'solid':
        return { backgroundColor: colors.primary };
      case 'pattern':
        return {
          backgroundColor: colors.primary,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${colors.secondary}40 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, ${colors.accent}40 0%, transparent 50%)`
        };
      case 'gradient':
      default:
        return {
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
        };
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-sm",
        sizeClasses[size],
        className
      )}
      style={getBackground()}
    >
      {initials}
    </div>
  );
};

export default TextImage;
