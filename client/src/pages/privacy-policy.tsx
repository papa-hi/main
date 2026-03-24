import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Shield, Eye, Download, Trash2, Edit, Baby, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";

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
          {t('common.back', 'Back')}
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('privacy.title', 'Privacy Policy')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('privacy.lastUpdated', 'Last updated: March 2026')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Data Controller */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('privacy.dataController.title', 'Data Controller')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">{t('privacy.dataController.company', 'PaPa-Hi B.V.')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('privacy.dataController.address', 'Haarlem, Netherlands')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('privacy.dataController.email', 'Email: papa@papa-hi.com')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data We Collect */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.dataCollection.title', 'Data We Collect')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">{t('privacy.dataCollection.personal', 'Personal Information')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>{t('privacy.dataCollection.name', 'Name and email address')}</li>
                <li>{t('privacy.dataCollection.profile', 'Profile information and photos')}</li>
                <li>{t('privacy.dataCollection.children', 'Children\'s information (names and ages)')}</li>
                <li>{t('privacy.dataCollection.location', 'Location data (when permitted)')}</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">{t('privacy.dataCollection.usage', 'Usage Data')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>{t('privacy.dataCollection.places', 'Places you visit and rate')}</li>
                <li>{t('privacy.dataCollection.playdates', 'Playdates you create or join')}</li>
                <li>{t('privacy.dataCollection.preferences', 'App preferences and settings')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Children's Data — Special Category */}
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-orange-500" />
              {t('privacy.children.title', "Children's Data — Heightened Protection")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-orange-800 mb-1">
                {t('privacy.children.sensitiveLabel', 'Special Category — GDPR Article 9')}
              </p>
              <p className="text-sm text-orange-700">
                {t('privacy.children.sensitiveDesc', "Information about children (names and ages) is treated as sensitive personal data and receives the highest level of protection we apply.")}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">{t('privacy.children.namesPrivate', "Children's Names Are Private")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('privacy.children.namesDesc', "A child's name is visible only to the parent who entered it. Other PaPa-Hi members see ages only — never names.")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">{t('privacy.children.noPublic', 'Never Shared Publicly')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('privacy.children.noPublicDesc', "Children's information is never included in any public-facing API or page. It is only accessible to authenticated, registered fathers.")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">{t('privacy.children.purpose', 'Limited Use')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('privacy.children.purposeDesc', "Ages are used solely to suggest compatible playdate matches between children of similar age. No data relating to children is used for advertising or shared with third parties.")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">{t('privacy.children.delete', 'Easy to Remove')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('privacy.children.deleteDesc', "You can edit or delete your children's information at any time from your profile. Deleting your account permanently removes all related data.")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Basis */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.legalBasis.title', 'Legal Basis for Processing')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">{t('privacy.legalBasis.consent', 'Consent')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('privacy.legalBasis.consentDesc', 'Location services, analytics, and marketing communications')}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">{t('privacy.legalBasis.contract', 'Contract Performance')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('privacy.legalBasis.contractDesc', 'Providing the PaPa-Hi service and managing your account')}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">{t('privacy.legalBasis.interest', 'Legitimate Interest')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('privacy.legalBasis.interestDesc', 'Improving our service and ensuring security')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.rights.title', 'Your Rights Under GDPR')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">{t('privacy.rights.access', 'Right to Access')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('privacy.rights.accessDesc', 'Request a copy of your personal data')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Edit className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">{t('privacy.rights.rectification', 'Right to Rectification')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('privacy.rights.rectificationDesc', 'Correct inaccurate personal data')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">{t('privacy.rights.erasure', 'Right to Erasure')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('privacy.rights.erasureDesc', 'Request deletion of your data')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">{t('privacy.rights.portability', 'Right to Portability')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('privacy.rights.portabilityDesc', 'Export your data in a standard format')}
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">{t('privacy.rights.exercise', 'How to Exercise Your Rights')}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t('privacy.rights.exerciseDesc', 'Contact us at papa@papa-hi.com or use the data management tools in your account settings.')}
              </p>
              <Button 
                size="sm" 
                onClick={() => setLocation('/settings')}
              >
                {t('privacy.rights.manageData', 'Manage My Data')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.retention.title', 'Data Retention')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm">{t('privacy.retention.account', 'Account Data')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('privacy.retention.accountDesc', 'Retained while your account is active and for 2 years after deletion for legal compliance')}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">{t('privacy.retention.location', 'Location Data')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('privacy.retention.locationDesc', 'Processed in real-time and not stored unless you save specific places')}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">{t('privacy.retention.analytics', 'Analytics Data')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('privacy.retention.analyticsDesc', 'Aggregated and anonymized data retained for 26 months')}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">{t('privacy.retention.chat', 'Chat Messages')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('privacy.retention.chatDesc', 'Messages are automatically deleted after 7 days for privacy protection')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('privacy.contact.title', 'Contact & Complaints')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('privacy.contact.desc', 'For any privacy-related questions or to exercise your rights:')}
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium">Data Protection Officer</p>
                <p className="text-sm text-muted-foreground">papa@papa-hi.com</p>
                <p className="text-sm text-muted-foreground">Response time: 30 days maximum</p>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('privacy.contact.authority', 'You have the right to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens) if you believe your privacy rights have been violated.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}