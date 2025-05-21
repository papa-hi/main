import { useLocation } from 'wouter';
import { useMemo } from 'react';

export function useSearchParams() {
  const [location] = useLocation();
  
  const searchParams = useMemo(() => {
    const queryString = location.split('?')[1] || '';
    return new URLSearchParams(queryString);
  }, [location]);
  
  return searchParams;
}