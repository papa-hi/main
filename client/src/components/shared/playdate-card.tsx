import { Playdate } from "@shared/schema";
import { getDay, getMonthAbbreviation, formatTime } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface PlaydateCardProps {
  playdate: Playdate;
}

export function PlaydateCard({ playdate }: PlaydateCardProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const startDate = new Date(playdate.startTime);
  const endDate = new Date(playdate.endTime);

  const timeRange = `${formatTime(startDate)} - ${formatTime(endDate)}`;
  
  const handleDelete = async () => {
    if (confirm(t('playdates.confirmDelete', 'Are you sure you want to delete this playdate?'))) {
      setIsDeleting(true);
      
      try {
        const response = await fetch(`/api/playdates/${playdate.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
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
          <div className="flex space-x-1">
            {playdate.participants.map((participant, index) => {
              if (index < 2) {
                return (
                  <img 
                    key={participant.id} 
                    src={participant.profileImage} 
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
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex-shrink-0 text-primary hover:text-accent transition" 
              aria-label="Options"
              disabled={isDeleting}
            >
              <i className="fas fa-ellipsis-v"></i>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <i className="fas fa-edit mr-2"></i> {t('common.edit', 'Edit')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <i className="fas fa-share mr-2"></i> {t('playdates.share', 'Share')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <i className="fas fa-trash-alt mr-2"></i> {t('common.delete', 'Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
