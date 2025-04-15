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

// SVG logo for Papa-Hi
const PapaHiLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#4F6F52" />
    <path d="M8 10H12V22H8V10Z" fill="white" />
    <path d="M14 10H18C20.2091 10 22 11.7909 22 14C22 16.2091 20.2091 18 18 18H14V10Z" fill="white" />
    <path d="M14 14H18V18H14V14Z" fill="#4F6F52" />
    <path d="M8 16H12V20H8V16Z" fill="#4F6F52" />
    <path d="M20 18H24V22H20V18Z" fill="white" />
  </svg>
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
    <header className="bg-primary text-white py-3 px-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <PapaHiLogo />
          <h1 className="text-xl font-heading font-bold ml-2">Papa-Hi</h1>
        </div>
        
        {/* Mobile Navigation Toggle */}
        <button 
          className="md:hidden text-white focus:outline-none" 
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <i className="fas fa-bars text-xl"></i>
        </button>
        
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
              {t('nav.restaurants', 'Restaurants')}
            </a>
          </Link>
          <Link href="/places?type=playground">
            <a className={`font-medium hover:text-accent transition ${location.includes('/places') && location.includes('type=playground') ? 'text-accent' : ''}`}>
              {t('nav.playgrounds', 'Speeltuinen')}
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
              <a className="py-2 px-4 hover:bg-primary/80 rounded-md">{t('nav.restaurants', 'Restaurants')}</a>
            </Link>
            <Link href="/places?type=playground">
              <a className="py-2 px-4 hover:bg-primary/80 rounded-md">{t('nav.playgrounds', 'Speeltuinen')}</a>
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
