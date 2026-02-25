import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Home, Calendar, MapPin, Users, MessageCircle, MessageSquare, ShieldCheck } from "lucide-react";

export function MobileFooter() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/chats/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const totalUnread = unreadData?.count || 0;

  const navItemClass = (isActive: boolean) => 
    `flex flex-col items-center justify-center py-1.5 px-1 min-w-0 flex-1 rounded-lg transition-colors ${
      isActive ? 'bg-primary/10 text-primary font-medium' : 'text-dark/70 hover:bg-gray-100'
    }`;

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-[1000] safe-area-inset-bottom">
      <nav className="flex items-stretch w-full px-0.5 py-1.5 overflow-hidden">
        <Link href="/" className={navItemClass(location === '/')}>
          <Home className={`w-5 h-5 ${location === '/' ? 'text-primary' : ''}`} />
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('navigation.home', 'Home')}</span>
        </Link>
        
        <Link href="/playdates" className={navItemClass(location === '/playdates')}>
          <Calendar className={`w-5 h-5 ${location === '/playdates' ? 'text-primary' : ''}`} />
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('navigation.playdates', 'Playdates')}</span>
        </Link>
        
        <Link href="/places" className={navItemClass(location.includes('/places'))}>
          <MapPin className={`w-5 h-5 ${location.includes('/places') ? 'text-primary' : ''}`} />
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('navigation.places', 'Places')}</span>
        </Link>
        
        <Link href="/discover" className={navItemClass(location === '/discover')}>
          <Users className={`w-5 h-5 ${location === '/discover' ? 'text-primary' : ''}`} />
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('navigation.discover', 'Discover')}</span>
        </Link>
        
        <Link href="/community" className={navItemClass(location === '/community')}>
          <MessageSquare className={`w-5 h-5 ${location === '/community' ? 'text-primary' : ''}`} />
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('nav.community', 'Community')}</span>
        </Link>
        
        <Link href="/chat" className={`${navItemClass(location.includes('/chat'))} relative`}>
          <div className="relative">
            <MessageCircle className={`w-5 h-5 ${location.includes('/chat') ? 'text-primary' : ''}`} />
            {totalUnread > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white px-0.5">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">{t('navigation.chat', 'Messages')}</span>
        </Link>
        
        {user?.role === 'admin' && (
          <Link href="/admin" className={navItemClass(location.includes('/admin'))}>
            <ShieldCheck className={`w-5 h-5 ${location.includes('/admin') ? 'text-primary' : ''}`} />
            <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">Admin</span>
          </Link>
        )}
      </nav>
    </footer>
  );
}

export default MobileFooter;