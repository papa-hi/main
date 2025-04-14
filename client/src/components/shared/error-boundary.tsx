import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// This component has to be a class component because it uses lifecycle methods
class ErrorBoundaryClass extends Component<Props & { t: Function }, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  public render() {
    const { hasError } = this.state;
    const { children, fallback, t } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <Card className="mx-auto my-8 max-w-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <h2 className="text-xl font-semibold">
                {t('errors:generic.title', 'Something went wrong')}
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              {t('errors:generic.message', 'An error occurred. Please try again later.')}
            </p>
            <Button 
              onClick={() => this.setState({ hasError: false })}
            >
              {t('errors:generic.retry', 'Retry')}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return children;
  }
}

// Wrapper component to provide translation function
export default function ErrorBoundary(props: Props) {
  const { t } = useTranslation('errors');
  return <ErrorBoundaryClass {...props} t={t} />;
}