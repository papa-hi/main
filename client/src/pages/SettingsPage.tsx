import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Bell, Shield, HelpCircle } from 'lucide-react';
import NotificationSettings from '@/components/NotificationSettings';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('notifications');

  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  const sections = [
    {
      id: 'notifications',
      title: 'Meldingen',
      icon: Bell,
      description: 'Push meldingen en voorkeuren'
    },
    {
      id: 'account',
      title: 'Account',
      icon: User,
      description: 'Persoonlijke gegevens en profiel'
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: Shield,
      description: 'Privacy instellingen en gegevens'
    },
    {
      id: 'help',
      title: 'Help',
      icon: HelpCircle,
      description: 'Veelgestelde vragen en ondersteuning'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'notifications':
        return <NotificationSettings />;
      
      case 'account':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Instellingen
              </CardTitle>
              <CardDescription>
                Beheer je persoonlijke gegevens en profiel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Persoonlijke Informatie</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Naam:</span>
                      <p>{user?.firstName} {user?.lastName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gebruikersnaam:</span>
                      <p>{user?.username}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p>{user?.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stad:</span>
                      <p>{user?.city || 'Niet ingesteld'}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <Button variant="outline">Profiel Bewerken</Button>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'privacy':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Instellingen
              </CardTitle>
              <CardDescription>
                Beheer je privacy en gegevensgebruik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Zichtbaarheid</h4>
                  <p className="text-sm text-muted-foreground">
                    Je profiel is zichtbaar voor andere ouders in de PaPa-Hi community.
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Gegevens</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    We gebruiken je gegevens alleen voor het verbeteren van je ervaring.
                  </p>
                  <Button variant="outline" size="sm">
                    Gegevens Downloaden
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'help':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help & Ondersteuning
              </CardTitle>
              <CardDescription>
                Krijg hulp en ondersteuning voor PaPa-Hi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Veelgestelde Vragen</h4>
                  <div className="space-y-2 text-sm">
                    <details className="group">
                      <summary className="cursor-pointer hover:text-primary">
                        Hoe kan ik een playdate organiseren?
                      </summary>
                      <p className="mt-2 text-muted-foreground">
                        Ga naar de playdates pagina en klik op "Nieuwe Playdate". Vul de details in en nodig andere ouders uit.
                      </p>
                    </details>
                    <details className="group">
                      <summary className="cursor-pointer hover:text-primary">
                        Hoe voeg ik een nieuwe speelplek toe?
                      </summary>
                      <p className="mt-2 text-muted-foreground">
                        Op de plekken pagina kun je "Nieuwe Plek Toevoegen" kiezen en alle details invullen.
                      </p>
                    </details>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Contact</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Heb je nog vragen? Neem contact met ons op.
                  </p>
                  <Button variant="outline" size="sm">
                    Contact Opnemen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Settings className="h-8 w-8" />
          Instellingen
        </h1>
        <p className="text-muted-foreground">
          Beheer je account, meldingen en privacy instellingen
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-4 hover:bg-muted transition-colors ${
                        activeSection === section.id ? 'bg-muted border-r-2 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {section.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}