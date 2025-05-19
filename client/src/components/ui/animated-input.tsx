import * as React from "react";
import { Input, InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AnimatedInputProps extends InputProps {
  animateOnFocus?: boolean;
  successIcon?: boolean;
  highlightColor?: string;
  animationStyle?: "scale" | "glow" | "border" | "bounce";
}

export function AnimatedInput({
  className,
  animateOnFocus = true,
  successIcon = false,
  highlightColor = "rgba(var(--primary), 0.3)",
  animationStyle = "scale",
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isValid, setIsValid] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (props.value && typeof props.value === 'string' && props.value.length > 0) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [props.value]);
  
  // Apply custom highlight color
  React.useEffect(() => {
    if (inputRef.current && animateOnFocus) {
      inputRef.current.style.setProperty('--highlight-color', highlightColor);
    }
  }, [highlightColor, animateOnFocus]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  return (
    <div className={cn(
      "relative",
      successIcon && isValid && !isFocused && "form-success"
    )}>
      <Input
        ref={inputRef}
        className={cn(
          animateOnFocus && "input-focus-animation",
          animateOnFocus && animationStyle === "scale" && "input-focus-scale",
          animateOnFocus && animationStyle === "glow" && "input-focus-glow",
          animateOnFocus && animationStyle === "border" && "input-focus-border",
          animateOnFocus && animationStyle === "bounce" && "input-focus-bounce",
          isFocused && "shadow-input-focus",
          className
        )}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </div>
  );
}