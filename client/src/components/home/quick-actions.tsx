import { Link } from "wouter";

interface QuickActionButtonProps {
  icon: string;
  label: string;
  href: string;
}

function QuickActionButton({ icon, label, href }: QuickActionButtonProps) {
  return (
    <Link href={href}>
      <a className="flex flex-col items-center bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <i className={`${icon} text-primary text-lg`}></i>
        </div>
        <span className="text-center text-sm font-medium">{label}</span>
      </a>
    </Link>
  );
}

export function QuickActions() {
  return (
    <section className="mb-10">
      <div className="grid grid-cols-3 gap-4">
        <QuickActionButton 
          icon="fas fa-calendar-plus" 
          label="Nieuwe Afspraak" 
          href="/create" 
        />
        <QuickActionButton 
          icon="fas fa-utensils" 
          label="Restaurants" 
          href="/places?type=restaurant" 
        />
        <QuickActionButton 
          icon="fas fa-tree" 
          label="Speeltuinen" 
          href="/places?type=playground" 
        />
      </div>
    </section>
  );
}

export default QuickActions;
