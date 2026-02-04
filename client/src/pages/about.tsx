import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, MapPin, MessageSquare, Lock, Eye, Globe, UserCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface SafetyInfo {
  guidelines: string[];
  features: string[];
  privacyOptions: string[];
}

export default function AboutPage() {
  const [_, navigate] = useLocation();
  
  const { data: safetyInfo } = useQuery<SafetyInfo>({
    queryKey: ['/api/public/safety-info'],
  });

  const { data: publicPlaces } = useQuery<{ id: number }[]>({
    queryKey: ['/api/public/places'],
  });

  const { data: publicEvents } = useQuery<{ id: number }[]>({
    queryKey: ['/api/public/events'],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-primary">PaPa-Hi</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A social platform designed for fathers in the Netherlands. 
            Connect with other dads, organize playdates, and discover family-friendly locations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                For Dads, By Dads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                PaPa-Hi is a community built specifically for fathers. 
                Connect with other dads in your area, share experiences, 
                and create lasting friendships for you and your children.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Discover Places
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Browse our curated list of {publicPlaces?.length || 'many'} child-friendly 
                locations including playgrounds, restaurants, and museums across the Netherlands.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Family Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Stay updated on {publicEvents?.length || 'upcoming'} family-friendly 
                events, festivals, and activities happening near you.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Community
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Join discussions, share tips, and get advice from fellow fathers
                in our moderated community forums.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Safety & Privacy First
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {safetyInfo && (
              <>
                <div>
                  <h3 className="font-semibold mb-3">Community Guidelines</h3>
                  <ul className="space-y-2">
                    {safetyInfo.guidelines?.map((guideline: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{guideline}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Safety Features</h3>
                  <ul className="space-y-2">
                    {safetyInfo.features?.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Lock className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Your Privacy Options</h3>
                  <ul className="space-y-2">
                    {safetyInfo.privacyOptions?.map((option: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Eye className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{option}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mb-12 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Tiered Access for Your Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-background rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Browse Without Signing Up
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View child-friendly locations</li>
                  <li>• See public event listings</li>
                  <li>• Read community guidelines</li>
                  <li>• Explore sample playdates</li>
                </ul>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Join to Connect
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create and join playdates</li>
                  <li>• Message other fathers</li>
                  <li>• See who's attending events</li>
                  <li>• Participate in discussions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to Connect?</h2>
          <p className="text-muted-foreground">
            Join thousands of dads building a community for their families.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/register')}>
              Create Account
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
