import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { 
  Car, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  User,
  Shield,
  Calendar,
  MapPin,
  Plus,
  Eye
} from 'lucide-react';

interface FleetManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data
const vehicles = [
  {
    id: 'V001',
    plateNumber: 'KCA 123X',
    owner: 'James Mutua',
    ownerId: 'AU001',
    model: 'Toyota Hiace',
    year: '2019',
    route: 'Nairobi - Kikuyu',
    driver: 'Samuel Kiprop',
    driverId: 'AU003',
    status: 'Active',
    insurance: 'Valid',
    insuranceExpiry: '2024-06-15',
    registration: 'Valid',
    registrationExpiry: '2024-12-20',
    dateAdded: '2023-12-20'
  },
  {
    id: 'V002',
    plateNumber: 'KBD 456Y',
    owner: 'Catherine Muthoni',
    ownerId: 'AU004',
    model: 'Nissan Matatu',
    year: '2018',
    route: 'Nairobi - Thika',
    driver: 'Not Assigned',
    driverId: null,
    status: 'Inactive',
    insurance: 'Expired',
    insuranceExpiry: '2024-01-10',
    registration: 'Valid',
    registrationExpiry: '2024-11-15',
    dateAdded: '2023-09-05'
  },
  {
    id: 'V003',
    plateNumber: 'KCE 789Z',
    owner: 'John Kamau',
    ownerId: 'PU001',
    model: 'Toyota Hiace',
    year: '2020',
    route: 'Nairobi - Kisumu',
    driver: 'Not Assigned',
    driverId: null,
    status: 'Pending',
    insurance: 'Pending',
    insuranceExpiry: null,
    registration: 'Pending',
    registrationExpiry: null,
    dateAdded: '2024-01-15'
  }
];

export function FleetManagement({ user, onNavigate, onLogout }: FleetManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleEditVehicle = (vehicleId: string) => {
    console.log('Editing vehicle:', vehicleId);
    // Add edit logic here
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    console.log('Deleting vehicle:', vehicleId);
    // Add deletion logic here
  };

  const handleViewOwner = (ownerId: string) => {
    onNavigate(`admin/users/user_profile/${ownerId}`);
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsuranceColor = (insurance: string) => {
    switch (insurance) {
      case 'Valid':
        return 'bg-green-100 text-green-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout 
      user={user} 
      currentPage="admin/fleet" 
      onNavigate={onNavigate} 
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
            <p className="text-gray-600 mt-1">Manage vehicle registrations and operations</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={() => onNavigate('admin/fleet/routes')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Manage Routes
            </Button>
            <Button 
              onClick={() => onNavigate('admin/fleet/assignments')}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] hover:opacity-90"
            >
              <User className="h-4 w-4 mr-2" />
              Assign Drivers
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
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
                  <p className="text-2xl font-bold text-green-600">
                    {vehicles.filter(v => v.status === 'Active').length}
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
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {vehicles.filter(v => v.status === 'Pending').length}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Insurance Issues</p>
                  <p className="text-2xl font-bold text-red-600">
                    {vehicles.filter(v => v.insurance === 'Expired').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex justify-between items-center">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline"
            onClick={() => onNavigate('admin/fleet/statuses')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vehicle Status
          </Button>
        </div>

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>All Vehicles</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Info</TableHead>
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
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{vehicle.plateNumber}</p>
                        <p className="text-sm text-gray-500">{vehicle.model} ({vehicle.year})</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => handleViewOwner(vehicle.ownerId)}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {vehicle.owner}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {vehicle.driver !== 'Not Assigned' ? (
                          <span className="text-gray-900">{vehicle.driver}</span>
                        ) : (
                          <span className="text-gray-500 italic">Not Assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {vehicle.route}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(vehicle.status)}>
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge className={getInsuranceColor(vehicle.insurance)}>
                          {vehicle.insurance}
                        </Badge>
                        {vehicle.insuranceExpiry && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires: {vehicle.insuranceExpiry}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline">
                          {vehicle.registration}
                        </Badge>
                        {vehicle.registrationExpiry && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires: {vehicle.registrationExpiry}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditVehicle(vehicle.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Vehicle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate('admin/fleet/assignments')}>
                            <User className="h-4 w-4 mr-2" />
                            Assign Driver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewOwner(vehicle.ownerId)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Owner
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Vehicle
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredVehicles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No vehicles found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}