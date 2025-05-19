import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useWeather } from "@/hooks/use-weather";

interface WelcomeSectionProps {
  userName: string;
}

export function WelcomeSection({ userName }: WelcomeSectionProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { t, i18n } = useTranslation();
  const { temperature, condition, icon, city, country, isLoading: weatherLoading, error: weatherError } = useWeather();

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    const currentLang = i18n.language;
    
    if (currentLang === 'nl') {
      if (hour < 12) return "Goedemorgen";
      if (hour < 18) return "Goedemiddag";
      return "Goedenavond";
    } else {
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    }
  };

  // Get weather icon based on condition and time
  const getWeatherIcon = () => {
    // If we have an icon code from the API, use it
    if (icon) {
      const iconMap: Record<string, string> = {
        '01d': 'fa-sun', // clear sky day
        '01n': 'fa-moon', // clear sky night
        '02d': 'fa-cloud-sun', // few clouds day
        '02n': 'fa-cloud-moon', // few clouds night
        '03d': 'fa-cloud', // scattered clouds
        '03n': 'fa-cloud',
        '04d': 'fa-cloud', // broken clouds
        '04n': 'fa-cloud',
        '09d': 'fa-cloud-showers-heavy', // shower rain
        '09n': 'fa-cloud-showers-heavy',
        '10d': 'fa-cloud-rain', // rain day
        '10n': 'fa-cloud-rain', // rain night
        '11d': 'fa-bolt', // thunderstorm
        '11n': 'fa-bolt',
        '13d': 'fa-snowflake', // snow
        '13n': 'fa-snowflake',
        '50d': 'fa-smog', // mist
        '50n': 'fa-smog'
      };
      
      return iconMap[icon] || 'fa-cloud';
    }
    
    // Fallback based on text condition
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('clear')) return 'fa-sun';
    if (conditionLower.includes('cloud')) return 'fa-cloud';
    if (conditionLower.includes('rain') || conditionLower.includes('shower')) return 'fa-cloud-rain';
    if (conditionLower.includes('snow')) return 'fa-snowflake';
    if (conditionLower.includes('thunder')) return 'fa-bolt';
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return 'fa-smog';
    
    // Default
    return 'fa-cloud';
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold mb-1">
            {getGreeting()}, {userName}!
          </h2>
          <p className="text-sm text-secondary">{t('home.readyToday', 'Ready to plan a fun day?')}</p>
        </div>
        
        {/* Weather Widget */}
        {!weatherLoading && !weatherError && city && (
          <div className="bg-white rounded-lg p-3 shadow-sm flex items-center space-x-3 hover:shadow-md transition-all duration-300 transform hover:scale-105 cursor-pointer group">
            <i className={`fas ${getWeatherIcon()} text-accent text-lg group-hover:animate-weather`}></i>
            <div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors duration-300">{temperature}°C</span>
              <p className="text-xs text-muted-foreground">{city}{country ? `, ${country}` : ''}</p>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {weatherLoading && (
          <div className="bg-white rounded-lg p-3 shadow-sm flex items-center space-x-3 animate-pulse">
            <div className="w-5 h-5 rounded-full bg-accent/30"></div>
            <div className="space-y-1">
              <div className="h-3 w-10 bg-muted rounded"></div>
              <div className="h-2 w-16 bg-muted/70 rounded"></div>
            </div>
          </div>
        )}
        
        {/* Fallback state when both loading is false and there's an error/no city data */}
        {!weatherLoading && (weatherError || !city) && (
          <div className="bg-white rounded-lg p-3 shadow-sm flex items-center space-x-3">
            <i className="fas fa-sun text-accent text-lg"></i>
            <div>
              <span className="text-sm font-medium">18°C</span>
              <p className="text-xs text-muted-foreground">Amsterdam, NL</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Featured Section - Promoted Community Events */}
      <div className="relative rounded-xl overflow-hidden mb-6">
        <img 
          src="https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80" 
          alt={t('home.featuredAltText', 'Dad and child at playground')} 
          className="w-full h-52 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/80 to-transparent flex flex-col justify-end p-6">
          <span className="text-white text-xs font-medium bg-accent py-1 px-3 rounded-full inline-block mb-2 w-fit">
            {t('home.featured', 'Featured')}
          </span>
          <h3 className="text-white text-xl font-heading font-bold">
            {t('home.featuredTitle', 'Dads Weekend in the Park')}
          </h3>
          <p className="text-white text-sm mb-3">
            {t('home.featuredDate', 'Sunday, July 7 • Vondelpark • 10:00')}
          </p>
          <button className="bg-white text-primary hover:bg-accent hover:text-white transition py-2 px-4 rounded-lg font-medium text-sm w-fit">
            {t('common.moreInfo', 'More Info')}
          </button>
        </div>
      </div>
    </section>
  );
}

export default WelcomeSection;
