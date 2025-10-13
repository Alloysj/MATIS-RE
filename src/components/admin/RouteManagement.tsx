import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MapPin, Plus, Search, MoreVertical, Edit, Trash2, Route as RouteIcon, Loader2 } from 'lucide-react';
import {
  AdminRoute,
  fetchAdminRoutes,
  createAdminRoute,
  updateAdminRoute,
  deleteAdminRoute
} from '../../services/admin';

interface RouteManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

type RouteFormMode = 'create' | 'edit';

interface RouteFormState {
  name: string;
  startPoint: string;
  endPoint: string;
  distanceKm: string;
  fare: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const initialRouteForm = (): RouteFormState => ({
  name: '',
  startPoint: '',
  endPoint: '',
  distanceKm: '',
  fare: '',
  status: 'ACTIVE'
});

const formatMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '--';
  }
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export function RouteManagement({ user, onNavigate, onLogout }: RouteManagementProps) {
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState<boolean>(true);
  const [routesError, setRoutesError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<RouteFormMode>('create');
  const [formValues, setFormValues] = useState<RouteFormState>(initialRouteForm());
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadRoutes = useCallback(async () => {
    setRoutesLoading(true);
    setRoutesError(null);
    try {
      const list = await fetchAdminRoutes();
      setRoutes(list);
    } catch (error) {
      setRoutesError(getErrorMessage(error));
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const filteredRoutes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return routes;
    }
    return routes.filter(route => {
      return (
        route.name.toLowerCase().includes(term) ||
        route.startPoint.toLowerCase().includes(term) ||
        route.endPoint.toLowerCase().includes(term)
      );
    });
  }, [routes, searchTerm]);

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(route => route.status === 'ACTIVE').length;
  const inactiveRoutes = routes.filter(route => route.status !== 'ACTIVE').length;

  const closeForm = () => {
    setFormOpen(false);
    setFormValues(initialRouteForm());
    setEditingRouteId(null);
    setFormMode('create');
    setFormSubmitting(false);
  };

  const openCreateForm = () => {
    setFormMode('create');
    setFormValues(initialRouteForm());
    setEditingRouteId(null);
    setFormOpen(true);
  };

  const openEditForm = (route: AdminRoute) => {
    setFormMode('edit');
    setEditingRouteId(route.id);
    setFormValues({
      name: route.name,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      distanceKm: route.distanceKm !== null && route.distanceKm !== undefined ? String(route.distanceKm) : '',
      fare: route.fare !== null && route.fare !== undefined ? String(route.fare) : '',
      status: route.status
    });
    setFormOpen(true);
  };

  const handleRouteSubmit = async () => {
    if (!formValues.name.trim() || !formValues.startPoint.trim() || !formValues.endPoint.trim()) {
      toast.error('Route name, start point, and end point are required.');
      return;
    }

    const payload = {
      name: formValues.name.trim(),
      startPoint: formValues.startPoint.trim(),
      endPoint: formValues.endPoint.trim(),
      distanceKm: formValues.distanceKm.trim() ? Number(formValues.distanceKm) : undefined,
      fare: formValues.fare.trim() ? Number(formValues.fare) : undefined,
      status: formValues.status
    };

    if ((payload.distanceKm !== undefined && !Number.isFinite(payload.distanceKm)) ||
        (payload.fare !== undefined && !Number.isFinite(payload.fare))) {
      toast.error('Distance and fare must be numeric values.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (formMode === 'create') {
        const created = await createAdminRoute(payload);
        toast.success('Route ' + created.name + ' created successfully');
      } else if (editingRouteId) {
        const updated = await updateAdminRoute(editingRouteId, payload);
        toast.success('Route ' + updated.name + ' updated successfully');
      }
      closeForm();
      await loadRoutes();
    } catch (error) {
      toast.error('Failed to save route: ' + getErrorMessage(error));
      setFormSubmitting(false);
    }
  };

  const handleDeleteRoute = async (route: AdminRoute) => {
    const confirmed = window.confirm('Delete route ' + route.name + '? This cannot be undone.');
    if (!confirmed) {
      return;
    }
    try {
      await deleteAdminRoute(route.id);
      toast.success('Route ' + route.name + ' deleted');
      await loadRoutes();
    } catch (error) {
      toast.error('Failed to delete route: ' + getErrorMessage(error));
    }
  };

  const filteredStats = useMemo(() => {
    const total = filteredRoutes.length;
    const active = filteredRoutes.filter(route => route.status === 'ACTIVE').length;
    return { total, active };
  }, [filteredRoutes]);

  return (
    <AdminLayout
      user={user}
      currentPage="admin/fleet/routes"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
            <p className="text-gray-600 mt-1">Create, update, and monitor fleet routes</p>
          </div>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Routes</p>
                  <p className="text-2xl font-bold text-gray-900">{totalRoutes}</p>
                </div>
                <RouteIcon className="h-8 w-8 text-[var(--neon-turquoise)]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeRoutes}</p>
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
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-yellow-600">{inactiveRoutes}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search routes..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredStats.total} routes ({filteredStats.active} active)
          </div>
        </div>

        {routesError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {routesError}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Routes</span>
              {routesLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500 ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Distance (km)</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes.map(route => (
                  <TableRow key={route.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{route.name}</p>
                        <p className="text-sm text-gray-500">{route.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{route.startPoint}</TableCell>
                    <TableCell>{route.endPoint}</TableCell>
                    <TableCell>{route.distanceKm ?? '--'}</TableCell>
                    <TableCell>{formatMoney(route.fare)}</TableCell>
                    <TableCell>
                      <Badge variant={route.status === 'ACTIVE' ? 'default' : 'outline'}>{route.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(route.dateCreated).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditForm(route)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteRoute(route)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRoutes.length === 0 && !routesLoading && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="text-center py-10 text-gray-500">No routes match the current filters.</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {routesLoading && routes.length === 0 && (
              <div className="text-center py-10 text-gray-500">Loading routes...</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={open => (open ? setFormOpen(true) : closeForm())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? 'Add Route' : 'Edit Route'}</DialogTitle>
            <DialogDescription>
              {formMode === 'create' ? 'Create a new transport route.' : 'Update the selected route.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="routeName">Route Name</Label>
              <Input
                id="routeName"
                value={formValues.name}
                onChange={event => setFormValues(prev => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Nairobi - Thika"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startPoint">Start Point</Label>
              <Input
                id="startPoint"
                value={formValues.startPoint}
                onChange={event => setFormValues(prev => ({ ...prev, startPoint: event.target.value }))}
                placeholder="Origin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endPoint">End Point</Label>
              <Input
                id="endPoint"
                value={formValues.endPoint}
                onChange={event => setFormValues(prev => ({ ...prev, endPoint: event.target.value }))}
                placeholder="Destination"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="distanceKm">Distance (km)</Label>
              <Input
                id="distanceKm"
                value={formValues.distanceKm}
                onChange={event => setFormValues(prev => ({ ...prev, distanceKm: event.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fare">Default Fare (KES)</Label>
              <Input
                id="fare"
                value={formValues.fare}
                onChange={event => setFormValues(prev => ({ ...prev, fare: event.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formValues.status} onValueChange={value => setFormValues(prev => ({ ...prev, status: value as 'ACTIVE' | 'INACTIVE' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button onClick={handleRouteSubmit} disabled={formSubmitting}>
              {formSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {formMode === 'create' ? 'Create Route' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
