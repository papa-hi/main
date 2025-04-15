import { Playdate } from "@shared/schema";
import { getDay, getMonthAbbreviation, formatTime } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

interface PlaydateCardProps {
  playdate: Playdate;
}

export function PlaydateCard({ playdate }: PlaydateCardProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  const startDate = new Date(playdate.startTime);
  const endDate = new Date(playdate.endTime);

  const timeRange = `${formatTime(startDate)} - ${formatTime(endDate)}`;
  
  // Check if current user is a participant
  const isParticipating = playdate.participants.some(p => p.id === user?.id);
  
  // Check if playdate is at max capacity
  const isAtMaxCapacity = playdate.participants.length >= playdate.maxParticipants;
  
  // Check if current user is the creator (first participant)
  const isCreator = playdate.participants[0]?.id === user?.id;
  
  const handleDelete = async () => {
    if (confirm(t('playdates.confirmDelete', 'Are you sure you want to delete this playdate?'))) {
      setIsDeleting(true);
      
      try {
        const response = await fetch(`/api/playdates/${playdate.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          // Invalidate queries to refetch playdates
          queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
          queryClient.invalidateQueries({ queryKey: ['/api/playdates/past'] });
          
          toast({
            title: t('playdates.deleted', 'Playdate deleted'),
            description: t('playdates.deleteSuccess', 'The playdate has been successfully deleted.'),
          });
        } else {
          throw new Error(t('playdates.deleteError', 'An error occurred while deleting the playdate.'));
        }
      } catch (error) {
        toast({
          title: t('common.error', 'Error'),
          description: t('playdates.deleteError', 'An error occurred while deleting the playdate.'),
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const handleJoin = async () => {
    if (!user) return;
    
    setIsJoining(true);
    
    try {
      await apiRequest('POST', `/api/playdates/${playdate.id}/join`);
      
      // Invalidate queries to refetch playdates
      queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['/api/playdates/past'] });
      
      toast({
        title: t('playdates.joined', 'Joined playdate'),
        description: t('playdates.joinSuccess', 'You have successfully joined the playdate.'),
      });
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: t('playdates.joinError', 'An error occurred while joining the playdate.'),
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleLeave = async () => {
    if (!user) return;
    
    if (confirm(t('playdates.confirmLeave', 'Are you sure you want to leave this playdate?'))) {
      setIsLeaving(true);
      
      try {
        await apiRequest('DELETE', `/api/playdates/${playdate.id}/join`);
        
        // Invalidate queries to refetch playdates
        queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
        queryClient.invalidateQueries({ queryKey: ['/api/playdates/past'] });
        
        toast({
          title: t('playdates.left', 'Left playdate'),
          description: t('playdates.leaveSuccess', 'You have successfully left the playdate.'),
        });
      } catch (error) {
        toast({
          title: t('common.error', 'Error'),
          description: t('playdates.leaveError', 'An error occurred while leaving the playdate.'),
          variant: "destructive",
        });
      } finally {
        setIsLeaving(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-14 h-14 bg-accent/10 rounded-lg flex flex-col items-center justify-center mr-4">
          <span className="text-accent font-bold text-lg">{getDay(startDate)}</span>
          <span className="text-accent text-xs uppercase">{getMonthAbbreviation(startDate)}</span>
        </div>
        <div className="flex-grow">
          <h3 className="font-heading font-medium text-base mb-1">{playdate.title}</h3>
          <div className="flex items-center text-sm text-dark/70 mb-2">
            <i className="fas fa-clock mr-1 text-xs"></i>
            <span>{timeRange}</span>
            <i className="fas fa-map-marker-alt ml-3 mr-1 text-xs"></i>
            <span>{playdate.location}</span>
          </div>
          <div className="flex items-center mb-3">
            <div className="flex space-x-1 mr-3">
              {playdate.participants.map((participant, index) => {
                if (index < 2) {
                  return (
                    <img 
                      key={participant.id} 
                      src={participant.profileImage ? participant.profileImage : '/assets/default-avatar.png'} 
                      alt={`${participant.firstName} ${participant.lastName}`} 
                      className="w-6 h-6 rounded-full object-cover border border-white" 
                    />
                  );
                } 
                return null;
              })}
              {playdate.participants.length > 2 && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">
                  +{playdate.participants.length - 2}
                </div>
              )}
            </div>
            <span className="text-xs text-dark/60">
              {playdate.participants.length} / {playdate.maxParticipants} {t('playdates.participants', 'deelnemers')}
            </span>
          </div>
          
          {/* Join/Leave buttons */}
          {!isCreator && (
            <div className="mt-2">
              {isParticipating ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLeave}
                  disabled={isLeaving}
                  className="text-xs h-8"
                >
                  {isLeaving ? (
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                  ) : (
                    <i className="fas fa-sign-out-alt mr-1"></i>
                  )}
                  {t('playdates.leave', 'Verlaten')}
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleJoin}
                  disabled={isJoining || isAtMaxCapacity}
                  className={`text-xs h-8 ${isAtMaxCapacity ? 'bg-gray-400 hover:bg-gray-400' : 'bg-primary hover:bg-accent'}`}
                >
                  {isJoining ? (
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                  ) : (
                    <i className="fas fa-user-plus mr-1"></i>
                  )}
                  {isAtMaxCapacity ? t('playdates.full', 'Vol') : t('playdates.join', 'Deelnemen')}
                </Button>
              )}
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex-shrink-0 text-primary hover:text-accent transition" 
              aria-label="Options"
              disabled={isDeleting || isJoining || isLeaving}
            >
              <i className="fas fa-ellipsis-v"></i>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isCreator && (
              <DropdownMenuItem onClick={() => navigate(`/edit-playdate/${playdate.id}`)}>
                <i className="fas fa-edit mr-2"></i> {t('common.edit', 'Edit')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <i className="fas fa-share mr-2"></i> {t('playdates.share', 'Share')}
            </DropdownMenuItem>
            {isCreator && (
              <DropdownMenuItem 
                className="text-red-500 focus:text-red-500" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <i className="fas fa-trash-alt mr-2"></i> {t('common.delete', 'Delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
