import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useCanonical(customPath?: string) {
  const [location] = useLocation();
  const path = customPath || location;

  useEffect(() => {
    const canonicalUrl = `https://papa-hi.com${path}`;
    
    let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.setAttribute('rel', 'canonical');
      document.head.appendChild(linkElement);
    }
    
    linkElement.setAttribute('href', canonicalUrl);
    
    return () => {
      if (linkElement && linkElement.parentNode) {
        linkElement.parentNode.removeChild(linkElement);
      }
    };
  }, [path]);
}
