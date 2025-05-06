import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PlaydateCard } from "../shared/playdate-card";
import { Playdate } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export function UpcomingPlaydates() {
  const { t } = useTranslation();
  const { data: playdates, isLoading, error } = useQuery<Playdate[]>({
    queryKey: ['/api/playdates/upcoming'],
  });
  
  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">{t('home.upcomingPlaydates', 'Upcoming Playdates')}</h2>
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
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
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">{t('home.upcomingPlaydates', 'Upcoming Playdates')}</h2>
        </div>
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {t('playdates.loadError', 'An error occurred while loading your playdates.')}
        </div>
      </section>
    );
  }

  if (!playdates || playdates.length === 0) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">{t('home.upcomingPlaydates', 'Upcoming Playdates')}</h2>
          <Link href="/playdates">
            <a className="text-primary text-sm font-medium hover:text-accent transition">{t('home.seeAll', 'See All')}</a>
          </Link>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <img 
            src="/images/father.png" 
            alt={t('playdates.emptyCalendarAlt', 'Father with children')} 
            className="w-28 h-28 object-cover rounded-full mx-auto mb-4"
          />
          <h3 className="font-heading font-medium text-lg mb-2">{t('playdates.noPlaydatesPlanned', 'No playdates planned')}</h3>
          <p className="text-dark/70 text-sm mb-4">{t('playdates.planNewMeetDads', 'Plan a new playdate to meet other fathers!')}</p>
          <Link href="/create">
            <button className="bg-primary text-white hover:bg-accent transition py-2 px-6 rounded-lg font-medium text-sm">
              {t('playdates.newPlaydate', 'New Playdate')}
            </button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">{t('home.upcomingPlaydates', 'Upcoming Playdates')}</h2>
        <Link href="/playdates">
          <a className="text-primary text-sm font-medium hover:text-accent transition">{t('home.seeAll', 'See All')}</a>
        </Link>
      </div>
      
      <div className="space-y-4">
        {playdates.map((playdate) => (
          <PlaydateCard key={playdate.id} playdate={playdate} />
        ))}
      </div>
    </section>
  );
}

export default UpcomingPlaydates;
