import { useTranslation } from 'react-i18next';
import { PlaygroundHeatmap } from '@/components/maps/playground-heatmap';
import { useEffect } from 'react';

export default function PlaygroundMapPage() {
  const { t } = useTranslation();
  
  // Ensure leaflet CSS is properly loaded
  useEffect(() => {
    // Add leaflet CSS if not already present
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">
          {t('playgroundMap.title', 'Playground Map')}
        </h1>
        <p className="text-muted-foreground">
          {t('playgroundMap.description', 'Discover playgrounds and their popularity in your area')}
        </p>
      </div>
      
      <PlaygroundHeatmap className="mb-8" />
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-bold mb-4">
            {t('playgroundMap.aboutHeatmap', 'About the Heatmap')}
          </h2>
          <div className="space-y-4">
            <p>
              {t('playgroundMap.heatmapExplanation', 
                'The playground heatmap shows areas with high concentrations of playgrounds. ' +
                'Red areas indicate more playgrounds close together, while blue areas have fewer playgrounds.')}
            </p>
            <p>
              {t('playgroundMap.heatmapUsage', 
                'Use this map to find areas with many playgrounds, which are ideal for planning playdates ' +
                'with multiple options nearby.')}
            </p>
            <div className="flex items-center space-x-2 mt-4">
              <div className="h-4 w-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">{t('playgroundMap.lowDensity', 'Lower density')}</span>
              <div className="h-4 w-4 rounded-full bg-lime-500 ml-4"></div>
              <span className="text-sm">{t('playgroundMap.mediumDensity', 'Medium density')}</span>
              <div className="h-4 w-4 rounded-full bg-red-500 ml-4"></div>
              <span className="text-sm">{t('playgroundMap.highDensity', 'Higher density')}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-bold mb-4">
            {t('playgroundMap.contributeTitle', 'Contribute to the Community')}
          </h2>
          <div className="space-y-4">
            <p>
              {t('playgroundMap.contributeExplanation', 
                'Our playground data comes from both OpenStreetMap and community contributions. ' +
                'Help other parents by adding playgrounds you know about.')}
            </p>
            <p>
              {t('playgroundMap.contributeHowTo', 
                'To add a playground, click the "Add Playground" button in the map and select the exact location. ' +
                'Fill in the details like name and description to help other parents find great playgrounds.')}
            </p>
            <p className="text-sm text-muted-foreground italic">
              {t('playgroundMap.contributeNote', 
                'Note: You need to be logged in to contribute. All contributions are reviewed for quality.')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-bold mb-4">
            {t('playgroundMap.tips', 'Tips for Finding Great Playgrounds')}
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {t('playgroundMap.tip1', 'Look for playgrounds in red areas for more options in close proximity')}
            </li>
            <li>
              {t('playgroundMap.tip2', 'Click on a playground marker to see details and get directions')}
            </li>
            <li>
              {t('playgroundMap.tip3', 'Use your current location to find playgrounds near you')}
            </li>
            <li>
              {t('playgroundMap.tip4', 'Arrange playdates at playgrounds with multiple options nearby in case one is too crowded')}
            </li>
          </ul>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-bold mb-4">
            {t('playgroundMap.dataSourcesTitle', 'Data Sources')}
          </h2>
          <div className="space-y-4">
            <p>
              {t('playgroundMap.osmSource', 
                'Playground data is sourced from OpenStreetMap, a collaborative mapping project. ' +
                'This provides us with up-to-date information about publicly known playgrounds.')}
            </p>
            <p>
              {t('playgroundMap.userSource', 
                'Additional playground data comes from our community of users who contribute ' +
                'playgrounds they know about that might not be on public maps yet.')}
            </p>
            <p className="text-sm text-muted-foreground">
              <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                OpenStreetMap © OpenStreetMap contributors
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}