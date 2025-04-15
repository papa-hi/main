import React from 'react';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedLoaderProps {
  character?: 'blocks' | 'ball' | 'kite' | 'robot';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function AnimatedLoader({
  character = 'blocks',
  size = 'md', 
  text,
  className
}: AnimatedLoaderProps) {
  const sizes = {
    sm: { container: 'h-20', character: 'h-14 w-14' },
    md: { container: 'h-32', character: 'h-20 w-20' },
    lg: { container: 'h-48', character: 'h-32 w-32' }
  };

  // Character-specific colors
  const colors = {
    blocks: ['#4F46E5', '#EC4899', '#10B981', '#F59E0B'],
    ball: ['#3B82F6', '#F97316'],
    kite: ['#8B5CF6', '#EC4899', '#6EE7B7'],
    robot: ['#6366F1', '#A855F7', '#10B981']
  };

  // Shared animation for bounce effect
  const bounceAnimation = {
    y: [0, -15, 0],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Character-specific animations
  const renderCharacter = () => {
    switch (character) {
      case 'blocks':
        return (
          <div className="flex items-center space-x-2">
            {colors.blocks.map((color, i) => (
              <motion.div
                key={i}
                initial={{ y: 0 }}
                animate={{
                  y: [0, -20, 0],
                  transition: {
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.1
                  }
                }}
                className={cn(
                  "rounded-lg",
                  size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        );

      case 'ball':
        return (
          <div className="relative">
            <motion.div
              animate={{
                x: [-30, 30, -30],
                rotate: [0, 360],
                transition: { 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className={cn(
                "rounded-full relative z-10",
                size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'
              )}
              style={{ 
                background: `linear-gradient(135deg, ${colors.ball[0]}, ${colors.ball[1]})`,
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
              }}
            />
            <motion.div
              animate={{
                scaleX: [1, 0.5, 1],
                opacity: [0.3, 0.5, 0.3],
                transition: { 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className={cn(
                "rounded-full bg-gray-300 absolute bottom-0 left-1/2 -translate-x-1/2",
                size === 'sm' ? 'w-6 h-1' : size === 'md' ? 'w-10 h-2' : 'w-14 h-3'
              )}
              style={{ 
                filter: "blur(2px)"
              }}
            />
          </div>
        );

      case 'kite':
        return (
          <div className="relative">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                y: [0, -10, 0],
                transition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="relative"
            >
              <svg 
                viewBox="0 0 100 100" 
                className={cn(
                  size === 'sm' ? 'w-12 h-12' : size === 'md' ? 'w-16 h-16' : 'w-24 h-24'
                )}
              >
                <motion.path
                  d="M50 10 L80 50 L50 90 L20 50 Z"
                  fill={colors.kite[0]}
                  stroke={colors.kite[1]}
                  strokeWidth="2"
                  animate={{
                    fill: [colors.kite[0], colors.kite[2], colors.kite[0]],
                    transition: { duration: 3, repeat: Infinity }
                  }}
                />
                <motion.line
                  x1="50" y1="90"
                  x2="50" y2="120"
                  stroke="#6B7280"
                  strokeWidth="2"
                  animate={{
                    x2: [50, 55, 45, 50],
                    transition: { duration: 2, repeat: Infinity }
                  }}
                />
                <motion.line
                  x1="50" y1="120"
                  x2="40" y2="130"
                  stroke="#6B7280"
                  strokeWidth="2"
                  animate={{
                    x2: [40, 35, 45, 40],
                    y2: [130, 135, 125, 130],
                    transition: { duration: 2, repeat: Infinity }
                  }}
                />
                <motion.line
                  x1="50" y1="120"
                  x2="60" y2="130"
                  stroke="#6B7280"
                  strokeWidth="2"
                  animate={{
                    x2: [60, 65, 55, 60],
                    y2: [130, 125, 135, 130],
                    transition: { duration: 2, repeat: Infinity }
                  }}
                />
              </svg>
            </motion.div>
          </div>
        );

      case 'robot':
        return (
          <div className="relative">
            <motion.div
              animate={{
                ...bounceAnimation,
                rotate: [0, -5, 5, 0],
              }}
              className="relative"
            >
              <svg 
                viewBox="0 0 120 160" 
                className={cn(
                  size === 'sm' ? 'w-12 h-12' : size === 'md' ? 'w-20 h-20' : 'w-28 h-28'
                )}
              >
                {/* Robot head */}
                <rect x="35" y="20" width="50" height="40" rx="10" fill={colors.robot[0]} />
                
                {/* Eyes */}
                <motion.circle 
                  cx="50" cy="40" r="5" 
                  fill="white"
                  animate={{
                    r: [5, 6, 5],
                    transition: { duration: 2, repeat: Infinity }
                  }}
                />
                <motion.circle 
                  cx="70" cy="40" r="5" 
                  fill="white"
                  animate={{
                    r: [5, 6, 5],
                    transition: { duration: 2, repeat: Infinity }
                  }}
                />
                
                {/* Mouth */}
                <motion.path 
                  d="M45 55 Q60 65 75 55" 
                  stroke="white" 
                  strokeWidth="2" 
                  fill="transparent"
                  animate={{
                    d: ["M45 55 Q60 65 75 55", "M45 55 Q60 60 75 55", "M45 55 Q60 65 75 55"],
                    transition: { duration: 3, repeat: Infinity }
                  }}
                />
                
                {/* Body */}
                <rect x="40" y="65" width="40" height="50" rx="5" fill={colors.robot[1]} />
                
                {/* Buttons */}
                <circle cx="60" cy="80" r="4" fill={colors.robot[2]} />
                <circle cx="60" cy="95" r="4" fill={colors.robot[2]} />
                
                {/* Arms */}
                <motion.rect 
                  x="15" y="70" width="20" height="8" rx="4" fill={colors.robot[0]}
                  animate={{
                    rotate: [0, 20, 0],
                    originX: 35,
                    originY: 74,
                    transition: { duration: 2, repeat: Infinity }
                  }}
                />
                <motion.rect 
                  x="85" y="70" width="20" height="8" rx="4" fill={colors.robot[0]}
                  animate={{
                    rotate: [0, -20, 0],
                    originX: 85,
                    originY: 74,
                    transition: { duration: 2, repeat: Infinity }
                  }}
                />
                
                {/* Legs */}
                <motion.rect 
                  x="45" y="120" width="10" height="25" rx="5" fill={colors.robot[0]}
                  animate={{
                    y: [120, 122, 120],
                    transition: { duration: 1, repeat: Infinity }
                  }}
                />
                <motion.rect 
                  x="65" y="120" width="10" height="25" rx="5" fill={colors.robot[0]}
                  animate={{
                    y: [120, 118, 120],
                    transition: { duration: 1, repeat: Infinity }
                  }}
                />
                
                {/* Antenna */}
                <motion.line 
                  x1="60" y1="20" x2="60" y2="10" 
                  stroke={colors.robot[0]} 
                  strokeWidth="2"
                  animate={{
                    x2: [60, 62, 58, 60],
                    y2: [10, 8, 12, 10],
                    transition: { duration: 1.5, repeat: Infinity }
                  }}
                />
                <motion.circle 
                  cx="60" cy="8" r="3" 
                  fill={colors.robot[2]}
                  animate={{
                    cx: [60, 62, 58, 60],
                    cy: [8, 6, 10, 8],
                    r: [3, 4, 3],
                    transition: { duration: 1.5, repeat: Infinity }
                  }}
                />
              </svg>
            </motion.div>
          </div>
        );

      default:
        return (
          <motion.div
            animate={bounceAnimation}
            className={cn(
              "rounded-full bg-primary",
              sizes[size].character
            )}
          />
        );
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4",
      sizes[size].container,
      className
    )}>
      {renderCharacter()}
      {text && (
        <p className={cn(
          "text-muted-foreground animate-pulse",
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
        )}>
          {text}
        </p>
      )}
    </div>
  );
}