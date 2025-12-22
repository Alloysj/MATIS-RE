import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Mail, Home } from 'lucide-react';

export function NoModulesAssigned({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-lg border border-gray-200 shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No modules assigned</h2>
          <p className="text-sm text-gray-600 mb-6">
            Your account does not have access to any modules yet. Contact your administrator to get access.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => onNavigate('home')}
              className="border-gray-300 text-gray-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
