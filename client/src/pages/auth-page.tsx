import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

type LoginFormValues = {
  username: string;
  password: string;
};

// Extend the insertUserSchema to add validation rules specific to registration
const registerFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const [_, navigate] = useLocation();
  const { t } = useTranslation(["auth", "common"]);
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    defaultValues: {
      username: "",
      password: "",
    },
    resolver: zodResolver(
      z.object({
        username: z.string().min(1, t("validation.usernameRequired", "Username is required")),
        password: z.string().min(1, t("validation.passwordRequired", "Password is required")),
      })
    ),
  });

  // Register form setup
  const registerForm = useForm<RegisterFormValues>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      bio: "",
      profileImage: "",
    },
    resolver: zodResolver(registerFormSchema),
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    // Remove confirmPassword as it's not part of the insertUserSchema
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-primary/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t("auth:welcome", "Welcome to Papa-Hi")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("auth:tagline", "Connect with fellow dads, find playdates, and discover family-friendly places")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">{t("auth:login", "Login")}</TabsTrigger>
                <TabsTrigger value="register">{t("auth:register", "Register")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth:username", "Username")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("auth:usernamePlaceholder", "Enter your username")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth:password", "Password")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder={t("auth:passwordPlaceholder", "Enter your password")} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("common:loading", "Loading...")}
                        </>
                      ) : (
                        t("auth:loginButton", "Login")
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth:firstName", "First Name")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("auth:firstNamePlaceholder", "Your first name")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth:lastName", "Last Name")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("auth:lastNamePlaceholder", "Your last name")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth:username", "Username")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("auth:usernamePlaceholder", "Choose a username")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth:email", "Email")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("auth:emailPlaceholder", "Your email address")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth:password", "Password")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder={t("auth:passwordPlaceholder", "Create a password")} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth:confirmPassword", "Confirm Password")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder={t("auth:confirmPasswordPlaceholder", "Confirm your password")} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth:bio", "Bio")}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("auth:bioPlaceholder", "Tell us a bit about yourself (optional)")} 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="profileImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth:profileImage", "Profile Image URL")}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("auth:profileImagePlaceholder", "URL to your profile image (optional)")} 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("auth:profileImageHelp", "You can add a profile image URL here or update it later.")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("common:loading", "Loading...")}
                        </>
                      ) : (
                        t("auth:registerButton", "Create Account")
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {activeTab === "login" 
                ? t("auth:noAccount", "Don't have an account?") 
                : t("auth:haveAccount", "Already have an account?")}
              {" "}
              <Button 
                variant="link" 
                className="p-0" 
                onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
              >
                {activeTab === "login" 
                  ? t("auth:registerLink", "Register here") 
                  : t("auth:loginLink", "Login here")}
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right side: Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-foreground to-background">
        <div className="w-full h-full flex flex-col justify-center p-12">
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {t("auth:hero.title", "Papa-Hi")}
            </h1>
            <p className="text-3xl font-medium mb-8">
              {t("auth:hero.subtitle", "The social app for Dutch dads")}
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">1</div>
                <p className="text-lg">
                  {t("auth:hero.feature1", "Connect with other dads in your neighborhood")}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">2</div>
                <p className="text-lg">
                  {t("auth:hero.feature2", "Find and organize playdates for your kids")}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">3</div>
                <p className="text-lg">
                  {t("auth:hero.feature3", "Discover family-friendly locations and activities")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}