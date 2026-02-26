import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "@/hooks/use-location";
import { Calendar, MapPin, Search, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  city: string | null;
  badge: string | null;
  bio: string | null;
}

export default function DiscoverPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { city } = useLocation();
  
  // Fetch all users
  const {
    data: users,
    isLoading,
    error
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Filter users based on search query
  const filteredUsers = users?.filter(user => {
    if (!searchQuery) return true;
    
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || 
           (user.city && user.city.toLowerCase().includes(query)) ||
           (user.bio && user.bio.toLowerCase().includes(query));
  });
  
  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">{t('discover.title')}</h1>
        <p className="text-muted-foreground">{t('discover.subtitle')}</p>
      </div>
      
      <Link href="/dad-days">
        <Card className="mb-6 cursor-pointer hover:shadow-md transition-shadow border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t('dadDays.discoverTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('dadDays.discoverSubtitle')}
              </p>
            </div>
            <Button variant="outline" size="sm">Open</Button>
          </CardContent>
        </Card>
      </Link>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('discover.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-24 w-full" />
              </CardHeader>
              <CardContent className="pt-6 pb-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{t('discover.errorLoading')}</p>
          <Button onClick={() => window.location.reload()}>
            {t('discover.tryAgain')}
          </Button>
        </div>
      )}
      
      {/* No Users Found */}
      {filteredUsers?.length === 0 && (
        <div className="text-center py-8 bg-muted/40 rounded-lg">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">{t('discover.noUsersFound')}</h3>
          <p className="text-muted-foreground">
            {t('discover.tryOtherSearch')}
          </p>
        </div>
      )}
      
      {/* Users Grid */}
      {filteredUsers && filteredUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              {/* Random gradient background */}
              <CardHeader className="p-0 h-24 bg-gradient-to-r from-primary/20 to-accent/30" />
              
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 -mt-12">
                  <ProfileAvatar 
                    profileImage={user.profileImage}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size="lg"
                    className="border-4 border-white"
                  />
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{`${user.firstName} ${user.lastName}`}</h3>
                      {user.badge && (
                        <Badge variant="outline" className="text-xs">{user.badge}</Badge>
                      )}
                    </div>
                    
                    {user.city && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{user.city}</span>
                        {city && user.city.includes(city) && (
                          <Badge variant="secondary" className="ml-2 text-xs">{t('discover.nearby')}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {user.bio && (
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                    {user.bio}
                  </p>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Link href={`/users/${user.id}`}>
                  <Button size="sm" variant="outline">{t('discover.viewProfile')}</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}