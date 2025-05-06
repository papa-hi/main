import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import LanguageSwitcher from "../shared/language-switcher";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Logo for Papa-Hi
const PapaHiLogo = () => (
  <div className="flex items-center justify-center h-14 w-10 overflow-hidden rounded-[28px] bg-white">
    <img 
      src="/images/papa-hi.png" 
      alt="Papa-Hi Logo" 
      className="h-full w-full object-contain scale-150" 
    />
  </div>
);

interface HeaderProps {
  user: {
    firstName: string;
    profileImage: string;
  };
}

export function Header({ user }: HeaderProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { user: authUser, logoutMutation } = useAuth();
  const isAuthenticated = !!authUser;

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-primary text-white py-4 px-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <PapaHiLogo />
          <h1 className="text-2xl font-heading font-bold ml-3">Papa-Hi</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Mobile Language Selector */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <button className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-md flex items-center text-sm">
                  <span className="text-lg mr-1">
                    {i18n.language === 'nl' && '🇳🇱'}
                    {i18n.language === 'en' && '🇬🇧'}
                    {i18n.language === 'de' && '🇩🇪'}
                    {i18n.language === 'fr' && '🇫🇷'}
                    {i18n.language === 'es' && '🇪🇸'}
                  </span>
                  <i className="fas fa-chevron-down text-xs"></i>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[120px]">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => {
                    i18n.changeLanguage('nl');
                    localStorage.setItem('language', 'nl');
                  }}
                >
                  <span className="mr-2">🇳🇱</span> Nederlands
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => {
                    i18n.changeLanguage('en');
                    localStorage.setItem('language', 'en');
                  }}
                >
                  <span className="mr-2">🇬🇧</span> English
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => {
                    i18n.changeLanguage('de');
                    localStorage.setItem('language', 'de');
                  }}
                >
                  <span className="mr-2">🇩🇪</span> Deutsch
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => {
                    i18n.changeLanguage('fr');
                    localStorage.setItem('language', 'fr');
                  }}
                >
                  <span className="mr-2">🇫🇷</span> Français
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => {
                    i18n.changeLanguage('es');
                    localStorage.setItem('language', 'es');
                  }}
                >
                  <span className="mr-2">🇪🇸</span> Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Mobile Create Button (since we removed it from footer) */}
          {isAuthenticated && (
            <Link href="/create" className="md:hidden">
              <a className="bg-accent/90 hover:bg-accent text-white px-2 py-1 rounded-md flex items-center text-sm">
                <i className="fas fa-plus mr-1"></i>
                <span>{t('navigation.new', 'New')}</span>
              </a>
            </Link>
          )}
          
          {/* Mobile User Profile Section */}
          <div className="md:hidden flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link href="/profile">
                  <a className="text-white hover:text-accent">
                    <img 
                      src={user.profileImage} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
                    />
                  </a>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white px-2 py-1 rounded-md flex items-center text-sm"
                  aria-label="Logout"
                >
                  <i className="fas fa-sign-out-alt mr-1"></i>
                  <span>{t('auth.logoutButton', 'Logout')}</span>
                </button>
              </div>
            ) : (
              <Link href="/auth">
                <a className="bg-white/10 text-white hover:bg-white/20 px-2 py-1 rounded text-sm">
                  {t('auth.login', 'Login')}
                </a>
              </Link>
            )}
          </div>
          
          {/* Mobile Navigation Toggle */}
          <button 
            className="md:hidden text-white focus:outline-none" 
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-sm">
          <Link href="/">
            <a className={`font-medium hover:text-accent transition ${location === '/' ? 'text-accent' : ''}`}>
              {t('nav.home', 'Home')}
            </a>
          </Link>
          <Link href="/playdates">
            <a className={`font-medium hover:text-accent transition ${location === '/playdates' ? 'text-accent' : ''}`}>
              {t('nav.playdates', 'Speelafspraken')}
            </a>
          </Link>
          <Link href="/places">
            <a className={`font-medium hover:text-accent transition ${location.includes('/places') ? 'text-accent' : ''}`}>
              {t('nav.places', 'Places')}
            </a>
          </Link>
          <Link href="/playground-map">
            <a className={`font-medium hover:text-accent transition ${location === '/playground-map' ? 'text-accent' : ''}`}>
              {t('nav.playgroundMap', 'Speeltuin Kaart')}
            </a>
          </Link>
          <Link href="/chat">
            <a className={`font-medium hover:text-accent transition ${location === '/chat' ? 'text-accent' : ''}`}>
              {t('nav.chat', 'Berichten')}
            </a>
          </Link>
          <a href="#" className="font-medium hover:text-accent transition">
            {t('nav.community', 'Community')}
          </a>
        </nav>
        
        {/* User Menu - Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {isAuthenticated ? (
            <>
              <button className="text-white hover:text-accent" aria-label="Notifications">
                <i className="fas fa-bell"></i>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="flex items-center space-x-1">
                    <img 
                      src={user.profileImage} 
                      alt="Profile picture" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium">{user.firstName}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <span>{t('header.myProfile')}</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                    <span>{t('auth.logoutButton')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/auth">
              <a className="bg-white text-primary hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t('auth.login')}
              </a>
            </Link>
          )}
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-primary/95 absolute top-full left-0 right-0 p-4 shadow-lg z-50">
          <nav className="flex flex-col space-y-3 text-white">
            <Link href="/">
              <a className="py-2 px-4 hover:bg-primary/80 rounded-md">{t('nav.home', 'Home')}</a>
            </Link>
            <Link href="/playdates">
              <a className="py-2 px-4 hover:bg-primary/80 rounded-md">{t('nav.playdates', 'Speelafspraken')}</a>
            </Link>
            <Link href="/places">
              <a className="py-2 px-4 hover:bg-primary/80 rounded-md">{t('nav.places', 'Places')}</a>
            </Link>
            <Link href="/playground-map">
              <a className="py-2 px-4 hover:bg-primary/80 rounded-md">{t('nav.playgroundMap', 'Speeltuin Kaart')}</a>
            </Link>
            <Link href="/chat">
              <a className="py-2 px-4 hover:bg-primary/80 rounded-md">{t('nav.chat', 'Berichten')}</a>
            </Link>
            <a href="#" className="py-2 px-4 hover:bg-primary/80 rounded-md">{t('nav.community', 'Community')}</a>
            
            {isAuthenticated ? (
              <>
                <Link href="/profile">
                  <a className="py-2 px-4 hover:bg-primary/80 rounded-md">{t('header.myProfile', 'Mijn profiel')}</a>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="py-2 px-4 mt-2 bg-red-600/20 text-white hover:bg-red-600/30 rounded-md w-full text-left"
                >
                  {t('auth.logoutButton')}
                </button>
              </>
            ) : (
              <Link href="/auth">
                <a className="py-2 px-4 bg-white/10 hover:bg-white/20 rounded-md text-white font-medium">
                  {t('auth.login')}
                </a>
              </Link>
            )}
            
            <div className="flex items-center justify-between py-2 px-4 hover:bg-primary/80 rounded-md">
              <span>{t('header.language', 'Taal')}</span>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    i18n.changeLanguage('nl');
                    localStorage.setItem('language', 'nl');
                  }} 
                  className={`flex items-center px-2 py-1 rounded ${i18n.language === 'nl' ? 'bg-accent text-white' : 'bg-primary-foreground/10'}`}
                >
                  🇳🇱
                </button>
                <button 
                  onClick={() => {
                    i18n.changeLanguage('en');
                    localStorage.setItem('language', 'en');
                  }} 
                  className={`flex items-center px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-accent text-white' : 'bg-primary-foreground/10'}`}
                >
                  🇬🇧
                </button>
                <button 
                  onClick={() => {
                    i18n.changeLanguage('de');
                    localStorage.setItem('language', 'de');
                  }} 
                  className={`flex items-center px-2 py-1 rounded ${i18n.language === 'de' ? 'bg-accent text-white' : 'bg-primary-foreground/10'}`}
                >
                  🇩🇪
                </button>
                <button 
                  onClick={() => {
                    i18n.changeLanguage('fr');
                    localStorage.setItem('language', 'fr');
                  }} 
                  className={`flex items-center px-2 py-1 rounded ${i18n.language === 'fr' ? 'bg-accent text-white' : 'bg-primary-foreground/10'}`}
                >
                  🇫🇷
                </button>
                <button 
                  onClick={() => {
                    i18n.changeLanguage('es');
                    localStorage.setItem('language', 'es');
                  }} 
                  className={`flex items-center px-2 py-1 rounded ${i18n.language === 'es' ? 'bg-accent text-white' : 'bg-primary-foreground/10'}`}
                >
                  🇪🇸
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
