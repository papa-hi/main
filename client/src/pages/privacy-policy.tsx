import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Shield, Eye, Download, Edit } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('privacyPolicy.backToApp', 'Back to App')}
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('privacyPolicy.title', 'Privacy Policy')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('privacyPolicy.lastUpdated', { date: 'January 14, 2025' })}
        </p>
      </div>

      <div className="space-y-6">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('privacyPolicy.introduction', 'Introduction')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.introText', 'PaPa-Hi ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our family social networking platform.')}
            </p>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('privacyPolicy.dataCollection', 'Data We Collect')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.dataCollectionText', 'We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with other users.')}
            </p>
            
            <div>
              <h4 className="font-semibold mb-2">{t('privacyPolicy.personalInfo', 'Personal Information')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('privacyPolicy.personalInfoItems', 'Name, email address, profile photo, bio, city, and children\'s information (names and ages)')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t('privacyPolicy.usageData', 'Usage Data')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('privacyPolicy.usageDataItems', 'Information about how you use our service, including playdates created, places visited, and app interactions')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t('privacyPolicy.locationData', 'Location Data')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('privacyPolicy.locationDataItems', 'Approximate location to help you find nearby places and connect with local families')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {t('privacyPolicy.dataUse', 'How We Use Your Data')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.dataUseText', 'We use your information to provide and improve our services, including:')}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              {t('privacyPolicy.dataUseItems', 'Connecting you with other families, Suggesting nearby places and activities, Organizing playdates, Sending relevant notifications, Improving our platform').split(', ').map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('privacyPolicy.dataSharing', 'Data Sharing')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.dataSharingText', 'We do not sell, rent, or share your personal information with third parties except:')}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              {t('privacyPolicy.dataSharingItems', 'With your explicit consent, To comply with legal obligations, To protect our rights and safety').split(', ').map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacyPolicy.dataRetention', 'Data Retention')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.dataRetentionText', 'We retain your personal information for as long as your account is active or as needed to provide services. Chat messages are automatically deleted after 7 days.')}
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacyPolicy.yourRights', 'Your Rights')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.yourRightsText', 'Under GDPR, you have the right to:')}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              {t('privacyPolicy.rightsItems', 'Access your personal data, Correct inaccurate information, Delete your account and data, Export your data, Withdraw consent').split(', ').map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacyPolicy.dataSecurity', 'Data Security')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.dataSecurityText', 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.')}
            </p>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacyPolicy.cookies', 'Cookies')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.cookiesText', 'We use essential cookies to provide our service. You can manage your cookie preferences in your browser settings.')}
            </p>
          </CardContent>
        </Card>

        {/* Changes to This Policy */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacyPolicy.changes', 'Changes to This Policy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.changesText', 'We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.')}
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacyPolicy.contact', 'Contact Us')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('privacyPolicy.contactText', 'If you have any questions about this privacy policy, please contact us through the app\'s support features.')}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setLocation('/')} className="flex-1">
                {t('privacyPolicy.backToApp', 'Back to App')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}