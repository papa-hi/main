import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0).max(18),
});

const onboardingSchema = z.object({
  bio: z.string().min(10, "Please tell us a bit more about yourself"),
  city: z.string().min(2, "Please enter your city"),
  children: z.array(childSchema).min(1, "Please add at least one child"),
  interests: z.array(z.string()).min(1, "Please select at least one interest"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const steps = [
  { id: 1, title: "Welcome", icon: "👋" },
  { id: 2, title: "About You", icon: "👨‍👦" },
  { id: 3, title: "Your Children", icon: "👶" },
  { id: 4, title: "Interests", icon: "🎯" },
  { id: 5, title: "Complete", icon: "🎉" },
];

const interestOptions = [
  { id: "outdoor", label: "Outdoor Activities", icon: "🌳" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "arts", label: "Arts & Crafts", icon: "🎨" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "reading", label: "Reading", icon: "📚" },
  { id: "games", label: "Board Games", icon: "🎲" },
  { id: "cooking", label: "Cooking", icon: "👨‍🍳" },
  { id: "tech", label: "Technology", icon: "💻" },
];

export default function OnboardingPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      bio: "",
      city: "",
      children: [{ name: "", age: 0 }],
      interests: [],
    },
  });

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const addChild = () => {
    const children = form.getValues("children");
    form.setValue("children", [...children, { name: "", age: 0 }]);
  };

  const removeChild = (index: number) => {
    const children = form.getValues("children");
    if (children.length > 1) {
      form.setValue("children", children.filter((_, i) => i !== index));
    }
  };

  const toggleInterest = (interestId: string) => {
    const interests = form.getValues("interests");
    const isSelected = interests.includes(interestId);
    
    if (isSelected) {
      form.setValue("interests", interests.filter(id => id !== interestId));
    } else {
      form.setValue("interests", [...interests, interestId]);
    }
  };

  const nextStep = async () => {
    let isValid = true;

    // Validate current step
    if (currentStep === 2) {
      isValid = await form.trigger(["bio", "city"]);
    } else if (currentStep === 3) {
      isValid = await form.trigger("children");
    } else if (currentStep === 4) {
      isValid = await form.trigger("interests");
    }

    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest("PATCH", "/api/users/me", {
        bio: data.bio,
        city: data.city,
        childrenInfo: data.children,
        interests: data.interests,
        onboardingCompleted: true,
      });

      toast({
        title: t("onboarding.welcome", "Welcome to PaPa-Hi!"),
        description: t("onboarding.profileComplete", "Your profile is now complete. Let's start connecting!"),
      });

      navigate("/");
    } catch (error) {
      toast({
        title: t("onboarding.error", "Something went wrong"),
        description: t("onboarding.tryAgain", "Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="text-8xl mb-4">👋</div>
            <h2 className="text-3xl font-heading font-bold text-primary">
              {t("onboarding.welcomeTitle", "Welcome to PaPa-Hi!")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {t("onboarding.welcomeDesc", "Let's set up your profile so you can start connecting with other dads and planning amazing activities for your kids!")}
            </p>
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">
                {t("onboarding.whatYouGet", "What you'll get:")}
              </h3>
              <ul className="text-sm space-y-1 text-left max-w-sm mx-auto">
                <li>🤝 {t("onboarding.connectDads", "Connect with local dads")}</li>
                <li>📅 {t("onboarding.organizePlaydates", "Organize playdates easily")}</li>
                <li>📍 {t("onboarding.discoverPlaces", "Discover family-friendly places")}</li>
                <li>💬 {t("onboarding.chatSecurely", "Chat securely with other parents")}</li>
              </ul>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">👨‍👦</div>
              <h2 className="text-2xl font-heading font-bold">
                {t("onboarding.aboutYouTitle", "Tell us about yourself")}
              </h2>
              <p className="text-muted-foreground">
                {t("onboarding.aboutYouDesc", "Help other dads get to know you better")}
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("onboarding.bioLabel", "About you and your family")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("onboarding.bioPlaceholder", "Tell us about yourself, your hobbies, and what you love doing with your kids...")}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("onboarding.cityLabel", "Your city")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("onboarding.cityPlaceholder", "e.g. Amsterdam")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        const children = form.watch("children");
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">👶</div>
              <h2 className="text-2xl font-heading font-bold">
                {t("onboarding.childrenTitle", "Tell us about your children")}
              </h2>
              <p className="text-muted-foreground">
                {t("onboarding.childrenDesc", "This helps us suggest age-appropriate activities and playdates")}
              </p>
            </div>

            <div className="space-y-4">
              {children.map((_, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`children.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("onboarding.childName", "Child's name")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("onboarding.childNamePlaceholder", "Name")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`children.${index}.age`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>{t("onboarding.childAge", "Age")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="18"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {children.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeChild(index)}
                          className="mt-6"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addChild}
                className="w-full"
              >
                <i className="fas fa-plus mr-2"></i>
                {t("onboarding.addChild", "Add another child")}
              </Button>
            </div>
          </div>
        );

      case 4:
        const selectedInterests = form.watch("interests");
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-heading font-bold">
                {t("onboarding.interestsTitle", "What are your interests?")}
              </h2>
              <p className="text-muted-foreground">
                {t("onboarding.interestsDesc", "Select activities you enjoy so we can suggest relevant playdates and events")}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {interestOptions.map((interest) => (
                <Button
                  key={interest.id}
                  type="button"
                  variant={selectedInterests.includes(interest.id) ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => toggleInterest(interest.id)}
                >
                  <span className="text-2xl">{interest.icon}</span>
                  <span className="text-sm text-center">{interest.label}</span>
                </Button>
              ))}
            </div>

            {form.formState.errors.interests && (
              <p className="text-sm text-destructive text-center">
                {form.formState.errors.interests.message}
              </p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-3xl font-heading font-bold text-primary">
              {t("onboarding.completeTitle", "You're all set!")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {t("onboarding.completeDesc", "Your profile is ready! You can now start connecting with other dads and planning amazing activities for your family.")}
            </p>
            
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">
                {t("onboarding.nextSteps", "What's next?")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl">🏠</div>
                  <span>{t("onboarding.exploreHome", "Explore the home page")}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl">📅</div>
                  <span>{t("onboarding.createPlaydate", "Create your first playdate")}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl">📍</div>
                  <span>{t("onboarding.discoverPlaces", "Discover nearby places")}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-heading font-bold">
              {t("onboarding.setup", "Profile Setup")}
            </h1>
            <Badge variant="secondary">
              {currentStep} / {steps.length}
            </Badge>
          </div>
          
          <Progress value={progress} className="mb-4" />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  currentStep >= step.id ? "text-primary" : ""
                }`}
              >
                <span className="text-lg mb-1">{step.icon}</span>
                <span>{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {renderStepContent()}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            {t("onboarding.previous", "Previous")}
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={nextStep}>
              {t("onboarding.next", "Next")}
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          ) : (
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="bg-primary hover:bg-accent"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {t("onboarding.completing", "Completing...")}
                </>
              ) : (
                <>
                  {t("onboarding.complete", "Complete Setup")}
                  <i className="fas fa-check ml-2"></i>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}