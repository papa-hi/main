import React from 'react';
import { useTranslation } from 'react-i18next';
import { CommunityTab } from '@/components/community/community-tab';
import { ActivityRecommendations } from '@/components/home/activity-recommendations';
import { useAuth } from '@/hooks/use-auth';

export default function CommunityPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="py-6">
      <ActivityRecommendations />
      <CommunityTab />
    </div>
  );
}