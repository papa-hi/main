import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MessageCircle, Users, MapPin, CalendarDays, ThumbsUp, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';

// Type for forum discussions
interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    name: string;
    username: string;
    profileImage: string | null;
  };
  createdAt: string;
  commentsCount: number;
  likesCount: number;
  tags: string[];
}

// Type for community events
interface CommunityEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: {
    id: number;
    name: string;
    username: string;
    profileImage: string | null;
  };
  participantsCount: number;
  imageUrl?: string;
}

export function CommunityTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discussions');

  // Sample data for discussions
  const sampleDiscussions: ForumPost[] = [
    {
      id: 1,
      title: "Tips for handling toddler tantrums",
      content: "My 3-year-old has been having more tantrums lately. Any advice from fellow dads?",
      author: {
        id: 8,
        name: "Collins Lidede",
        username: "Lidede",
        profileImage: null,
      },
      createdAt: "2025-05-15T10:30:00Z",
      commentsCount: 12,
      likesCount: 8,
      tags: ["toddlers", "parenting", "behavior"]
    },
    {
      id: 2,
      title: "Best playgrounds in Amsterdam?",
      content: "Looking for recommendations on great playgrounds in Amsterdam that are suitable for a 5-year-old.",
      author: {
        id: 10,
        name: "Gregory Suden",
        username: "greg",
        profileImage: null,
      },
      createdAt: "2025-05-14T15:45:00Z",
      commentsCount: 8,
      likesCount: 15,
      tags: ["amsterdam", "playgrounds", "activities"]
    },
    {
      id: 3,
      title: "Single dad support group",
      content: "Are there any other single dads here? Would love to connect and share experiences.",
      author: {
        id: 11,
        name: "John Ambrose",
        username: "Jambroselaw",
        profileImage: null,
      },
      createdAt: "2025-05-13T09:15:00Z",
      commentsCount: 20,
      likesCount: 25,
      tags: ["single-dad", "support", "community"]
    }
  ];

  // Sample data for community events
  const sampleEvents: CommunityEvent[] = [
    {
      id: 1,
      title: "Fathers Day Picnic",
      description: "Join us for a special Fathers Day celebration at Vondelpark. Bring your kids and enjoy games, food, and fun!",
      date: "2025-06-15T12:00:00Z",
      location: "Vondelpark, Amsterdam",
      organizer: {
        id: 15,
        name: "Afra van der Markt",
        username: "google_CN2CzFbb",
        profileImage: null,
      },
      participantsCount: 28,
      imageUrl: "/uploads/place-images/playground1.jpg"
    },
    {
      id: 2,
      title: "Dad & Kids Cooking Workshop",
      description: "Learn to cook fun, healthy meals with your children. All ingredients provided.",
      date: "2025-05-25T10:00:00Z",
      location: "Community Center, Utrecht",
      organizer: {
        id: 10,
        name: "Gregory Suden",
        username: "greg",
        profileImage: null,
      },
      participantsCount: 12,
      imageUrl: "/uploads/place-images/restaurant1.jpg"
    },
    {
      id: 3,
      title: "Weekend Camping Trip",
      description: "Family camping weekend in the beautiful Dutch countryside. Activities for all ages!",
      date: "2025-06-07T09:00:00Z",
      location: "De Hoge Veluwe National Park",
      organizer: {
        id: 11,
        name: "John Ambrose",
        username: "Jambroselaw",
        profileImage: null,
      },
      participantsCount: 15,
      imageUrl: "/uploads/place-images/outdoor-playground.jpg"
    },
  ];

  // Format date to display in a user-friendly way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Format time to display in a user-friendly way
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get user initial for avatar fallback
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="mb-10 container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-bold">
          {t('community.title', 'Community')}
        </h2>
        {user && (
          <Button size="sm" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            {activeTab === 'discussions' 
              ? t('community.newPost', 'New Post') 
              : t('community.newEvent', 'New Event')}
          </Button>
        )}
      </div>

      <Tabs
        defaultValue="discussions"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="discussions" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('community.discussions', 'Discussions')}
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('community.events', 'Events')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discussions" className="space-y-4">
          {sampleDiscussions.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar>
                      <AvatarImage src={post.author.profileImage || undefined} />
                      <AvatarFallback>{getUserInitials(post.author.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <CardDescription>
                        {t('community.by', 'By')} {post.author.name} • {formatDate(post.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{post.content}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-3 flex justify-between">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {post.likesCount}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post.commentsCount}
                  </span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/community/discussions/${post.id}`}>
                    {t('community.viewDiscussion', 'View Discussion')}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
          <div className="flex justify-center mt-4">
            <Button variant="outline">
              {t('community.loadMore', 'Load More')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {sampleEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="grid md:grid-cols-3 gap-4">
                {event.imageUrl && (
                  <div className="h-48 md:h-auto bg-muted">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className={`p-6 ${event.imageUrl ? 'md:col-span-2' : 'md:col-span-3'}`}>
                  <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                  <div className="flex items-center text-muted-foreground mb-2">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    <span>
                      {formatDate(event.date)} • {formatTime(event.date)}
                    </span>
                  </div>
                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={event.organizer.profileImage || undefined} />
                        <AvatarFallback>{getUserInitials(event.organizer.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {t('community.organizedBy', 'Organized by')} {event.organizer.name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="text-sm">{event.participantsCount} {t('community.participants', 'participants')}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button asChild className="mr-2">
                      <Link to={`/community/events/${event.id}`}>
                        {t('community.viewEvent', 'View Event')}
                      </Link>
                    </Button>
                    <Button variant="outline">
                      {t('community.joinEvent', 'Join Event')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CommunityTab;