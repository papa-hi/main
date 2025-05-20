import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronLeft, ShieldAlert, Shield, LogIn } from "lucide-react";

export default function AdminCheck() {
  const { user, isLoading } = useAuth();
  const [adminApiStatus, setAdminApiStatus] = useState<string>("checking");
  
  useEffect(() => {
    if (user && user.role === 'admin') {
      // Try to call an admin API to verify server-side admin access
      fetch('/api/admin/users')
        .then(response => {
          if (response.ok) {
            setAdminApiStatus("success");
          } else {
            setAdminApiStatus("error");
          }
        })
        .catch(error => {
          console.error("Admin API check failed", error);
          setAdminApiStatus("error");
        });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Checking Admin Access</CardTitle>
            <CardDescription>Please wait while we verify your permissions...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Not Authenticated
            </CardTitle>
            <CardDescription>You need to log in to access admin features</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please log in with an admin account to access the admin dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/" className="flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild>
              <Link href="/auth" className="flex items-center gap-1">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Insufficient Permissions
            </CardTitle>
            <CardDescription>Your account doesn't have admin privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Admin Access Required</AlertTitle>
              <AlertDescription>
                Your current account ({user.username}) doesn't have admin permissions.
                Please log in with an admin account to access the admin dashboard.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <strong>Current user info:</strong>
              <pre className="bg-muted p-2 rounded-md mt-2 text-xs overflow-auto">
                {JSON.stringify({
                  id: user.id,
                  username: user.username,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  role: user.role || 'user'
                }, null, 2)}
              </pre>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/" className="flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => window.location.href = "/api/logout"}>
              Logout
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Admin Access Verified
          </CardTitle>
          <CardDescription>You have admin privileges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <strong>Current user info:</strong>
            <pre className="bg-muted p-2 rounded-md mt-2 text-xs overflow-auto">
              {JSON.stringify({
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role || 'user'
              }, null, 2)}
            </pre>
          </div>
          
          <div className="mb-4">
            <strong>Admin API Status:</strong> 
            {adminApiStatus === "checking" && <span className="text-amber-500"> Checking...</span>}
            {adminApiStatus === "success" && <span className="text-green-500"> Success! ✓</span>}
            {adminApiStatus === "error" && <span className="text-red-500"> Error! Your session may not be properly authorized on the server.</span>}
          </div>
          
          {adminApiStatus === "error" && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>API Access Error</AlertTitle>
              <AlertDescription>
                Although your user account has admin privileges, the API is returning unauthorized errors.
                Try logging out and logging in again, or clearing your cookies.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          {adminApiStatus === "success" ? (
            <Button asChild>
              <Link href="/admin" className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Go to Admin Dashboard
              </Link>
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => window.location.href = "/api/logout"}>
              Logout & Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}