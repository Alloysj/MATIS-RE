import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { 
  MapPin, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  Route,
  Navigation,
  Clock
} from 'lucide-react';

interface RouteManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data
const routes = [
  {
    id: 'R001',
    name: 'Nairobi - Kikuyu',
    startPoint: 'Nairobi CBD',
    endPoint: 'Kikuyu Market',
    distance: '25 km',
    estimatedTime: '45 minutes',
    vehiclesAssigned: 5,
    status: 'Active',
    fare: 80,
    dateCreated: '2023-12-15'
  },
  {
    id: 'R002',
    name: 'Nairobi - Thika',
    startPoint: 'Nairobi CBD',
    endPoint: 'Thika Town',
    distance: '42 km',
    estimatedTime: '1 hour 15 minutes',
    vehiclesAssigned: 3,
    status: 'Active',
    fare: 120,
    dateCreated: '2023-11-20'
  },
  {
    id: 'R003',
    name: 'Nairobi - Kisumu',
    startPoint: 'Nairobi CBD',
    endPoint: 'Kisumu Bus Park',
    distance: '350 km',
    estimatedTime: '6 hours',
    vehiclesAssigned: 1,
    status: 'Inactive',
    fare: 800,
    dateCreated: '2024-01-10'
  }
];

export function RouteManagement({ user, onNavigate, onLogout }: RouteManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    startPoint: '',
    endPoint: '',
    distance: '',
    estimatedTime: '',
    fare: ''
  });

  const handleDeleteRoute = (routeId: string) => {
    console.log('Deleting route:', routeId);
    // Add deletion logic here
  };

  const handleEditRoute = (routeId: string) => {
    console.log('Editing route:', routeId);
    // Add edit logic here
  };

  const handleAddRoute = () => {
    console.log('Adding new route:', newRoute);
    // Add route creation logic here
    setIsAddDialogOpen(false);
    setNewRoute({
      name: '',
      startPoint: '',
      endPoint: '',
      distance: '',
      estimatedTime: '',
      fare: ''
    });
  };

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.startPoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.endPoint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout 
      user={user} 
      currentPage="admin/fleet/routes" 
      onNavigate={onNavigate} 
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
            <p className="text-gray-600 mt-1">Manage transport routes and assignments</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Route</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="routeName">Route Name</Label>
                    <Input
                      id="routeName"
                      placeholder="e.g., Nairobi - Nakuru"
                      value={newRoute.name}
                      onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fare">Fare (KSh)</Label>
                    <Input
                      id="fare"
                      type="number"
                      placeholder="e.g., 100"
                      value={newRoute.fare}
                      onChange={(e) => setNewRoute({ ...newRoute, fare: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startPoint">Start Point</Label>
                    <Input
                      id="startPoint"
                      placeholder="e.g., Nairobi CBD"
                      value={newRoute.startPoint}
                      onChange={(e) => setNewRoute({ ...newRoute, startPoint: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endPoint">End Point</Label>
                    <Input
                      id="endPoint"
                      placeholder="e.g., Nakuru Town"
                      value={newRoute.endPoint}
                      onChange={(e) => setNewRoute({ ...newRoute, endPoint: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="distance">Distance</Label>
                    <Input
                      id="distance"
                      placeholder="e.g., 160 km"
                      value={newRoute.distance}
                      onChange={(e) => setNewRoute({ ...newRoute, distance: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedTime">Estimated Time</Label>
                    <Input
                      id="estimatedTime"
                      placeholder="e.g., 2 hours 30 minutes"
                      value={newRoute.estimatedTime}
                      onChange={(e) => setNewRoute({ ...newRoute, estimatedTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRoute}>
                  Add Route
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Routes</p>
                  <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
                </div>
                <Route className="h-8 w-8 text-[var(--neon-turquoise)]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Routes</p>
                  <p className="text-2xl font-bold text-green-600">
                    {routes.filter(r => r.status === 'Active').length}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vehicles Assigned</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {routes.reduce((sum, route) => sum + route.vehiclesAssigned, 0)}
                  </p>
                </div>
                <Navigation className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Distance</p>
                  <p className="text-2xl font-bold text-purple-600">139 km</p>
                </div>
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Routes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Route className="h-5 w-5" />
              <span>All Routes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route Info</TableHead>
                  <TableHead>Start Point</TableHead>
                  <TableHead>End Point</TableHead>
                  <TableHead>Distance & Time</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{route.name}</p>
                        <p className="text-sm text-gray-500">{route.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1 text-green-600" />
                        {route.startPoint}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1 text-red-600" />
                        {route.endPoint}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{route.distance}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {route.estimatedTime}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        KSh {route.fare}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <span className="text-xs font-medium text-blue-600">
                            {route.vehiclesAssigned}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">assigned</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        route.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {route.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditRoute(route.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Route
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate('admin/fleet/assignments')}>
                            <Navigation className="h-4 w-4 mr-2" />
                            Assign Vehicles
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteRoute(route.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Route
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredRoutes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No routes found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}