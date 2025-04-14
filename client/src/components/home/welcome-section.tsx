import { useState, useEffect } from "react";
import { useLocation } from "@/hooks/use-location";

interface WelcomeSectionProps {
  userName: string;
}

export function WelcomeSection({ userName }: WelcomeSectionProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; city: string } | null>(null);
  const { location } = useLocation();

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch weather data if location is available
    if (location) {
      // This would be a real weather API call in production
      // For now, we'll just set mock data based on current time
      const mockTemp = 15 + Math.floor(Math.random() * 10);
      setWeather({
        temp: mockTemp,
        city: location.city || "Amsterdam"
      });
    }
  }, [location]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Goedemorgen";
    if (hour < 18) return "Goedemiddag";
    return "Goedenavond";
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold mb-1">
            {getGreeting()}, {userName}!
          </h2>
          <p className="text-sm text-secondary">Klaar om een leuke dag te plannen?</p>
        </div>
        
        {/* Weather Widget */}
        {weather && (
          <div className="bg-white rounded-lg p-2 shadow-sm flex items-center space-x-2">
            <i className="fas fa-sun text-accent"></i>
            <span className="text-sm font-medium">{weather.temp}°C | {weather.city}</span>
          </div>
        )}
      </div>
      
      {/* Featured Section - Promoted Community Events */}
      <div className="relative rounded-xl overflow-hidden mb-6">
        <img 
          src="https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80" 
          alt="Dad and child at playground" 
          className="w-full h-52 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/80 to-transparent flex flex-col justify-end p-6">
          <span className="text-white text-xs font-medium bg-accent py-1 px-3 rounded-full inline-block mb-2 w-fit">Uitgelicht</span>
          <h3 className="text-white text-xl font-heading font-bold">Vaders Weekend in het Park</h3>
          <p className="text-white text-sm mb-3">Zondag 7 juli • Vondelpark • 10:00</p>
          <button className="bg-white text-primary hover:bg-accent hover:text-white transition py-2 px-4 rounded-lg font-medium text-sm w-fit">Meer Info</button>
        </div>
      </div>
    </section>
  );
}

export default WelcomeSection;
