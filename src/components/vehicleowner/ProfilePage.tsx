import { useEffect, useMemo, useState } from 'react';
import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { fetchUserProfile, updateUserProfile, type UserProfile, type UserProfileUpdate } from '../../services/users';
import { Mail, Phone, MapPin, User, Shield, Users as UsersIcon } from 'lucide-react';

interface ProfilePageProps {
  user: { id?: string; name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'KES 0';
  return `KES ${value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
};

const editableFields: Array<{
  key: keyof UserProfileUpdate;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel';
}> = [
  { key: 'email', label: 'Email address', placeholder: 'you@example.com', type: 'email' },
  { key: 'phone', label: 'Phone number', placeholder: '+2547...' },
  { key: 'address', label: 'Postal address', placeholder: 'P.O. Box ...' },
  { key: 'county', label: 'County', placeholder: 'Nairobi' },
  { key: 'town', label: 'Town / Estate', placeholder: 'Westlands' },
  { key: 'occupation', label: 'Occupation', placeholder: 'Transport operator' },
  { key: 'nextOfKin', label: 'Next of kin', placeholder: 'Relative name' },
  { key: 'nextOfKinPhone', label: 'Next of kin phone', placeholder: '+2547...' }
];

export function ProfilePage({ user, onNavigate, onLogout }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formState, setFormState] = useState<UserProfileUpdate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const details = await fetchUserProfile();
        setProfile(details);
        setFormState({
          email: details.email,
          phone: details.phone ?? '',
          address: details.address ?? '',
          county: details.county ?? '',
          town: details.town ?? '',
          occupation: details.occupation ?? '',
          nextOfKin: details.nextOfKin ?? '',
          nextOfKinPhone: details.nextOfKinPhone ?? ''
        });
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fullName = useMemo(() => {
    if (!profile) return user?.name ?? '';
    const composed = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
    return composed || user?.name || profile.email;
  }, [profile, user?.name]);

  const riskCoverage = useMemo(() => {
    if (!profile?.savingsBalance || profile.savingsBalance <= 0) return null;
    const ratio = ((profile.loanBalance ?? 0) / profile.savingsBalance) * 100;
    return Math.min(Math.max(ratio, 0), 999);
  }, [profile?.loanBalance, profile?.savingsBalance]);

  const handleChange = (key: keyof UserProfileUpdate, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile?.id) return;
    try {
      setSaving(true);
      setSuccess(null);
      setError(null);
      const payload: UserProfileUpdate = {};
      Object.entries(formState).forEach(([k, v]) => {
        payload[k as keyof UserProfileUpdate] = v === '' ? null : v;
      });
      const updated = await updateUserProfile(profile.id, payload);
      setProfile(updated);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <VehicleOwnerLayout currentPage="users/profile" user={user} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-white/70">
            Review and update your personal information. Accurate details help the SACCO keep in touch.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-100">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/30 bg-green-500/10 text-green-100">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-xl">
                <User className="w-5 h-5 mr-2 text-[var(--neon-turquoise)]" />
                Member overview
              </CardTitle>
              <CardDescription className="text-white/70">Core account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/80">
              <div className="flex justify-between">
                <span>Name</span>
                <span className="text-white font-semibold">{fullName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Member number</span>
                <span>{profile?.memberNumber ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status</span>
                <Badge className="bg-white/10 border-white/20 text-white/80 uppercase">
                  {profile?.status ?? 'Unknown'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Joined</span>
                <span>{formatDate(profile?.registrationDate)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-xl">
                <Shield className="w-5 h-5 mr-2 text-[var(--neon-yellow)]" />
                Financial snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/80">
              <div className="flex justify-between">
                <span>Share capital</span>
                <span className="text-[var(--neon-turquoise)] font-semibold">{formatCurrency(profile?.shareCapital)}</span>
              </div>
              <div className="flex justify-between">
                <span>Savings balance</span>
                <span className="text-[var(--neon-turquoise)] font-semibold">{formatCurrency(profile?.savingsBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding loans</span>
                <span className="text-[var(--neon-orange)] font-semibold">{formatCurrency(profile?.loanBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total deposits</span>
                <span>{formatCurrency(profile?.totalDeposits)}</span>
              </div>
              {riskCoverage !== null && (
                <div className="flex justify-between">
                  <span>Loan coverage</span>
                  <span>{Math.round(riskCoverage)}% of savings</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-xl">Contact information</CardTitle>
            <CardDescription className="text-white/70">Keep your contact details up to date.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-white/60">Loading profile…</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {editableFields.map(({ key, label, placeholder, type }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-white/90">{label}</Label>
                      <Input
                        type={type ?? 'text'}
                        value={(formState[key] as string | null | undefined) ?? ''}
                        onChange={(event) => handleChange(key, event.target.value)}
                        placeholder={placeholder}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving} className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-slate-900">
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Mail className="w-4 h-4 text-[var(--neon-turquoise)]" />
                Primary contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--neon-turquoise)]" />
                <span>{profile?.email ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--neon-turquoise)]" />
                <span>{profile?.phone ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--neon-turquoise)]" />
                <span>{profile?.address ?? '—'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <UsersIcon className="w-4 h-4 text-[var(--neon-yellow)]" />
                Next of kin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--neon-yellow)]" />
                <span>{profile?.nextOfKin ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--neon-yellow)]" />
                <span>{profile?.nextOfKinPhone ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--neon-yellow)]" />
                <span>Joined: {formatDate(profile?.registrationDate)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">Need to update more information?</h3>
              <p className="text-white/70 text-sm">Contact the SACCO office for membership or vehicle ownership changes.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => onNavigate('contact')}
              className="border-[var(--neon-turquoise)]/40 text-[var(--neon-turquoise)] hover:bg-[var(--neon-turquoise)]/10"
            >
              Reach support
            </Button>
          </CardContent>
        </Card>
      </div>
    </VehicleOwnerLayout>
  );
}
