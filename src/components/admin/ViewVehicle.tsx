import { ComponentType, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AdminVehicleSummary,
  AdminVehicleUpdatePayload,
  VehicleStatusCode,
  InsuranceStatusCode,
  RegistrationStatusCode,
  LoanStatusCode,
  fetchAdminFleetVehicle,
  updateAdminFleetVehicle
} from '../../services/admin';
import { AvailableDriver, getAvailableDrivers } from '../../services/matatus';
import { AdminLayout } from './AdminLayout';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Phone,
  Shield,
  User,
  Wallet,
  PiggyBank,
  ClipboardList
} from 'lucide-react';

interface ViewVehicleProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  vehicleId: string;
  LayoutComponent?: ComponentType<ViewVehicleLayoutProps>;
  currentPage?: string;
}

interface ViewVehicleLayoutProps {
  children: ReactNode;
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const vehicleStatusOptions: { value: VehicleStatusCode; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned' }
];

const insuranceStatusOptions: { value: InsuranceStatusCode; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXPIRED', label: 'Expired' }
];

const formatDate = (value: string | null | undefined): string => {
  if (!value) return 'Not available';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return 'KES 0.00';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(value);
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred. Please try again.';
};

const mergeDrivers = (
  drivers: AvailableDriver[],
  current?: { id: string; name: string; phone: string | null }
): AvailableDriver[] => {
  if (!current) return drivers;
  const exists = drivers.some(driver => driver.id === current.id);
  if (exists) return drivers;
  return [
    ...drivers,
    {
      id: current.id,
      name: current.name,
      phone: current.phone ?? ''
    }
  ];
};

const getStatusBadgeClass = (status: VehicleStatusCode) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'MAINTENANCE':
      return 'bg-yellow-100 text-yellow-800';
    case 'DECOMMISSIONED':
      return 'bg-red-100 text-red-800';
    case 'INACTIVE':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getInsuranceBadgeClass = (status: InsuranceStatusCode) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800';
    case 'PENDING':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRegistrationBadgeClass = (status: RegistrationStatusCode) => {
  switch (status) {
    case 'VALID':
      return 'bg-green-100 text-green-800';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800';
    case 'PENDING':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

const getLoanBadgeClass = (status: LoanStatusCode) => {
  switch (status) {
    case 'DISBURSED':
    case 'REPAID':
      return 'bg-green-100 text-green-800';
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800';
    case 'DEFAULTED':
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'PENDING':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export function ViewVehicle({
  user,
  onNavigate,
  onLogout,
  vehicleId,
  LayoutComponent = AdminLayout,
  currentPage = 'app/vehicles'
}: ViewVehicleProps) {
  const [vehicle, setVehicle] = useState<AdminVehicleSummary | null>(null);
  const [status, setStatus] = useState<VehicleStatusCode | null>(null);
  const [insuranceStatus, setInsuranceStatus] = useState<InsuranceStatusCode | null>(null);
  const [driverId, setDriverId] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);

  const loadDrivers = useCallback(
    async (currentDriver?: { id: string; name: string; phone: string | null }) => {
      setDriversLoading(true);
      setDriversError(null);
      try {
        const list = await getAvailableDrivers();
        setDrivers(mergeDrivers(list, currentDriver));
      } catch (err) {
        setDriversError(getErrorMessage(err));
        setDrivers(currentDriver ? mergeDrivers([], currentDriver) : []);
      } finally {
        setDriversLoading(false);
      }
    },
    []
  );

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) {
      setError('Vehicle identifier is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminFleetVehicle(vehicleId);
      setVehicle(data);
      setStatus(data.statusCode);
      setInsuranceStatus(data.insuranceStatusCode);
      setDriverId(data.driver?.id ?? 'none');
      await loadDrivers(data.driver ?? undefined);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [vehicleId, loadDrivers]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const driverOptions = useMemo(() => mergeDrivers(drivers, vehicle?.driver ?? undefined), [drivers, vehicle?.driver]);

  const isDirty = useMemo(() => {
    if (!vehicle || !status || !insuranceStatus) return false;
    const currentDriverId = vehicle.driver?.id ?? 'none';
    return (
      status !== vehicle.statusCode ||
      insuranceStatus !== vehicle.insuranceStatusCode ||
      driverId !== currentDriverId
    );
  }, [driverId, insuranceStatus, status, vehicle]);

  const handleSaveChanges = async () => {
    if (!vehicle || !status || !insuranceStatus) return;
    const payload: AdminVehicleUpdatePayload = {};

    if (status !== vehicle.statusCode) {
      payload.status = status;
    }
    if (insuranceStatus !== vehicle.insuranceStatusCode) {
      payload.insuranceStatus = insuranceStatus;
    }
    const currentDriverId = vehicle.driver?.id ?? 'none';
    if (driverId !== currentDriverId) {
      payload.driverId = driverId === 'none' ? null : driverId;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAdminFleetVehicle(vehicle.id, payload);
      setVehicle(updated);
      setStatus(updated.statusCode);
      setInsuranceStatus(updated.insuranceStatusCode);
      setDriverId(updated.driver?.id ?? 'none');
      await loadDrivers(updated.driver ?? undefined);
      toast.success('Vehicle details updated successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const savingsTotal =
    vehicle?.savingsAccounts.reduce((sum, account) => sum + (account.balance ?? 0), 0) ?? 0;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      );
    }

    if (error || !vehicle) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
          <p className="font-medium mb-3">{error ?? 'Vehicle not found.'}</p>
          <Button variant="outline" onClick={loadVehicle}>
            Try again
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-900">{vehicle.plateNumber}</CardTitle>
              <p className="text-sm text-gray-600">
                {[vehicle.model, vehicle.vehicleType].filter(Boolean).join(' • ') || 'Vehicle details'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getStatusBadgeClass(vehicle.statusCode)}>
                {vehicle.status}
              </Badge>
              <Badge variant="outline" className={getInsuranceBadgeClass(vehicle.insuranceStatusCode)}>
                {vehicle.insuranceStatus}
              </Badge>
              <Badge variant="outline" className={getRegistrationBadgeClass(vehicle.registrationStatusCode)}>
                {vehicle.registrationStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Route</p>
              {vehicle.route ? (
                <p className="font-medium text-gray-900">
                  {vehicle.route.name}
                  <span className="block text-sm text-gray-600">
                    {[vehicle.route.startPoint, vehicle.route.endPoint].filter(Boolean).join(' → ')}
                  </span>
                </p>
              ) : (
                <p className="text-gray-500 italic">No route assigned</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Registration Date</p>
              <p className="font-medium text-gray-900">{formatDate(vehicle.registrationDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Registration Expiry</p>
              <p className="font-medium text-gray-900">{formatDate(vehicle.registrationExpiry)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Capacity</p>
              <p className="font-medium text-gray-900">
                {vehicle.capacity != null ? `${vehicle.capacity} Passengers` : 'Not recorded'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Year of Manufacture</p>
              <p className="font-medium text-gray-900">
                {vehicle.yearOfManufacture ?? 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Chassis / Engine</p>
              <p className="font-medium text-gray-900">
                {[vehicle.chassisNumber, vehicle.engineNumber].filter(Boolean).join(' • ') || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Payment</p>
              {vehicle.lastPayment ? (
                <p className="font-medium text-gray-900">
                  {formatCurrency(vehicle.lastPayment.amount)} on {formatDate(vehicle.lastPayment.date)}
                </p>
              ) : (
                <p className="text-gray-500 italic">No recent payments</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Outstanding Loans</p>
              <p className="font-medium text-gray-900">
                {formatCurrency(vehicle.metrics.outstandingLoanAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Savings Balance</p>
              <p className="font-medium text-gray-900">{formatCurrency(vehicle.metrics.savingsBalance)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-gray-500" />
                Ownership & Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Owner</p>
                  {vehicle.owner ? (
                    <div className="font-medium text-gray-900">
                      <p>{vehicle.owner.name}</p>
                      {vehicle.owner.phone && (
                        <a className="flex items-center text-sm text-blue-600 hover:underline" href={`tel:${vehicle.owner.phone}`}>
                          <Phone className="mr-1 h-3.5 w-3.5" />
                          {vehicle.owner.phone}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No owner recorded</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned Driver</p>
                  {vehicle.driver ? (
                    <div className="font-medium text-gray-900">
                      <p>{vehicle.driver.name}</p>
                      {vehicle.driver.phone && (
                        <a className="flex items-center text-sm text-blue-600 hover:underline" href={`tel:${vehicle.driver.phone}`}>
                          <Phone className="mr-1 h-3.5 w-3.5" />
                          {vehicle.driver.phone}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Not assigned</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="vehicle-status">Operational Status</Label>
                  <Select
                    value={status ?? vehicle.statusCode}
                    onValueChange={value => setStatus(value as VehicleStatusCode)}
                    disabled={saving}
                  >
                    <SelectTrigger id="vehicle-status">
                      <SelectValue placeholder="Select vehicle status" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleStatusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="driver-select">Assigned Driver</Label>
                  <Select
                    value={driverId}
                    onValueChange={value => setDriverId(value)}
                    disabled={saving || driversLoading}
                  >
                    <SelectTrigger id="driver-select">
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {driverOptions.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} {driver.phone ? `(${driver.phone})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {driversLoading && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading available drivers…
                    </p>
                  )}
                  {driversError && <p className="text-xs text-red-600">{driversError}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-gray-500" />
                Insurance Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="font-medium text-gray-900">{vehicle.insuranceProvider ?? 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Policy Type</p>
                  <p className="font-medium text-gray-900">{vehicle.policyType ?? 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Policy Premium</p>
                  <p className="font-medium text-gray-900">{formatCurrency(vehicle.premium)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Insurance Expiry</p>
                  <p className="font-medium text-gray-900">{formatDate(vehicle.insuranceExpiry)}</p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Label htmlFor="insurance-status">Insurance Status</Label>
                <Select
                  value={insuranceStatus ?? vehicle.insuranceStatusCode}
                  onValueChange={value => setInsuranceStatus(value as InsuranceStatusCode)}
                  disabled={saving}
                >
                  <SelectTrigger id="insurance-status">
                    <SelectValue placeholder="Select insurance status" />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceStatusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-gray-500" />
              Financial Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total Savings</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(savingsTotal)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Active Loans</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {vehicle.metrics.activeLoanCount}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Outstanding Amount</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatCurrency(vehicle.metrics.outstandingLoanAmount)}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
                  <PiggyBank className="h-4 w-4" />
                  Savings Accounts
                </h3>
                <div className="mt-3 space-y-2">
                  {vehicle.savingsAccounts.length > 0 ? (
                    vehicle.savingsAccounts.map(account => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {account.accountType ?? 'General Savings'}
                          </p>
                          <p className="text-xs text-gray-500">{account.id}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(account.balance ?? 0)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No savings accounts linked to this vehicle.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
                  <ClipboardList className="h-4 w-4" />
                  Loans
                </h3>
                <div className="mt-3 space-y-2">
                  {vehicle.loans.length > 0 ? (
                    vehicle.loans.map(loan => (
                      <div
                        key={loan.id}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{loan.type}</p>
                          <Badge variant="outline" className={getLoanBadgeClass(loan.statusCode)}>
                            {loan.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{loan.id}</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">
                          {formatCurrency(loan.amount ?? 0)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No loans recorded for this vehicle.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={loadVehicle} disabled={saving || loading}>
            Reset
          </Button>
          <Button onClick={handleSaveChanges} disabled={!isDirty || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    );
  };

  return (
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Button variant="ghost" className="w-fit" onClick={() => onNavigate('app/vehicles')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Fleet
          </Button>
          {vehicle && !loading && (
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {vehicle.route?.name ?? 'No route'}
              </span>
            </div>
          )}
        </div>

        {renderContent()}
      </div>
    </LayoutComponent>
  );
}
