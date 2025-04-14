import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  const { t } = useTranslation("errors");
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{t('notFound.title', '404 Page Not Found')}</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {t('notFound.message', 'The page you are looking for does not exist.')}
          </p>
          
          <div className="mt-6">
            <Link href="/">
              <Button>
                {t('notFound.backToHome', 'Back to Home')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
