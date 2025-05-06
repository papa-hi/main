import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Playdate } from "@shared/schema";
import { PlaydateCard } from "@/components/shared/playdate-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function PlaydatesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("upcoming");
  
  const { data: upcomingPlaydates, isLoading: upcomingLoading } = useQuery<Playdate[]>({
    queryKey: ['/api/playdates/upcoming'],
  });
  
  const { data: pastPlaydates, isLoading: pastLoading } = useQuery<Playdate[]>({
    queryKey: ['/api/playdates/past'],
  });

  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-heading font-bold">{t('playdates.create')}</h1>
        <Link href="/create">
          <Button className="bg-primary hover:bg-accent text-white">
            <i className="fas fa-plus mr-2"></i> {t('playdates.newPlaydate')}
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full grid grid-cols-2">
          <TabsTrigger value="upcoming" className="text-sm">{t('playdates.upcoming')}</TabsTrigger>
          <TabsTrigger value="past" className="text-sm">{t('playdates.past')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {upcomingLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start">
                    <Skeleton className="flex-shrink-0 w-14 h-14 rounded-lg mr-4" />
                    <div className="flex-grow">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <div className="flex space-x-1">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="w-6 h-6 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingPlaydates && upcomingPlaydates.length > 0 ? (
            <div className="space-y-4">
              {upcomingPlaydates.map((playdate) => (
                <PlaydateCard key={playdate.id} playdate={playdate} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <img 
                src="/images/father.png" 
                alt={t('playdates.emptyCalendarAlt', 'Father with children')} 
                className="w-28 h-28 object-cover rounded-full mx-auto mb-4"
              />
              <h3 className="font-heading font-medium text-lg mb-2">{t('playdates.noPlaydatesPlanned')}</h3>
              <p className="text-dark/70 text-sm mb-4">{t('playdates.planNewMeetDads')}</p>
              <Link href="/create">
                <Button className="bg-primary text-white hover:bg-accent transition">{t('playdates.newPlaydate')}</Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {pastLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start">
                    <Skeleton className="flex-shrink-0 w-14 h-14 rounded-lg mr-4" />
                    <div className="flex-grow">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <div className="flex space-x-1">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="w-6 h-6 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pastPlaydates && pastPlaydates.length > 0 ? (
            <div className="space-y-4">
              {pastPlaydates.map((playdate) => (
                <PlaydateCard key={playdate.id} playdate={playdate} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <img 
                src="/images/father.png" 
                alt={t('playdates.emptyCalendarAlt', 'Father with children')} 
                className="w-28 h-28 object-cover rounded-full mx-auto mb-4"
              />
              <h3 className="font-heading font-medium text-lg mb-2">{t('playdates.noPlaydatesPlanned')}</h3>
              <p className="text-dark/70 text-sm">{t('playdates.noPastPlaydates', 'You don\'t have any past playdates yet.')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
