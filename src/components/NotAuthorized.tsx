import { Button } from './ui/button';
import { Shield, Home } from 'lucide-react';

export function NotAuthorized({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
          <Shield className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Not Authorized</h2>
        <p className="text-white/70 mb-6">
          You do not have permission to access this page.
        </p>
        <Button
          onClick={() => onNavigate('app/vehicles')}
          className="w-full bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-slate-900 hover:opacity-90"
        >
          Go to App
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate('home')}
          className="w-full mt-3 border-white/30 text-white hover:bg-white/10"
        >
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>
    </div>
  );
}
