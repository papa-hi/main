import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

export function MobileFooter() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const isAuthenticated = !!user;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <footer className="md:hidden fixed bottom-0 w-full bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
      <nav className="flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center py-3 px-2 ${location === '/' ? 'text-primary' : 'text-dark/60'}`}>
            <i className="fas fa-home text-lg"></i>
            <span className="text-xs mt-1">{t('navigation.home', 'Home')}</span>
          </a>
        </Link>
        
        <Link href="/playdates">
          <a className={`flex flex-col items-center py-3 px-2 ${location === '/playdates' ? 'text-primary' : 'text-dark/60'}`}>
            <i className="fas fa-calendar-alt text-lg"></i>
            <span className="text-xs mt-1">{t('navigation.playdates', 'Playdates')}</span>
          </a>
        </Link>
        
        <Link href="/create">
          <a className="flex flex-col items-center py-3 px-2 text-dark/60">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center -mt-6">
              <i className="fas fa-plus text-white text-lg"></i>
            </div>
            <span className="text-xs mt-1">{t('navigation.new', 'New')}</span>
          </a>
        </Link>
        
        <Link href="/places">
          <a className={`flex flex-col items-center py-3 px-2 ${location.includes('/places') ? 'text-primary' : 'text-dark/60'}`}>
            <i className="fas fa-map-marker-alt text-lg"></i>
            <span className="text-xs mt-1">{t('navigation.places', 'Places')}</span>
          </a>
        </Link>
        
        <Link href="/playground-map">
          <a className={`flex flex-col items-center py-3 px-2 ${location === '/playground-map' ? 'text-primary' : 'text-dark/60'}`}>
            <i className="fas fa-map-marked-alt text-lg"></i>
            <span className="text-xs mt-1">{t('navigation.playground_map', 'Map')}</span>
          </a>
        </Link>
        
        <Link href="/discover">
          <a className={`flex flex-col items-center py-3 px-2 ${location === '/discover' ? 'text-primary' : 'text-dark/60'}`}>
            <i className="fas fa-users text-lg"></i>
            <span className="text-xs mt-1">{t('navigation.discover', 'Discover')}</span>
          </a>
        </Link>
        
        <Link href="/chat">
          <a className={`flex flex-col items-center py-3 px-2 ${location.includes('/chat') ? 'text-primary' : 'text-dark/60'}`}>
            <i className="fas fa-comments text-lg"></i>
            <span className="text-xs mt-1">{t('navigation.chat', 'Messages')}</span>
          </a>
        </Link>
        
        {isAuthenticated ? (
          <>
            <Link href="/profile">
              <a className={`flex flex-col items-center py-3 px-2 ${location === '/profile' ? 'text-primary' : 'text-dark/60'}`}>
                <i className="fas fa-user text-lg"></i>
                <span className="text-xs mt-1">{t('navigation.profile', 'Profile')}</span>
              </a>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="flex flex-col items-center py-3 px-2 text-red-500"
            >
              <i className="fas fa-sign-out-alt text-lg"></i>
              <span className="text-xs mt-1">{t('auth.logoutButton', 'Logout')}</span>
            </button>
          </>
        ) : (
          <Link href="/auth">
            <a className={`flex flex-col items-center py-3 px-2 ${location === '/auth' ? 'text-primary' : 'text-dark/60'}`}>
              <i className="fas fa-sign-in-alt text-lg"></i>
              <span className="text-xs mt-1">{t('auth.loginButton', 'Login')}</span>
            </a>
          </Link>
        )}
      </nav>
    </footer>
  );
}

export default MobileFooter;
