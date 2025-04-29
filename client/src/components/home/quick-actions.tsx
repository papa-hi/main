import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface QuickActionButtonProps {
  icon: string;
  label: string;
  href: string;
  bgColor?: string;
  iconColor?: string;
}

function QuickActionButton({ 
  icon, 
  label, 
  href, 
  bgColor = "bg-primary/10", 
  iconColor = "text-primary" 
}: QuickActionButtonProps) {
  return (
    <Link href={href}>
      <a className="flex flex-col items-center bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition transform hover:scale-105">
        <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mb-3 shadow-md border-2 ${iconColor.replace('text-', 'border-')}`}>
          <i className={`${icon} ${iconColor} text-2xl`}></i>
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
          icon="fas fa-calendar-plus" 
          label={t('quickActions.newPlaydate', 'New Playdate')} 
          href="/create" 
          bgColor="bg-blue-100" 
          iconColor="text-blue-600"
        />
        <QuickActionButton 
          icon="fas fa-utensils" 
          label={t('places.restaurant', 'Restaurants')} 
          href="/places?type=restaurant" 
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <QuickActionButton 
          icon="fas fa-tree" 
          label={t('places.playground', 'Playgrounds')} 
          href="/places?type=playground" 
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
      </div>
    </section>
  );
}

export default QuickActions;
