import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { LucideIcon, MapPin, Compass, CalendarPlus } from "lucide-react";

interface QuickActionButtonProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  href: string;
}

function QuickActionButton({ icon: Icon, iconBg, iconColor, label, href }: QuickActionButtonProps) {
  return (
    <Link 
      href={href}
      className="flex flex-col items-center bg-card p-5 rounded-xl shadow-sm hover:shadow-md transition transform hover:scale-105"
    >
      <div className={`w-24 h-24 rounded-full mb-3 shadow-md flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-10 h-10 ${iconColor}`} />
      </div>
      <span className="text-center text-sm font-medium">{label}</span>
    </Link>
  );
}

export function QuickActions() {
  const { t } = useTranslation();
  
  return (
    <section className="mb-10">
      <h2 className="text-xl font-heading font-bold mb-4">{t('home.quickActions', 'Quick Actions')}</h2>
      <div className="grid grid-cols-3 gap-4">
        <QuickActionButton 
          icon={CalendarPlus}
          iconBg="bg-orange-100"
          iconColor="text-orange-500"
          label={t('quickActions.newPlaydate', 'New Playdate')} 
          href="/create" 
        />
        <QuickActionButton 
          icon={MapPin}
          iconBg="bg-blue-100"
          iconColor="text-blue-500"
          label={t('quickActions.places', 'Places')} 
          href="/places" 
        />
        <QuickActionButton 
          icon={Compass}
          iconBg="bg-green-100"
          iconColor="text-green-500"
          label={t('quickActions.discover', 'Discover')} 
          href="/discover" 
        />
      </div>
    </section>
  );
}

export default QuickActions;
