import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

type LoginFormValues = {
  username: string;
  password: string;
};

// Define the register form values type directly
type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  bio?: string;
  profileImage?: string;
  profileImageFile?: File;
  phoneNumber?: string;
  city?: string;
};

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
        username: z.string().min(1, t("auth:validation.usernameRequired", "Username is required")),
        password: z.string().min(1, t("auth:validation.passwordRequired", "Password is required")),
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
      phoneNumber: "",
      city: "",
    },
    resolver: zodResolver(
      z.object({
        username: z.string().min(1, t("auth:validation.usernameRequired", "Username is required")),
        email: z.string().email(t("auth:validation.invalidEmail", "Invalid email address")).min(1, t("auth:validation.emailRequired", "Email is required")),
        password: z.string().min(6, t("auth:validation.passwordLength", "Password must be at least 6 characters")),
        confirmPassword: z.string().min(1, t("auth:validation.confirmPasswordRequired", "Confirm password is required")),
        firstName: z.string().min(1, t("auth:validation.firstNameRequired", "First name is required")),
        lastName: z.string().min(1, t("auth:validation.lastNameRequired", "Last name is required")),
        bio: z.string().optional(),
        profileImage: z.string().optional(),
        profileImageFile: z.any().optional(),
        phoneNumber: z.string().optional(),
        city: z.string().optional(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: t("auth:validation.passwordsDoNotMatch", "Passwords don't match"),
        path: ["confirmPassword"],
      })
    ),
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    // Remove confirmPassword and profileImageFile as they're not part of the insertUserSchema
    const { confirmPassword, profileImageFile, ...userData } = data;
    
    try {
      // If there's a file upload, handle it first
      if (profileImageFile) {
        const formData = new FormData();
        formData.append('profileImage', profileImageFile);
        
        const response = await fetch('/api/upload/profile-image', {
          method: 'POST',
          body: formData
          // Don't set Content-Type header, it will be set automatically with boundary for FormData
        });
        
        if (response.ok) {
          const { imageUrl } = await response.json();
          // Set the profile image URL
          userData.profileImage = imageUrl;
        } else {
          throw new Error('Failed to upload profile image');
        }
      }
      
      // Register the user with the image URL if uploaded
      registerMutation.mutate(userData);
    } catch (error) {
      console.error('Error during registration:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Mobile hero section - Only visible on mobile at the top */}
      <div className="block lg:hidden w-full bg-gradient-to-b from-primary/5 to-background py-6 px-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center h-[40px] w-8 overflow-hidden rounded-[20px] mr-2 bg-white">
              <img 
                src="/images/papa-hi.png" 
                alt="PaPa-Hi Logo" 
                className="h-full w-full object-contain scale-150" 
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-['Varela_Round']">
              {t("auth:hero.title", "PaPa-Hi")}
            </h1>
          </div>
          <p className="text-xl font-medium mb-6 font-['Varela_Round']">
            {t("auth:hero.subtitle", "The social app for Dutch dads")}
          </p>
          <div className="space-y-4 text-left max-w-xs mx-auto">
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm shrink-0">1</div>
              <p className="text-base">
                {t("auth:hero.feature2", "Organize and find playdates for your kids")}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm shrink-0">2</div>
              <p className="text-base">
                {t("auth:hero.feature1", "Connect with other dads in your neighborhood")}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm shrink-0">3</div>
              <p className="text-base">
                {t("auth:hero.feature3", "Discover kids-friendly locations and activities")}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-primary/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center font-['Varela_Round']">
              {t("auth:welcome", "Welcome to PaPa-Hi")}
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
                            <AnimatedInput 
                              placeholder={t("auth:usernamePlaceholder", "Enter your username")} 
                              animateOnFocus={true}
                              animationStyle="glow"
                              highlightColor="rgba(var(--primary), 0.4)"
                              successIcon={Boolean(field.value)}
                              {...field} 
                            />
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
                            <AnimatedInput 
                              type="password" 
                              placeholder={t("auth:passwordPlaceholder", "Enter your password")} 
                              animateOnFocus={true}
                              animationStyle="border"
                              highlightColor="rgba(var(--primary), 0.7)"
                              successIcon={Boolean(field.value)}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <AnimatedButton 
                      type="submit" 
                      className="w-full" 
                      animation="ripple"
                      successAnimation={true}
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
                    </AnimatedButton>
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300"></span>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                          {t("auth:orContinueWith", "or continue with")}
                        </span>
                      </div>
                    </div>
                    
                    <GoogleSignInButton 
                      onSuccess={() => navigate("/")} 
                      className="mt-2" 
                    />
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
                              <AnimatedInput 
                                placeholder={t("auth:firstNamePlaceholder", "Your first name")}
                                animateOnFocus={true}
                                animationStyle="scale"
                                highlightColor="rgba(var(--primary), 0.3)"
                                successIcon={Boolean(field.value)}
                                {...field}
                              />
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
                              <AnimatedInput 
                                placeholder={t("auth:lastNamePlaceholder", "Your last name")}
                                animateOnFocus={true}
                                animationStyle="scale"
                                highlightColor="rgba(var(--primary), 0.3)"
                                successIcon={Boolean(field.value)}
                                {...field}
                              />
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
                            <AnimatedInput 
                              placeholder={t("auth:usernamePlaceholder", "Choose a username")} 
                              animateOnFocus={true}
                              successIcon={Boolean(field.value)}
                              {...field} 
                            />
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
                            <AnimatedInput 
                              placeholder={t("auth:emailPlaceholder", "Your email address")} 
                              animateOnFocus={true}
                              successIcon={Boolean(field.value && field.value.includes('@'))}
                              {...field} 
                            />
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
                            <AnimatedInput 
                              type="password" 
                              placeholder={t("auth:passwordPlaceholder", "Create a password")} 
                              animateOnFocus={true}
                              successIcon={Boolean(field.value && field.value.length >= 6)}
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth:phoneNumber", "Phone Number")}</FormLabel>
                            <FormControl>
                              <AnimatedInput 
                                placeholder={t("auth:phoneNumberPlaceholder", "Your phone number (optional)")} 
                                animateOnFocus={true}
                                successIcon={Boolean(field.value)}
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
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth:city", "City")}</FormLabel>
                            <FormControl>
                              <AnimatedInput 
                                placeholder={t("auth:cityPlaceholder", "Your city (optional)")} 
                                animateOnFocus={true}
                                successIcon={Boolean(field.value)}
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth:bio", "Bio")}</FormLabel>
                          <FormControl>
                            <AnimatedInput 
                              placeholder={t("auth:bioPlaceholder", "Tell us a bit about yourself (optional)")} 
                              animateOnFocus={true}
                              successIcon={Boolean(field.value)}
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
                      name="profileImageFile"
                      render={({ field }) => {
                        const [previewImage, setPreviewImage] = useState<string | null>(null);
                        const fileInputRef = useRef<HTMLInputElement>(null);
                        const { toast } = useToast();
                        
                        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 8 * 1024 * 1024) {
                              toast({
                                title: t("auth:errors.fileTooLarge", "File too large"),
                                description: t("auth:errors.fileSizeLimit", "Maximum file size is 8MB"),
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            if (!file.type.startsWith('image/')) {
                              toast({
                                title: t("auth:errors.invalidFileType", "Invalid file type"),
                                description: t("auth:errors.imageFilesOnly", "Only image files are allowed"),
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = () => {
                              setPreviewImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                            field.onChange(file);
                          }
                        };
                        
                        const clearFile = () => {
                          setPreviewImage(null);
                          field.onChange(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        };
                        
                        return (
                          <FormItem>
                            <FormLabel>{t("auth:profileImage", "Profile Image")}</FormLabel>
                            <div className="space-y-4">
                              {previewImage ? (
                                <div className="flex flex-col items-center gap-3">
                                  <Avatar className="h-24 w-24">
                                    <AvatarImage src={previewImage} alt="Profile preview" />
                                    <AvatarFallback>
                                      {registerForm.getValues("firstName")?.[0]}{registerForm.getValues("lastName")?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={clearFile}
                                    className="flex items-center gap-2"
                                  >
                                    <X className="h-4 w-4" />
                                    {t("common:remove", "Remove")}
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="relative">
                                    <Input 
                                      type="file" 
                                      accept="image/*"
                                      ref={fileInputRef}
                                      onChange={handleFileChange}
                                      className="hidden"
                                      id="profile-image-upload"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => fileInputRef.current?.click()}
                                      className="flex items-center gap-2"
                                    >
                                      <Upload className="h-4 w-4" />
                                      {t("auth:uploadProfileImage", "Upload Profile Image")}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <FormDescription>
                              {t("auth:profileImageHelp", "You can add a profile image here or update it later.")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="profileImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth:profileImageUrl", "Or use Profile Image URL (optional)")}</FormLabel>
                          <FormControl>
                            <AnimatedInput 
                              placeholder={t("auth:profileImagePlaceholder", "URL to your profile image")} 
                              animateOnFocus={true}
                              successIcon={Boolean(field.value)}
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <AnimatedButton 
                      type="submit" 
                      className="w-full" 
                      animation="ripple"
                      successAnimation={true}
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
                    </AnimatedButton>
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300"></span>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                          {t("auth:orContinueWith", "or continue with")}
                        </span>
                      </div>
                    </div>
                    
                    <GoogleSignInButton 
                      onSuccess={() => navigate("/")} 
                      className="mt-2" 
                    />
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
      

      
      {/* Desktop hero section - Only visible on desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-foreground to-background">
        <div className="w-full h-full flex flex-col justify-center p-12">
          <div className="max-w-lg">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center h-[72px] w-12 overflow-hidden rounded-[36px] mr-4 bg-white">
                <img 
                  src="/images/papa-hi.png" 
                  alt="PaPa-Hi Logo" 
                  className="h-full w-full object-contain scale-150" 
                />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-['Varela_Round']">
                {t("auth:hero.title", "PaPa-Hi")}
              </h1>
            </div>
            <p className="text-3xl font-medium mb-8 font-['Varela_Round']">
              {t("auth:hero.subtitle", "The social app for Dutch dads")}
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">1</div>
                <p className="text-lg">
                  {t("auth:hero.feature2", "Organize and find playdates for your kids")}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">2</div>
                <p className="text-lg">
                  {t("auth:hero.feature1", "Connect with other dads in your neighborhood")}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">3</div>
                <p className="text-lg">
                  {t("auth:hero.feature3", "Discover kids-friendly locations and activities")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}