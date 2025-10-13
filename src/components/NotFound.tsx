import { Button } from './ui/button';

interface NotFoundProps {
  onNavigate: (page: string) => void;
}

export function NotFound({ onNavigate }: NotFoundProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Page not found
        </h1>
        <p className="mt-3 text-base text-gray-600 max-w-md">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
      </div>
      <Button onClick={() => onNavigate('home')} className="px-6">
        Go back home
      </Button>
    </div>
  );
}
