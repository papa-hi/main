import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "@/hooks/use-location";
import { Calendar, MapPin, Search, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { STALE_TIMES } from "@/lib/queryClient";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  city: string | null;
  badge: string | null;
  bio: string | null;
}

type AgeFilter = null | [number, number];

const AGE_GROUPS: { label: string; range: AgeFilter }[] = [
  { label: "All ages", range: null },
  { label: "0–2",      range: [0, 2] },
  { label: "3–5",      range: [3, 5] },
  { label: "6–10",     range: [6, 10] },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function DiscoverPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [ageFilter, setAgeFilter] = useState<AgeFilter>(null);
  const debouncedQuery = useDebounce(searchQuery, 400);
  const { city } = useLocation();

  const trimmedQuery = debouncedQuery.trim();

  // Build query params:
  //   - No search text → default to dads in your city
  //   - Search text    → ILIKE across name / bio / city (no city pre-filter)
  //   - Age filter     → always appended on top
  const params = new URLSearchParams({ limit: "20" });
  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  } else if (city) {
    params.set("city", city);
  }
  if (ageFilter) {
    params.set("childMinAge", String(ageFilter[0]));
    params.set("childMaxAge", String(ageFilter[1]));
  }
  const apiUrl = `/api/users?${params.toString()}`;

  // Every filter dimension is in the key — no stale-cache cross-contamination
  const queryKey = ["/api/users", trimmedQuery, trimmedQuery ? null : (city ?? null), ageFilter?.join("-") ?? null];

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey,
    queryFn: () => fetch(apiUrl, { credentials: "include" }).then(r => r.json()),
    staleTime: STALE_TIMES.PLAYDATES,
  });

  const hasActiveFilter = ageFilter !== null;

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
      <div className="relative mb-3">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('discover.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Row — age group chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {AGE_GROUPS.map(({ label, range }) => {
          const active = ageFilter?.join("-") === range?.join("-");
          return (
            <Button
              key={label}
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => setAgeFilter(active ? null : range)}
            >
              {label}
            </Button>
          );
        })}
      </div>

      {/* Context label */}
      {!trimmedQuery && city && (
        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Showing dads in <span className="font-medium">{city}</span>
        </p>
      )}

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
      {!isLoading && users?.length === 0 && (
        <div className="text-center py-8 bg-muted/40 rounded-lg">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">{t('discover.noUsersFound')}</h3>
          <p className="text-muted-foreground">
            {trimmedQuery
              ? `No dads found for "${trimmedQuery}"${hasActiveFilter ? " with the selected age filter" : ""}.`
              : hasActiveFilter
                ? "No dads match the selected age filter in your area."
                : t('discover.tryOtherSearch')}
          </p>
        </div>
      )}

      {/* Users Grid */}
      {users && users.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
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
                        {city && user.city.toLowerCase().includes(city.toLowerCase()) && (
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
