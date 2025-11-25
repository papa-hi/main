import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

export function MobileFooter() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  const navItemClass = (isActive: boolean) => 
    `flex flex-col items-center justify-center py-1.5 px-1 min-w-0 flex-1 rounded-lg transition-colors ${
      isActive ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'
    }`;

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40 safe-area-inset-bottom">
      <nav className="flex items-stretch w-full px-0.5 py-1.5 overflow-hidden">
        <Link href="/" className={navItemClass(location === '/')}>
          <i className={`fas fa-home text-lg ${location === '/' ? 'text-primary' : ''}`}></i>
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('navigation.home', 'Home')}</span>
        </Link>
        
        <Link href="/playdates" className={navItemClass(location === '/playdates')}>
          <i className={`fas fa-calendar-alt text-lg ${location === '/playdates' ? 'text-primary' : ''}`}></i>
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('navigation.playdates', 'Playdates')}</span>
        </Link>
        
        <Link href="/places" className={navItemClass(location.includes('/places'))}>
          <i className={`fas fa-map-marker-alt text-lg ${location.includes('/places') ? 'text-primary' : ''}`}></i>
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('navigation.places', 'Places')}</span>
        </Link>
        
        <Link href="/discover" className={navItemClass(location === '/discover')}>
          <i className={`fas fa-users text-lg ${location === '/discover' ? 'text-primary' : ''}`}></i>
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('navigation.discover', 'Discover')}</span>
        </Link>
        
        <Link href="/community" className={navItemClass(location === '/community')}>
          <i className={`fas fa-comment-dots text-lg ${location === '/community' ? 'text-primary' : ''}`}></i>
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('nav.community', 'Community')}</span>
        </Link>
        
        <Link href="/chat" className={navItemClass(location.includes('/chat'))}>
          <i className={`fas fa-comments text-lg ${location.includes('/chat') ? 'text-primary' : ''}`}></i>
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('navigation.chat', 'Messages')}</span>
        </Link>
        
        {user?.role === 'admin' && (
          <Link href="/admin" className={navItemClass(location.includes('/admin'))}>
            <i className={`fas fa-user-shield text-lg ${location.includes('/admin') ? 'text-primary' : ''}`}></i>
            <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">Admin</span>
          </Link>
        )}
      </nav>
    </footer>
  );
}

export default MobileFooter;
