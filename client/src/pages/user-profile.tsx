import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [chatId, setChatId] = useState<number | null>(null);
  
  // Fetch user profile data
  const {
    data: user,
    isLoading,
    error
  } = useQuery({
    queryKey: [`/api/users/${id}`],
    enabled: !!id && id !== currentUser?.id.toString()
  });
  
  // Fetch existing chats to see if we already have a chat with this user
  const { data: existingChats } = useQuery({
    queryKey: ["/api/chats"],
    enabled: !!currentUser,
  });
  
  // Check if we already have a chat with this user
  useEffect(() => {
    if (existingChats && user) {
      const chat = existingChats.find((chat: any) => 
        chat.participants.some((p: any) => p.id === user.id)
      );
      
      if (chat) {
        setChatId(chat.id);
      }
    }
  }, [existingChats, user]);
  
  // Start a new chat with this user
  const startChat = async () => {
    if (!currentUser || !user) return;
    
    try {
      // If we already have a chat, navigate to it
      if (chatId) {
        window.location.href = `/chat/${chatId}`;
        return;
      }
      
      // Create a new chat with this user
      const response = await apiRequest("POST", "/api/chats", {
        participants: [currentUser.id, user.id]
      });
      
      const newChat = await response.json();
      
      // Invalidate chats query to refresh chat list
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      
      // Navigate to new chat
      window.location.href = `/chat/${newChat.id}`;
    } catch (err) {
      console.error("Error creating chat:", err);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het maken van een chat",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-4">
        <div className="mb-6 flex items-start gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-32 w-full mb-6" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="py-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Gebruiker niet gevonden</h1>
        <p className="text-muted-foreground mb-4">
          De gebruiker die je zoekt bestaat niet of je hebt geen toegang tot dit profiel.
        </p>
        <Link href="/">
          <Button>Terug naar Home</Button>
        </Link>
      </div>
    );
  }
  
  // If the current user is viewing their own profile, redirect to /profile
  if (currentUser && user.id === currentUser.id) {
    window.location.href = "/profile";
    return null;
  }
  
  return (
    <div className="py-4">
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage 
              src={user.profileImage || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`} 
              alt={`${user.firstName} ${user.lastName}`} 
              className="object-cover"
            />
            <AvatarFallback>{`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}</AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-heading font-bold">{`${user.firstName} ${user.lastName}`}</h1>
              {user.badge && (
                <Badge variant="secondary">{user.badge}</Badge>
              )}
            </div>
            
            <p className="text-muted-foreground">{user.city || "Locatie onbekend"}</p>
            
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={startChat}
                className="bg-primary text-white hover:bg-accent"
              >
                {chatId ? "Naar Chat" : "Start Chat"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {user.bio && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Over Mij</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{user.bio}</p>
          </CardContent>
        </Card>
      )}
      
      {user.childrenInfo && user.childrenInfo.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mijn Kinderen</CardTitle>
            <CardDescription>Details over de kinderen</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {user.childrenInfo.map((child: any, index: number) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>{child.name}, {child.age} jaar</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {user.favoriteLocations && user.favoriteLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Favoriete Plekken</CardTitle>
            <CardDescription>Plekken die {user.firstName} leuk vindt</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {user.favoriteLocations.map((location: string, index: number) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span>{location}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Bekijk alle plekken
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}