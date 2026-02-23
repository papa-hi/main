import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AppConfig {
  weatherApiKey: string | null;
  vapidPublicKey: string | null;
  isLoading: boolean;
}

const AppConfigContext = createContext<AppConfig>({
  weatherApiKey: null,
  vapidPublicKey: null,
  isLoading: true,
});

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>({
    weatherApiKey: null,
    vapidPublicKey: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : Promise.reject("config fetch failed")))
      .then((data) => {
        if (!cancelled) {
          setConfig({
            weatherApiKey: data.weatherApiKey ?? null,
            vapidPublicKey: data.vapidPublicKey ?? null,
            isLoading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfig((prev) => ({ ...prev, isLoading: false }));
        }
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}
