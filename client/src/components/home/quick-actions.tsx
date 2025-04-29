import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface QuickActionButtonProps {
  customIcon?: string;
  label: string;
  href: string;
  bgColor?: string;
}

function QuickActionButton({ 
  customIcon,
  label, 
  href, 
  bgColor = "bg-orange-500" 
}: QuickActionButtonProps) {
  return (
    <Link href={href}>
      <a className="flex flex-col items-center bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition transform hover:scale-105">
        <div className={`w-24 h-24 ${bgColor} rounded-full flex items-center justify-center mb-3 shadow-md overflow-hidden`}>
          {customIcon && (
            <img 
              src={customIcon} 
              alt={label}
              className="w-20 h-20 object-contain p-1" 
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
          bgColor="bg-orange-500" 
        />
        <QuickActionButton 
          customIcon="/icons/restaurant.png" 
          label={t('places.restaurant', 'Restaurants')} 
          href="/places?type=restaurant" 
          bgColor="bg-orange-500"
        />
        <QuickActionButton 
          customIcon="/icons/playground.png" 
          label={t('places.playground', 'Playgrounds')} 
          href="/places?type=playground" 
          bgColor="bg-orange-500"
        />
      </div>
    </section>
  );
}

export default QuickActions;
