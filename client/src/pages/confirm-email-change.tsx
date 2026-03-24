import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

type Status = "loading" | "success" | "already-used" | "expired" | "error";

export default function ConfirmEmailChangePage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const [newEmail, setNewEmail] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the link.");
      return;
    }

    fetch(`/api/user/confirm-email-change?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const body = await res.json();
        if (res.ok) {
          setNewEmail(body.newEmail ?? "");
          setStatus("success");
        } else if (res.status === 410) {
          setStatus(body.error?.includes("already been used") ? "already-used" : "expired");
          setErrorMsg(body.error ?? "");
        } else {
          setStatus("error");
          setErrorMsg(body.error ?? "Something went wrong.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Network error. Please try again.");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
            {status === "success" && <CheckCircle className="h-12 w-12 text-green-500" />}
            {(status === "already-used" || status === "expired" || status === "error") && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-xl">
            {status === "loading" && "Verifying your email…"}
            {status === "success" && "Email address updated!"}
            {status === "already-used" && "Link already used"}
            {status === "expired" && "Link expired"}
            {status === "error" && "Verification failed"}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <p className="text-muted-foreground text-sm">Please wait while we verify your request…</p>
          )}

          {status === "success" && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-1">
                  <Mail className="h-4 w-4" />
                  {newEmail}
                </div>
                <p className="text-sm text-green-600">
                  Your email address has been updated. A security notice has been sent to your previous address.
                </p>
              </div>
              <Button className="w-full" onClick={() => setLocation("/settings")}>
                Go to Settings
              </Button>
            </>
          )}

          {status === "already-used" && (
            <>
              <p className="text-sm text-muted-foreground">
                This verification link has already been used. Your email address was already updated.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setLocation("/settings")}>
                Go to Settings
              </Button>
            </>
          )}

          {status === "expired" && (
            <>
              <p className="text-sm text-muted-foreground">
                This link expired after 24 hours. Please go to Settings and request a new email change.
              </p>
              <Button className="w-full" onClick={() => setLocation("/settings")}>
                Back to Settings
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
                Go to Home
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
