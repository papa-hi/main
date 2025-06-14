import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Shield, Download, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

export default function DeleteAccountPage() {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasExportedData, setHasExportedData] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' })
  });

  const handleDataExport = async () => {
    try {
      const response = await fetch('/api/user/export-data', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `papa-hi-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setHasExportedData(true);
        toast({
          title: t('deleteAccount.exportSuccess', 'Data Export Complete'),
          description: t('deleteAccount.exportSuccessDesc', 'Your data has been downloaded. You can now proceed with account deletion if desired.')
        });
      }
    } catch (error) {
      toast({
        title: t('deleteAccount.exportError', 'Export Failed'),
        description: t('deleteAccount.exportErrorDesc', 'Unable to export your data. Please try again.'),
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE') {
      toast({
        title: t('deleteAccount.confirmError', 'Confirmation Required'),
        description: t('deleteAccount.confirmErrorDesc', 'Please type "DELETE" to confirm account deletion.'),
        variant: 'destructive'
      });
      return;
    }

    setIsDeleting(true);
    try {
      await apiRequest('/api/user/delete-account', {
        method: 'DELETE'
      });

      toast({
        title: t('deleteAccount.success', 'Account Deleted'),
        description: t('deleteAccount.successDesc', 'Your account and all associated data have been permanently deleted.')
      });

      // Redirect to home page after successful deletion
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      toast({
        title: t('deleteAccount.error', 'Deletion Failed'),
        description: t('deleteAccount.errorDesc', 'Unable to delete your account. Please contact support for assistance.'),
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p>{t('deleteAccount.notLoggedIn', 'You must be logged in to delete your account.')}</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              {t('deleteAccount.goToLogin', 'Go to Login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/settings')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('deleteAccount.backToSettings', 'Back to Settings')}
        </Button>
        
        <h1 className="text-2xl font-bold text-destructive">
          {t('deleteAccount.title', 'Delete Account')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('deleteAccount.subtitle', 'Permanently delete your PaPa-Hi account and all associated data')}
        </p>
      </div>

      {/* Warning Section */}
      <Card className="border-destructive/50 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {t('deleteAccount.warningTitle', 'Warning: This Action Cannot Be Undone')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>{t('deleteAccount.warningDesc1', 'Deleting your account will permanently remove:')}</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>{t('deleteAccount.warning1', 'Your profile and personal information')}</li>
              <li>{t('deleteAccount.warning2', 'All playdates you created or joined')}</li>
              <li>{t('deleteAccount.warning3', 'Places you added to the platform')}</li>
              <li>{t('deleteAccount.warning4', 'Chat messages and conversations')}</li>
              <li>{t('deleteAccount.warning5', 'Ratings and reviews you submitted')}</li>
              <li>{t('deleteAccount.warning6', 'Push notification subscriptions')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Data Export Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            {t('deleteAccount.exportTitle', 'Export Your Data First')}
          </CardTitle>
          <CardDescription>
            {t('deleteAccount.exportDesc', 'Before deleting your account, you can download a copy of all your data for your records.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={handleDataExport}
            className="w-full"
            disabled={hasExportedData}
          >
            <Download className="w-4 h-4 mr-2" />
            {hasExportedData 
              ? t('deleteAccount.dataExported', 'Data Exported ✓') 
              : t('deleteAccount.exportData', 'Export My Data')
            }
          </Button>
        </CardContent>
      </Card>

      {/* Account Deletion Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <Shield className="w-5 h-5 mr-2" />
            {t('deleteAccount.deleteTitle', 'Delete Account')}
          </CardTitle>
          <CardDescription>
            {t('deleteAccount.deleteDesc', 'To confirm account deletion, type "DELETE" in the field below.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('deleteAccount.confirmLabel', 'Type "DELETE" to confirm:')}
            </label>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
            />
          </div>
          
          <Separator />
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              className="flex-1"
            >
              {t('deleteAccount.cancel', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmationText !== 'DELETE' || isDeleting}
              className="flex-1"
            >
              {isDeleting 
                ? t('deleteAccount.deleting', 'Deleting...') 
                : t('deleteAccount.deleteButton', 'Delete Account')
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}