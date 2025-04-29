import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface QuickActionButtonProps {
  customIcon?: string;
  label: string;
  href: string;
}

function QuickActionButton({ 
  customIcon,
  label, 
  href
}: QuickActionButtonProps) {
  return (
    <Link href={href}>
      <a className="flex flex-col items-center bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition transform hover:scale-105">
        <div className={`w-24 h-24 rounded-full mb-3 shadow-md overflow-hidden relative`}>
          {customIcon && (
            <img 
              src={customIcon} 
              alt={label}
              className="w-full h-full object-cover absolute inset-0" 
            />
          )}
        </div>
        <span className="text-center text-sm font-medium">{label}</span>
      </a>
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
          customIcon="/icons/playdate.png" 
          label={t('quickActions.newPlaydate', 'New Playdate')} 
          href="/create" 
        />
        <QuickActionButton 
          customIcon="/icons/restaurant.png" 
          label={t('places.restaurant', 'Restaurants')} 
          href="/places?type=restaurant" 
        />
        <QuickActionButton 
          customIcon="/icons/playground.png" 
          label={t('places.playground', 'Playgrounds')} 
          href="/places?type=playground" 
        />
      </div>
    </section>
  );
}

export default QuickActions;
