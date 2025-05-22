import { useState, useEffect } from "react";

const WELCOME_SHOWN_KEY = "papa-hi-welcome-shown";

export function useWelcome() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if welcome screen has been shown before
    const hasSeenWelcome = localStorage.getItem(WELCOME_SHOWN_KEY);
    
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const completeWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem(WELCOME_SHOWN_KEY, "true");
  };

  const resetWelcome = () => {
    localStorage.removeItem(WELCOME_SHOWN_KEY);
    setShowWelcome(true);
  };

  return {
    showWelcome,
    completeWelcome,
    resetWelcome,
  };
}