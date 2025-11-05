import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Car,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  MapPin,
  Plus,
  Eye,
  UserPlus,
  Download,
  Loader2,
  ExternalLink
} from 'lucide-react';
import {
  AdminVehicleSummary,
  fetchAdminFleetVehicles,
  createAdminFleetVehicle,
  updateAdminFleetVehicle,
  deleteAdminFleetVehicle,
  assignDriverToVehicle,
  recordVehicleInsurancePayment,
  VehicleStatusCode,
  RegistrationStatusCode,
  InsuranceStatusCode,
  AdminVehicleCreatePayload,
  AdminVehicleUpdatePayload,
  AdminInsurancePaymentRequest,
  fetchAdminRoutes,
  AdminRoute,
  getCachedAdminFleetVehicles,
  getCachedAdminRoutes
} from '../../services/admin';
import { AvailableDriver, getAvailableDrivers } from '../../services/matatus';

interface FleetManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

type VehicleFormMode = 'create' | 'edit';

type DriverOption = AvailableDriver;

type NullableId = string | null;

interface VehicleFormState {
  ownerId: string;
  plateNumber: string;
  model: string;
  vehicleType: string;
  yearOfManufacture: string;
  routeId: string;
  driverId: string;
  statusCode: VehicleStatusCode;
  registrationStatusCode: RegistrationStatusCode;
  insuranceStatusCode: InsuranceStatusCode;
  insuranceProvider: string;
  policyType: string;
  insuranceExpiry: string;
  registrationExpiry: string;
  premium: string;
}

interface InsuranceFormState {
  amount: string;
  paymentDate: string;
  startDate: string;
  expiryDate: string;
  provider: string;
  policyType: string;
  mpesaReference: string;
}

const vehicleStatusOptions: { value: VehicleStatusCode; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned' }
];

const registrationStatusOptions: { value: RegistrationStatusCode; label: string }[] = [
  { value: 'VALID', label: 'Valid' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'PENDING', label: 'Pending' }
];

const insuranceStatusOptions: { value: InsuranceStatusCode; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'PENDING', label: 'Pending' }
];

const initialVehicleForm = (): VehicleFormState => ({
  ownerId: '',
  plateNumber: '',
  model: '',
  vehicleType: '',
  yearOfManufacture: '',
  routeId: 'none',
  driverId: 'none',
  statusCode: 'INACTIVE',
  registrationStatusCode: 'PENDING',
  insuranceStatusCode: 'PENDING',
  insuranceProvider: '',
  policyType: '',
  insuranceExpiry: '',
  registrationExpiry: '',
  premium: ''
});

const initialInsuranceForm = (): InsuranceFormState => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    amount: '',
    paymentDate: today,
    startDate: today,
    expiryDate: '',
    provider: '',
    policyType: '',
    mpesaReference: ''
  };
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

const mergeDrivers = (
  drivers: AvailableDriver[],
  current?: { id: string; name: string; phone: string | null }
): DriverOption[] => {
  if (!current) {
    return drivers;
  }
  const exists = drivers.some(driver => driver.id === current.id);
  if (exists) {
    return drivers;
  }
  return [
    {
      id: current.id,
      name: current.name,
      phone: current.phone ?? ''
    },
    ...drivers
  ];
};

const routeToOption = (route: AdminRoute) => ({
  id: route.id,
  name: route.name
});
export function FleetManagement({ user, onNavigate, onLogout }: FleetManagementProps) {
  const [vehicles, setVehicles] = useState<AdminVehicleSummary[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState<boolean>(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [routes, setRoutes] = useState<AdminRoute[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [vehicleForAssignment, setVehicleForAssignment] = useState<AdminVehicleSummary | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('none');
  const [assigningDriver, setAssigningDriver] = useState(false);

  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [vehicleFormMode, setVehicleFormMode] = useState<VehicleFormMode>('create');
  const [vehicleFormValues, setVehicleFormValues] = useState<VehicleFormState>(initialVehicleForm());
  const [vehicleBeingEdited, setVehicleBeingEdited] = useState<AdminVehicleSummary | null>(null);
  const [vehicleFormSubmitting, setVehicleFormSubmitting] = useState(false);

  const [insuranceDialogOpen, setInsuranceDialogOpen] = useState(false);
  const [vehicleForInsurance, setVehicleForInsurance] = useState<AdminVehicleSummary | null>(null);
  const [insuranceFormValues, setInsuranceFormValues] = useState<InsuranceFormState>(initialInsuranceForm());
  const [insuranceSubmitting, setInsuranceSubmitting] = useState(false);

  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    setVehiclesError(null);
    try {
      const response = await fetchAdminFleetVehicles();
      setVehicles(response.items);
    } catch (error) {
      setVehiclesError(getErrorMessage(error));
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  const loadDrivers = useCallback(async () => {
    try {
      const list = await getAvailableDrivers();
      setDrivers(list);
    } catch (error) {
      toast.error('Failed to load drivers: ' + getErrorMessage(error));
    }
  }, []);

  const loadRoutes = useCallback(async () => {
    try {
      const list = await fetchAdminRoutes();
      setRoutes(list);
    } catch (error) {
      toast.error('Failed to load routes: ' + getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    loadVehicles();
    loadDrivers();
    loadRoutes();
  }, [loadVehicles, loadDrivers, loadRoutes]);

  const filteredVehicles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return vehicles;
    }
    return vehicles.filter(vehicle => {
      const ownerName = vehicle.owner?.name?.toLowerCase() ?? '';
      const driverName = vehicle.driver?.name?.toLowerCase() ?? '';
      const routeName = vehicle.route?.name?.toLowerCase() ?? '';
      const model = vehicle.model?.toLowerCase() ?? '';
      return (
        vehicle.plateNumber.toLowerCase().includes(term) ||
        ownerName.includes(term) ||
        driverName.includes(term) ||
        routeName.includes(term) ||
        model.includes(term)
      );
    });
  }, [vehicles, searchTerm]);

  const totalVehicles = vehicles.length;
  const activeCount = vehicles.filter(vehicle => vehicle.statusCode === 'ACTIVE').length;
  const pendingComplianceCount = vehicles.filter(
    vehicle => vehicle.registrationStatusCode === 'PENDING' || vehicle.insuranceStatusCode === 'PENDING'
  ).length;
  const expiredInsuranceCount = vehicles.filter(vehicle => vehicle.insuranceStatusCode === 'EXPIRED').length;

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
        return 'bg-yellow-100 text-yellow-800';
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

  const routeOptionsForForm = useMemo(() => {
    const options = routes.map(routeToOption);
    if (vehicleBeingEdited?.route) {
      const exists = options.some(route => route.id === vehicleBeingEdited.route?.id);
      if (!exists) {
        options.unshift({
          id: vehicleBeingEdited.route.id,
          name: vehicleBeingEdited.route.name
        });
      }
    }
    return options;
  }, [routes, vehicleBeingEdited]);

  const driverOptionsForAssignment = useMemo(
    () => mergeDrivers(drivers, vehicleForAssignment?.driver ?? undefined),
    [drivers, vehicleForAssignment]
  );

  const driverOptionsForForm = useMemo(
    () => mergeDrivers(drivers, vehicleBeingEdited?.driver ?? undefined),
    [drivers, vehicleBeingEdited]
  );
  const closeAssignDialog = () => {
    setAssignDialogOpen(false);
    setVehicleForAssignment(null);
    setSelectedDriverId('none');
    setAssigningDriver(false);
  };

  const closeVehicleForm = () => {
    setVehicleFormOpen(false);
    setVehicleBeingEdited(null);
    setVehicleFormValues(initialVehicleForm());
    setVehicleFormMode('create');
    setVehicleFormSubmitting(false);
  };

  const closeInsuranceDialog = () => {
    setInsuranceDialogOpen(false);
    setVehicleForInsurance(null);
    setInsuranceFormValues(initialInsuranceForm());
    setInsuranceSubmitting(false);
  };

  const handleAssignDriver = (vehicle: AdminVehicleSummary) => {
    setVehicleForAssignment(vehicle);
    setSelectedDriverId(vehicle.driver?.id ?? 'none');
    setAssignDialogOpen(true);
  };

  const handleAssignmentSave = async () => {
    if (!vehicleForAssignment) {
      return;
    }
    try {
      setAssigningDriver(true);
      if (selectedDriverId === 'none') {
        await updateAdminFleetVehicle(vehicleForAssignment.id, { driverId: null });
        toast.success('Driver unassigned from ' + vehicleForAssignment.plateNumber);
      } else {
        await assignDriverToVehicle(vehicleForAssignment.id, {
          driverId: selectedDriverId
        });
        toast.success('Driver assigned to ' + vehicleForAssignment.plateNumber);
      }
      closeAssignDialog();
      await loadVehicles();
      await loadDrivers();
    } catch (error) {
      toast.error('Failed to update driver assignment: ' + getErrorMessage(error));
    } finally {
      setAssigningDriver(false);
    }
  };

  const handleViewOwner = (ownerId: NullableId) => {
    if (!ownerId) {
      toast.error('Owner information is not available for this vehicle.');
      return;
    }
    onNavigate('admin/users/user_profile/' + ownerId);
  };

  const handleDeleteVehicle = async (vehicle: AdminVehicleSummary) => {
    const confirmed = window.confirm('Are you sure you want to delete vehicle ' + vehicle.plateNumber + '? This action cannot be undone.');
    if (!confirmed) {
      return;
    }
    try {
      await deleteAdminFleetVehicle(vehicle.id);
      toast.success('Vehicle ' + vehicle.plateNumber + ' deleted');
      await loadVehicles();
    } catch (error) {
      toast.error('Failed to delete vehicle: ' + getErrorMessage(error));
    }
  };

  const handleOpenVehicleForm = (mode: VehicleFormMode, vehicle?: AdminVehicleSummary) => {
    setVehicleFormMode(mode);
    if (mode === 'edit' && vehicle) {
      setVehicleBeingEdited(vehicle);
      setVehicleFormValues({
        ownerId: vehicle.owner?.id ?? '',
        plateNumber: vehicle.plateNumber,
        model: vehicle.model ?? '',
        vehicleType: vehicle.vehicleType ?? '',
        yearOfManufacture: vehicle.yearOfManufacture ? String(vehicle.yearOfManufacture) : '',
        routeId: vehicle.route?.id ?? 'none',
        driverId: vehicle.driver?.id ?? 'keep',
        statusCode: vehicle.statusCode,
        registrationStatusCode: vehicle.registrationStatusCode,
        insuranceStatusCode: vehicle.insuranceStatusCode,
        insuranceProvider: vehicle.insuranceStatusCode === 'ACTIVE' ? vehicle.insuranceStatus : '',
        policyType: vehicle.insuranceStatusCode === 'ACTIVE' ? vehicle.insuranceStatus : '',
        insuranceExpiry: '',
        registrationExpiry: '',
        premium: ''
      });
    } else {
      setVehicleBeingEdited(null);
      setVehicleFormValues(initialVehicleForm());
    }
    setVehicleFormOpen(true);
  };

  const normalizeOptionalString = (value: string): string | undefined => {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  };

  const normalizeOptionalNumber = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const normalizeOptionalDate = (value: string): string | undefined => {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  };

  const handleVehicleFormSubmit = async () => {
    const ownerId = vehicleFormValues.ownerId.trim();
    const plateNumber = vehicleFormValues.plateNumber.trim();

    if (!ownerId || !plateNumber) {
      toast.error('Owner ID and plate number are required.');
      return;
    }

    const basePayload: AdminVehicleCreatePayload = {
      ownerId,
      plateNumber,
      model: normalizeOptionalString(vehicleFormValues.model),
      vehicleType: normalizeOptionalString(vehicleFormValues.vehicleType),
      yearOfManufacture: normalizeOptionalNumber(vehicleFormValues.yearOfManufacture),
      routeId: vehicleFormValues.routeId === 'none' ? undefined : vehicleFormValues.routeId,
      status: vehicleFormValues.statusCode,
      registrationStatus: vehicleFormValues.registrationStatusCode,
      insuranceStatus: vehicleFormValues.insuranceStatusCode,
      insuranceProvider: normalizeOptionalString(vehicleFormValues.insuranceProvider),
      policyType: normalizeOptionalString(vehicleFormValues.policyType),
      insuranceExpiry: normalizeOptionalDate(vehicleFormValues.insuranceExpiry),
      registrationExpiry: normalizeOptionalDate(vehicleFormValues.registrationExpiry),
      premium: normalizeOptionalNumber(vehicleFormValues.premium)
    };

    const driverSelection = vehicleFormValues.driverId;
    const driverForCreate = driverSelection === 'none' || driverSelection === 'keep' ? undefined : driverSelection;
    const driverForUpdate = driverSelection === 'keep' ? undefined : driverSelection === 'none' ? null : driverSelection;

    try {
      setVehicleFormSubmitting(true);
      if (vehicleFormMode === 'create') {
        const payload: AdminVehicleCreatePayload = {
          ...basePayload,
          driverId: driverForCreate
        };
        const created = await createAdminFleetVehicle(payload);
        toast.success('Vehicle ' + created.plateNumber + ' created successfully');
      } else if (vehicleBeingEdited) {
        const payload: AdminVehicleUpdatePayload = {
          ...basePayload,
          driverId: driverForUpdate
        };

        if (vehicleFormValues.model.trim() === '') payload.model = null;
        if (vehicleFormValues.vehicleType.trim() === '') payload.vehicleType = null;
        if (vehicleFormValues.yearOfManufacture.trim() === '') payload.yearOfManufacture = null;
        if (vehicleFormValues.routeId === 'none') payload.routeId = null;
        if (vehicleFormValues.insuranceProvider.trim() === '') payload.insuranceProvider = null;
        if (vehicleFormValues.policyType.trim() === '') payload.policyType = null;
        if (vehicleFormValues.insuranceExpiry.trim() === '') payload.insuranceExpiry = null;
        if (vehicleFormValues.registrationExpiry.trim() === '') payload.registrationExpiry = null;
        if (vehicleFormValues.premium.trim() === '') payload.premium = null;

        const updated = await updateAdminFleetVehicle(vehicleBeingEdited.id, payload);
        toast.success('Vehicle ' + updated.plateNumber + ' updated successfully');
      }
      closeVehicleForm();
      await loadVehicles();
      await loadDrivers();
    } catch (error) {
      toast.error('Failed to save vehicle: ' + getErrorMessage(error));
    } finally {
      setVehicleFormSubmitting(false);
    }
  };

  const handleOpenInsuranceDialog = (vehicle: AdminVehicleSummary) => {
    setVehicleForInsurance(vehicle);
    setInsuranceFormValues(initialInsuranceForm());
    setInsuranceDialogOpen(true);
  };

  const handleInsuranceSubmit = async () => {
    if (!vehicleForInsurance) {
      return;
    }
    const amountNumber = Number(insuranceFormValues.amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      toast.error('Insurance amount must be a positive number.');
      return;
    }

    const payload: AdminInsurancePaymentRequest = {
      amount: amountNumber,
      paymentDate: insuranceFormValues.paymentDate || undefined,
      startDate: insuranceFormValues.startDate || undefined,
      expiryDate: insuranceFormValues.expiryDate || undefined,
      provider: normalizeOptionalString(insuranceFormValues.provider),
      policyType: normalizeOptionalString(insuranceFormValues.policyType),
      mpesaReference: normalizeOptionalString(insuranceFormValues.mpesaReference)
    };

    try {
      setInsuranceSubmitting(true);
      await recordVehicleInsurancePayment(vehicleForInsurance.id, payload);
      toast.success('Insurance payment recorded for ' + vehicleForInsurance.plateNumber);
      closeInsuranceDialog();
      await loadVehicles();
    } catch (error) {
      toast.error('Failed to record insurance payment: ' + getErrorMessage(error));
    } finally {
      setInsuranceSubmitting(false);
    }
  };

  const driverAssignmentButtonLabel = useMemo(() => {
    if (selectedDriverId === 'none') {
      return 'Unassign Driver';
    }
    if (vehicleForAssignment?.driver?.id === selectedDriverId) {
      return 'Keep Assignment';
    }
    return vehicleForAssignment?.driver ? 'Update Assignment' : 'Assign Driver';
  }, [selectedDriverId, vehicleForAssignment]);

  const handleExportData = () => {
    const headers = [
      'Vehicle ID',
      'Plate Number',
      'Owner',
      'Driver',
      'Route',
      'Status',
      'Insurance Status',
      'Registration Status'
    ];
    const rows = filteredVehicles.map(vehicle => [
      vehicle.id,
      vehicle.plateNumber,
      vehicle.owner?.name ?? '',
      vehicle.driver?.name ?? '',
      vehicle.route?.name ?? '',
      vehicle.status,
      vehicle.insuranceStatus,
      vehicle.registrationStatus
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(value => '"' + value + '"').join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fleet_data_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };
  const renderVehiclesTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Car className="h-5 w-5" />
          <span>All Vehicles</span>
          {vehiclesLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500 ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Insurance</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.map(vehicle => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <div>
                    <button
                      type="button"
                      onClick={() => onNavigate(`admin/fleet/${vehicle.id}`)}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {vehicle.plateNumber}
                    </button>
                    <p className="text-sm text-gray-500">
                      {[vehicle.model, vehicle.yearOfManufacture?.toString()].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {vehicle.owner ? (
                    <button
                      type="button"
                      onClick={() => handleViewOwner(vehicle.owner?.id ?? null)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                    >
                      {vehicle.owner.name}
                    </button>
                  ) : (
                    <span className="text-gray-500 italic">Unavailable</span>
                  )}
                </TableCell>
                <TableCell>
                  {vehicle.driver ? (
                    <span className="text-gray-900">{vehicle.driver.name}</span>
                  ) : (
                    <span className="text-gray-500 italic">Not Assigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {vehicle.route ? (
                    <div className="text-sm text-gray-700">
                      <p className="font-medium text-gray-900">{vehicle.route.name}</p>
                      {[vehicle.route.startPoint, vehicle.route.endPoint].filter(Boolean).join(' -> ')}
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">No Route</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusBadgeClass(vehicle.statusCode)}>
                    {vehicle.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getInsuranceBadgeClass(vehicle.insuranceStatusCode)}>
                    {vehicle.insuranceStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getRegistrationBadgeClass(vehicle.registrationStatusCode)}>
                    {vehicle.registrationStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onNavigate(`admin/fleet/${vehicle.id}`)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenVehicleForm('edit', vehicle)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Vehicle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAssignDriver(vehicle)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {vehicle.driver ? 'Change Driver' : 'Assign Driver'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenInsuranceDialog(vehicle)}>
                        <Shield className="h-4 w-4 mr-2" />
                        Record Insurance Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewOwner(vehicle.owner?.id ?? null)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Owner
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteVehicle(vehicle)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Vehicle
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredVehicles.length === 0 && !vehiclesLoading && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="text-center py-10 text-gray-500">No vehicles match the current filters.</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {vehiclesLoading && vehicles.length === 0 && (
          <div className="text-center py-10 text-gray-500">Loading vehicles...</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout user={user} currentPage="admin/fleet" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
            <p className="text-gray-600 mt-1">Manage vehicle registrations, assignments, and compliance</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onNavigate('admin/fleet/routes')}>
              <MapPin className="h-4 w-4 mr-2" />
              Manage Routes
            </Button>
            <Button onClick={() => handleOpenVehicleForm('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{totalVehicles}</p>
                </div>
                <Car className="h-8 w-8 text-[var(--neon-turquoise)]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Compliance</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingComplianceCount}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Insurance Issues</p>
                  <p className="text-2xl font-bold text-red-600">{expiredInsuranceCount}</p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by plate, owner, driver, or route"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExportData} disabled={vehicles.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {vehiclesError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{vehiclesError}</div>
        )}

        {renderVehiclesTable()}
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={open => (open ? setAssignDialogOpen(true) : closeAssignDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {vehicleForAssignment?.driver ? 'Update Driver Assignment' : 'Assign Driver'}
            </DialogTitle>
            <DialogDescription>
              {vehicleForAssignment && (
                <>
                  Select a driver for <strong>{vehicleForAssignment.plateNumber}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driver">Driver</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassign Driver</SelectItem>
                  {driverOptionsForAssignment.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex flex-col">
                        <span>{driver.name}</span>
                        <span className="text-xs text-gray-500">{driver.phone}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {vehicleForAssignment?.driver && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                Current driver: <strong>{vehicleForAssignment.driver.name}</strong>
              </div>
            )}
          </div>

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={closeAssignDialog}>
              Cancel
            </Button>
            <Button onClick={handleAssignmentSave} disabled={assigningDriver}>
              {assigningDriver && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {driverAssignmentButtonLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={vehicleFormOpen} onOpenChange={open => (open ? setVehicleFormOpen(true) : closeVehicleForm())}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{vehicleFormMode === 'create' ? 'Add Vehicle' : 'Edit Vehicle'}</DialogTitle>
            <DialogDescription>
              {vehicleFormMode === 'create'
                ? 'Register a new vehicle to the fleet.'
                : 'Update the details for ' + (vehicleBeingEdited?.plateNumber ?? '') + '.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner ID</Label>
              <Input
                id="ownerId"
                value={vehicleFormValues.ownerId}
                onChange={event => setVehicleFormValues(prev => ({ ...prev, ownerId: event.target.value }))}
                placeholder="Owner user ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plateNumber">Plate Number</Label>
              <Input
                id="plateNumber"
                value={vehicleFormValues.plateNumber}
                onChange={event => setVehicleFormValues(prev => ({ ...prev, plateNumber: event.target.value }))}
                placeholder="e.g. KAA 123A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={vehicleFormValues.model}
                onChange={event => setVehicleFormValues(prev => ({ ...prev, model: event.target.value }))}
                placeholder="Vehicle model"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Input
                id="vehicleType"
                value={vehicleFormValues.vehicleType}
                onChange={event => setVehicleFormValues(prev => ({ ...prev, vehicleType: event.target.value }))}
                placeholder="Matatu, Bus, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearOfManufacture">Year of Manufacture</Label>
              <Input
                id="yearOfManufacture"
                value={vehicleFormValues.yearOfManufacture}
                onChange={event =>
                  setVehicleFormValues(prev => ({ ...prev, yearOfManufacture: event.target.value }))
                }
                placeholder="e.g. 2015"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routeId">Route</Label>
              <Select
                value={vehicleFormValues.routeId}
                onValueChange={value => setVehicleFormValues(prev => ({ ...prev, routeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No route assigned</SelectItem>
                  {routeOptionsForForm.map(route => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Vehicle Status</Label>
              <Select
                value={vehicleFormValues.statusCode}
                onValueChange={value =>
                  setVehicleFormValues(prev => ({
                    ...prev,
                    statusCode: value as VehicleStatusCode
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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
            <div className="space-y-2">
              <Label htmlFor="registrationStatus">Registration Status</Label>
              <Select
                value={vehicleFormValues.registrationStatusCode}
                onValueChange={value =>
                  setVehicleFormValues(prev => ({
                    ...prev,
                    registrationStatusCode: value as RegistrationStatusCode
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select registration status" />
                </SelectTrigger>
                <SelectContent>
                  {registrationStatusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceStatus">Insurance Status</Label>
              <Select
                value={vehicleFormValues.insuranceStatusCode}
                onValueChange={value =>
                  setVehicleFormValues(prev => ({
                    ...prev,
                    insuranceStatusCode: value as InsuranceStatusCode
                  }))
                }
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="driverId">Driver</Label>
              <Select
                value={vehicleFormValues.driverId}
                onValueChange={value => setVehicleFormValues(prev => ({ ...prev, driverId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleFormMode === 'edit' && <SelectItem value="keep">Keep current driver</SelectItem>}
                  <SelectItem value="none">No driver assigned</SelectItem>
                  {driverOptionsForForm.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex flex-col">
                        <span>{driver.name}</span>
                        <span className="text-xs text-gray-500">{driver.phone}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceProvider">Insurance Provider</Label>
              <Input
                id="insuranceProvider"
                value={vehicleFormValues.insuranceProvider}
                onChange={event =>
                  setVehicleFormValues(prev => ({ ...prev, insuranceProvider: event.target.value }))
                }
                placeholder="Provider name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policyType">Policy Type</Label>
              <Input
                id="policyType"
                value={vehicleFormValues.policyType}
                onChange={event => setVehicleFormValues(prev => ({ ...prev, policyType: event.target.value }))}
                placeholder="Policy type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
              <Input
                id="insuranceExpiry"
                type="date"
                value={vehicleFormValues.insuranceExpiry}
                onChange={event => setVehicleFormValues(prev => ({ ...prev, insuranceExpiry: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationExpiry">Registration Expiry</Label>
              <Input
                id="registrationExpiry"
                type="date"
                value={vehicleFormValues.registrationExpiry}
                onChange={event =>
                  setVehicleFormValues(prev => ({ ...prev, registrationExpiry: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="premium">Insurance Premium (KES)</Label>
              <Input
                id="premium"
                value={vehicleFormValues.premium}
                onChange={event => setVehicleFormValues(prev => ({ ...prev, premium: event.target.value }))}
                placeholder="e.g. 5000"
              />
            </div>
          </div>

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={closeVehicleForm}>
              Cancel
            </Button>
            <Button onClick={handleVehicleFormSubmit} disabled={vehicleFormSubmitting}>
              {vehicleFormSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {vehicleFormMode === 'create' ? 'Create Vehicle' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={insuranceDialogOpen} onOpenChange={open => (open ? setInsuranceDialogOpen(true) : closeInsuranceDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Insurance Payment</DialogTitle>
            <DialogDescription>
              {vehicleForInsurance && (
                <>
                  Log an insurance payment for <strong>{vehicleForInsurance.plateNumber}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                value={insuranceFormValues.amount}
                onChange={event => setInsuranceFormValues(prev => ({ ...prev, amount: event.target.value }))}
                placeholder="e.g. 5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={insuranceFormValues.paymentDate}
                onChange={event => setInsuranceFormValues(prev => ({ ...prev, paymentDate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Coverage Start</Label>
              <Input
                id="startDate"
                type="date"
                value={insuranceFormValues.startDate}
                onChange={event => setInsuranceFormValues(prev => ({ ...prev, startDate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Coverage Expiry</Label>
              <Input
                id="expiryDate"
                type="date"
                value={insuranceFormValues.expiryDate}
                onChange={event => setInsuranceFormValues(prev => ({ ...prev, expiryDate: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={insuranceFormValues.provider}
                onChange={event => setInsuranceFormValues(prev => ({ ...prev, provider: event.target.value }))}
                placeholder="Insurance provider"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policyType">Policy Type</Label>
              <Input
                id="policyType"
                value={insuranceFormValues.policyType}
                onChange={event => setInsuranceFormValues(prev => ({ ...prev, policyType: event.target.value }))}
                placeholder="Comprehensive, Third-party..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mpesaReference">Mpesa Reference</Label>
              <Input
                id="mpesaReference"
                value={insuranceFormValues.mpesaReference}
                onChange={event => setInsuranceFormValues(prev => ({ ...prev, mpesaReference: event.target.value }))}
                placeholder="MPESA transaction reference"
              />
            </div>
          </div>

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={closeInsuranceDialog}>
              Cancel
            </Button>
            <Button onClick={handleInsuranceSubmit} disabled={insuranceSubmitting}>
              {insuranceSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
