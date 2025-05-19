import { VariantProps } from "class-variance-authority";

// Animation utility for buttons
export function applyButtonAnimation(event: React.MouseEvent<HTMLButtonElement>) {
  const button = event.currentTarget;
  
  // Add ripple effect
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  
  // Position relative to click
  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add("ripple");
  
  // Remove any existing ripples
  const ripple = button.getElementsByClassName("ripple")[0];
  if (ripple) {
    ripple.remove();
  }
  
  // Add the ripple to the button
  button.appendChild(circle);
  
  // Clean up animation after it completes
  setTimeout(() => {
    if (circle) {
      circle.remove();
    }
  }, 600); // Match with CSS animation duration
}

// Types of success animations
export type SuccessAnimationType = 'bounce' | 'shake' | 'pulse' | 'flip';

// Apply success animation to a form or element
export function applySuccessAnimation(
  element: HTMLElement, 
  type: SuccessAnimationType = 'pulse'
) {
  // Add the animation class
  element.classList.add(`success-animation-${type}`);
  
  // Remove the animation class after it completes
  setTimeout(() => {
    element.classList.remove(`success-animation-${type}`);
  }, 1000);
}

// Validate form with a visual shake animation if invalid
export function validateFormWithAnimation(
  form: HTMLFormElement,
  isValid: boolean
): boolean {
  if (!isValid) {
    // Apply the shake animation to invalid fields
    const invalidFields = form.querySelectorAll(':invalid');
    invalidFields.forEach(field => {
      field.classList.add('invalid-shake');
      setTimeout(() => {
        field.classList.remove('invalid-shake');
      }, 500);
    });
    return false;
  }
  return true;
}