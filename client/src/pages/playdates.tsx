import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Playdate } from "@shared/schema";
import { PlaydateCard } from "@/components/shared/playdate-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function PlaydatesPage() {
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
        <h1 className="text-2xl font-heading font-bold">Speelafspraken</h1>
        <Link href="/create">
          <Button className="bg-primary hover:bg-accent text-white">
            <i className="fas fa-plus mr-2"></i> Nieuwe Afspraak
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full grid grid-cols-2">
          <TabsTrigger value="upcoming" className="text-sm">Komende Afspraken</TabsTrigger>
          <TabsTrigger value="past" className="text-sm">Afgelopen Afspraken</TabsTrigger>
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
                src="https://images.unsplash.com/photo-1534653299134-96a171b61581?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120&q=80" 
                alt="Empty calendar" 
                className="w-20 h-20 object-cover rounded-full mx-auto mb-4"
              />
              <h3 className="font-heading font-medium text-lg mb-2">Geen speelafspraken gepland</h3>
              <p className="text-dark/70 text-sm mb-4">Plan een nieuwe speelafspraak om andere vaders te ontmoeten!</p>
              <Link href="/create">
                <Button className="bg-primary text-white hover:bg-accent transition">Nieuwe Afspraak</Button>
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
              <h3 className="font-heading font-medium text-lg mb-2">Geen afgelopen speelafspraken</h3>
              <p className="text-dark/70 text-sm">Hier verschijnen je afgelopen speelafspraken.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
