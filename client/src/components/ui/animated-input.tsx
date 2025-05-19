import * as React from "react";
import { Input, InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AnimatedInputProps extends InputProps {
  animateOnFocus?: boolean;
  successIcon?: boolean;
}

export function AnimatedInput({
  className,
  animateOnFocus = true,
  successIcon = false,
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