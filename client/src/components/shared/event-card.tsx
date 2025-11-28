import { FamilyEvent } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

interface EventCardProps {
  event: FamilyEvent;
  layout?: 'horizontal' | 'grid';
}

export function EventCard({ event, layout = 'horizontal' }: EventCardProps) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleCardClick = () => {
    setLocation(`/events/${event.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setLocation(`/events/${event.id}`);
    }
  };

  // Ensure URL has protocol
  const ensureProtocol = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-shadow cursor-pointer ${layout === 'horizontal' ? 'flex-shrink-0 w-80' : ''}`}
      data-testid={`card-event-${event.id}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {event.imageUrl && (
        <img 
          src={event.imageUrl} 
          alt={event.title}
          className="w-full h-48 object-cover rounded-t-xl"
        />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg" data-testid={`text-event-title-${event.id}`}>
            {event.title}
          </CardTitle>
          <Badge variant="default" className="flex-shrink-0">
            {event.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-event-description-${event.id}`}>
          {event.description}
        </p>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="truncate" data-testid={`text-event-date-${event.id}`}>
            {event.endDate && format(new Date(event.startDate), "MMM d") !== format(new Date(event.endDate), "MMM d") ? (
              <>
                {format(new Date(event.startDate), "MMM d, h:mm a")} - {format(new Date(event.endDate), "MMM d, h:mm a")}
              </>
            ) : (
              format(new Date(event.startDate), "MMM d, h:mm a")
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate" data-testid={`text-event-location-${event.id}`}>
            {event.location}
          </span>
        </div>

        {event.ageRange && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span data-testid={`text-event-age-${event.id}`}>{event.ageRange}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Badge variant="secondary" data-testid={`text-event-cost-${event.id}`}>
            {event.cost}
          </Badge>
          {event.registrationUrl && (
            <a 
              href={ensureProtocol(event.registrationUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline z-10 relative"
              data-testid={`link-event-register-${event.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              {t('events.register')} →
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
