import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export function MobileFooter() {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <footer className="md:hidden fixed bottom-0 w-full bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40">
      <nav className="flex justify-around items-center px-1 py-2">
        <Link href="/">
          <a className={`flex flex-col items-center py-2 px-3 rounded-lg ${location === '/' ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'}`}>
            <i className={`fas fa-home text-xl ${location === '/' ? 'text-primary' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">{t('navigation.home', 'Home')}</span>
          </a>
        </Link>
        
        <Link href="/playdates">
          <a className={`flex flex-col items-center py-2 px-3 rounded-lg ${location === '/playdates' ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'}`}>
            <i className={`fas fa-calendar-alt text-xl ${location === '/playdates' ? 'text-primary' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">{t('navigation.playdates', 'Playdates')}</span>
          </a>
        </Link>
        
        <Link href="/places">
          <a className={`flex flex-col items-center py-2 px-3 rounded-lg ${location.includes('/places') ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'}`}>
            <i className={`fas fa-map-marker-alt text-xl ${location.includes('/places') ? 'text-primary' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">{t('navigation.places', 'Places')}</span>
          </a>
        </Link>
        
        <Link href="/community">
          <a className={`flex flex-col items-center py-2 px-3 rounded-lg ${location === '/community' ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'}`}>
            <i className={`fas fa-users text-xl ${location === '/community' ? 'text-primary' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">{t('navigation.community', 'Community')}</span>
          </a>
        </Link>
        
        <Link href="/playground-map">
          <a className={`flex flex-col items-center py-2 px-3 rounded-lg ${location === '/playground-map' ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'}`}>
            <i className={`fas fa-map-marked-alt text-xl ${location === '/playground-map' ? 'text-primary' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">{t('navigation.playground_map', 'Map')}</span>
          </a>
        </Link>
        
        <Link href="/chat">
          <a className={`flex flex-col items-center py-2 px-3 rounded-lg ${location.includes('/chat') ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'}`}>
            <i className={`fas fa-comments text-xl ${location.includes('/chat') ? 'text-primary' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">{t('navigation.chat', 'Messages')}</span>
          </a>
        </Link>
      </nav>
    </footer>
  );
}

export default MobileFooter;
