import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Playdate } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { nl, enUS, de, es, fr } from "date-fns/locale";
import type { Locale } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { PlaydateLocationMap } from "@/components/maps/playdate-location-map";
import { CalendarPlus } from "lucide-react";

function generateGoogleCalendarUrl(title: string, description: string, location: string, startTime: string | Date, endTime: string | Date): string {
  const start = new Date(startTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(endTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    location: location,
    dates: `${start}/${end}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function PlaydateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const playdateId = parseInt(id);
  const [_, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Fetch this specific playdate
  const { data: playdate, isLoading, error } = useQuery<Playdate>({
    queryKey: [`/api/playdates/${playdateId}`],
    retry: false,
  });

  // Check if user has already joined
  const hasJoined = user && playdate?.participants.some(p => p.id === user.id);
  // Check if user is the creator (first participant)
  const isCreator = user && playdate?.participants[0]?.id === user.id;
  // Check if playdate is full
  const isFull = playdate && playdate.participants.length >= playdate.maxParticipants;

  // Handle join playdate
  const joinPlaydateMutation = useMutation({
    mutationFn: async () => {
      setIsJoining(true);
      const res = await apiRequest("POST", `/api/playdates/${playdateId}/join`);
      setIsJoining(false);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('playdates.joinSuccess', 'Joined playdate'),
        description: t('playdates.joinSuccessMessage', 'You have successfully joined this playdate.'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/playdates/${playdateId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
    },
    onError: (error: Error) => {
      setIsJoining(false);
      toast({
        title: t('playdates.joinError', 'Failed to join'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle leave playdate
  const leavePlaydateMutation = useMutation({
    mutationFn: async () => {
      setIsLeaving(true);
      const res = await apiRequest("POST", `/api/playdates/${playdateId}/leave`);
      setIsLeaving(false);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('playdates.leaveSuccess', 'Left playdate'),
        description: t('playdates.leaveSuccessMessage', 'You have successfully left this playdate.'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/playdates/${playdateId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
    },
    onError: (error: Error) => {
      setIsLeaving(false);
      toast({
        title: t('playdates.leaveError', 'Failed to leave'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Format date based on language
  const formatDate = (date: Date) => {
    const localeMap: Record<string, Locale> = {
      nl: nl,
      en: enUS,
      de: de,
      es: es,
      fr: fr
    };
    
    const locale = localeMap[i18n.language] || enUS;
    return format(date, "EEEE, d MMMM yyyy", { locale });
  };

  // Format time
  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  // Handle delete playdate
  const handleDelete = async () => {
    if (!isCreator) return;
    
    const confirmDelete = window.confirm(t('playdates.confirmDelete', 'Are you sure you want to delete this playdate?'));
    if (!confirmDelete) return;
    
    try {
      const response = await fetch(`/api/playdates/${playdateId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: t('playdates.deleted', 'Playdate deleted'),
          description: t('playdates.deleteSuccess', 'The playdate has been successfully deleted.'),
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
        navigate('/playdates');
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      toast({
        title: t('playdates.deleteError', 'Error deleting playdate'),
        description: String(error),
        variant: "destructive",
      });
    }
  };

  // Navigate to edit page
  const handleEdit = () => {
    if (isCreator) {
      navigate(`/edit-playdate/${playdateId}`);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-6" />
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <Skeleton className="h-6 w-1/4 mb-4" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <div className="flex space-x-3 mb-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10 w-10 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>
    );
  }

  // Handle error
  if (error || !playdate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">{t('playdates.notFound', 'Playdate Not Found')}</h1>
          <p className="text-muted-foreground mb-6">{t('playdates.notFoundMessage', 'The playdate you are looking for does not exist or has been deleted.')}</p>
          <Button onClick={() => navigate('/playdates')}>
            {t('playdates.backToPlaydates', 'Back to Playdates')}
          </Button>
        </div>
      </div>
    );
  }

  // Format date and time
  const startDateTime = new Date(playdate.startTime);
  const endDateTime = new Date(playdate.endTime);
  const formattedDate = formatDate(startDateTime);
  const timeRange = `${formatTime(startDateTime)} - ${formatTime(endDateTime)}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-heading font-bold">{playdate.title}</h1>
          {isCreator && (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEdit}
                className="flex items-center gap-1"
              >
                <i className="fas fa-edit text-sm"></i>
                {t('common.edit', 'Edit')}
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                className="flex items-center gap-1"
              >
                <i className="fas fa-trash-alt text-sm"></i>
                {t('common.delete', 'Delete')}
              </Button>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-heading font-medium mb-4">{t('playdates.details', 'Details')}</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <i className="fas fa-calendar-alt mt-1 mr-3 text-primary"></i>
              <div>
                <p className="font-medium">{formattedDate}</p>
                <p className="text-muted-foreground">{timeRange}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <i className="fas fa-map-marker-alt mt-1 mr-3 text-primary"></i>
              <div>
                <p className="font-medium">{playdate.location}</p>
              </div>
            </div>
            
            {playdate.description && (
              <div className="flex items-start">
                <i className="fas fa-info-circle mt-1 mr-3 text-primary"></i>
                <div>
                  <p>{playdate.description}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start">
              <i className="fas fa-users mt-1 mr-3 text-primary"></i>
              <div>
                <p>
                  {t('playdates.capacity', 'Capacity')}: {playdate.participants.length} / {playdate.maxParticipants}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <i className="fas fa-euro-sign mt-1 mr-3 text-primary"></i>
              <div>
                <p className="font-medium">{t('playdates.cost', 'Cost')}</p>
                <p className={`${playdate.cost?.toLowerCase() === 'free' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {playdate.cost || 'Free'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <a 
              href={generateGoogleCalendarUrl(
                playdate.title,
                playdate.description || "",
                playdate.location,
                playdate.startTime,
                playdate.endTime
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors"
            >
              <CalendarPlus className="h-5 w-5" />
              {t('playdates.addToCalendar', 'Add to Calendar')}
            </a>
          </div>
        </div>
        
        {/* Location Map */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-heading font-medium mb-4">{t('playdates.location', 'Location')}</h2>
          <PlaydateLocationMap 
            location={playdate.location}
            title={playdate.title}
            className="h-64"
          />
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-heading font-medium mb-4">{t('playdates.participants', 'Participants')}</h2>
          
          <div className="space-y-4 mb-6">
            {playdate.participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3">
                <img 
                  src={participant.profileImage || '/assets/default-avatar.png'} 
                  alt={`${participant.firstName} ${participant.lastName}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{participant.firstName} {participant.lastName}</p>
                  {participant.id === playdate.participants[0].id && (
                    <span className="text-xs text-accent">{t('playdates.organizer', 'Organizer')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {user && !isCreator && (
            <div>
              {hasJoined ? (
                <Button 
                  variant="outline" 
                  onClick={() => leavePlaydateMutation.mutate()}
                  disabled={isLeaving}
                  className="w-full sm:w-auto"
                >
                  {isLeaving ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-sign-out-alt mr-2"></i>
                  )}
                  {t('playdates.leave', 'Leave Playdate')}
                </Button>
              ) : (
                <Button 
                  onClick={() => joinPlaydateMutation.mutate()}
                  disabled={isJoining || isFull}
                  className="w-full sm:w-auto"
                >
                  {isJoining ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-handshake mr-2"></i>
                  )}
                  {isFull ? 
                    t('playdates.full', 'Playdate Full') : 
                    t('playdates.join', 'Join Playdate')
                  }
                </Button>
              )}
            </div>
          )}
          
          {!user && (
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              <p className="mb-2">{t('auth.loginToJoin', 'Login to join this playdate')}</p>
              <Button onClick={() => navigate('/auth')} size="sm">
                {t('auth.login', 'Login')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}