import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

export function MobileFooter() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

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
        
        
        <Link href="/discover">
          <a className={`flex flex-col items-center py-2 px-3 rounded-lg ${location === '/discover' ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'}`}>
            <i className={`fas fa-users text-xl ${location === '/discover' ? 'text-primary' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">{t('navigation.discover', 'Discover')}</span>
          </a>
        </Link>
        
        <Link href="/community">
          <a className={`flex flex-col items-center py-2 px-3 rounded-lg ${location === '/community' ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'}`}>
            <i className={`fas fa-comment-dots text-xl ${location === '/community' ? 'text-primary' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">{t('nav.community', 'Community')}</span>
          </a>
        </Link>
        
        <Link href="/chat">
          <a className={`flex flex-col items-center py-2 px-3 rounded-lg ${location.includes('/chat') ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'}`}>
            <i className={`fas fa-comments text-xl ${location.includes('/chat') ? 'text-primary' : ''}`}></i>
            <span className="text-xs mt-1 font-medium">{t('navigation.chat', 'Messages')}</span>
          </a>
        </Link>
        
        {user?.role === 'admin' && (
          <Link href="/admin">
            <a className={`flex flex-col items-center py-2 px-3 rounded-lg ${location.includes('/admin') ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'}`}>
              <i className={`fas fa-user-shield text-xl ${location.includes('/admin') ? 'text-primary' : ''}`}></i>
              <span className="text-xs mt-1 font-medium">Admin</span>
            </a>
          </Link>
        )}
      </nav>
    </footer>
  );
}

export default MobileFooter;
