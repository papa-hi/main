import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends ButtonProps {
  animation?: "ripple" | "bounce" | "pulse" | "glow" | "none";
  successAnimation?: boolean;
  glowColor?: string;
}

export function AnimatedButton({
  children,
  className,
  animation = "ripple",
  successAnimation = false,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Add ripple effect
    if (animation === "ripple" && buttonRef.current) {
      const button = buttonRef.current;
      const circle = document.createElement("span");
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;
      
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
      circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
      circle.className = "ripple";
      
      const ripple = button.getElementsByClassName("ripple")[0];
      if (ripple) {
        ripple.remove();
      }
      
      button.appendChild(circle);
      
      // Run original onClick if provided
      if (onClick) {
        onClick(e);
      }
      
      // Add success animation if enabled
      if (successAnimation && buttonRef.current) {
        setTimeout(() => {
          if (buttonRef.current) {
            buttonRef.current.classList.add(`success-animation-${animation === "ripple" ? "pulse" : animation}`);
            
            setTimeout(() => {
              if (buttonRef.current) {
                buttonRef.current.classList.remove(`success-animation-${animation === "ripple" ? "pulse" : animation}`);
              }
            }, 800);
          }
        }, 300);
      }
      
      // Clean up ripple after animation completes
      setTimeout(() => {
        if (circle) {
          circle.remove();
        }
      }, 600);
    } else if (onClick) {
      // If no ripple, just run the original onClick
      onClick(e);
      
      // Still add success animation if enabled
      if (successAnimation && buttonRef.current) {
        buttonRef.current.classList.add(`success-animation-${animation}`);
        
        setTimeout(() => {
          if (buttonRef.current) {
            buttonRef.current.classList.remove(`success-animation-${animation}`);
          }
        }, 800);
      }
    }
  };
  
  return (
    <Button
      ref={buttonRef}
      className={cn(
        "button-animated relative overflow-hidden",
        animation === "bounce" && "hover:animate-bounce",
        animation === "pulse" && "hover:animate-pulse",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}