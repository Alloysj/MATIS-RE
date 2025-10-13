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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Car, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Fuel,
  Settings,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FleetReportsProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data for reports
const vehiclePerformanceData = [
  {
    id: 'V001',
    plateNumber: 'KCA 123X',
    owner: 'James Mutua',
    route: 'Nairobi - Kikuyu',
    monthlyRevenue: 85000,
    tripsCompleted: 245,
    fuelConsumption: 1250,
    maintenanceCost: 15000,
    efficiency: 95,
    status: 'Excellent'
  },
  {
    id: 'V002',
    plateNumber: 'KBD 456Y',
    owner: 'Catherine Muthoni',
    route: 'Nairobi - Thika',
    monthlyRevenue: 62000,
    tripsCompleted: 180,
    fuelConsumption: 980,
    maintenanceCost: 22000,
    efficiency: 78,
    status: 'Good'
  },
  {
    id: 'V003',
    plateNumber: 'KCE 789Z',
    owner: 'John Kamau',
    route: 'Nairobi - Kisumu',
    monthlyRevenue: 0,
    tripsCompleted: 0,
    fuelConsumption: 0,
    maintenanceCost: 8000,
    efficiency: 0,
    status: 'Inactive'
  },
  {
    id: 'V004',
    plateNumber: 'KCA 890A',
    owner: 'Mary Njeri',
    route: 'Nairobi - Machakos',
    monthlyRevenue: 78000,
    tripsCompleted: 220,
    fuelConsumption: 1100,
    maintenanceCost: 18000,
    efficiency: 88,
    status: 'Good'
  },
  {
    id: 'V005',
    plateNumber: 'KBB 234B',
    owner: 'Peter Kimani',
    route: 'Nairobi - Nakuru',
    monthlyRevenue: 92000,
    tripsCompleted: 265,
    fuelConsumption: 1380,
    maintenanceCost: 12000,
    efficiency: 97,
    status: 'Excellent'
  }
];

const monthlyTrendData = [
  { month: 'Jan', totalRevenue: 425000, activeVehicles: 4, trips: 1200, maintenance: 85000 },
  { month: 'Feb', totalRevenue: 445000, activeVehicles: 4, trips: 1280, maintenance: 92000 },
  { month: 'Mar', totalRevenue: 465000, activeVehicles: 5, trips: 1350, maintenance: 78000 },
  { month: 'Apr', totalRevenue: 485000, activeVehicles: 5, trips: 1420, maintenance: 95000 },
  { month: 'May', totalRevenue: 502000, activeVehicles: 5, trips: 1480, maintenance: 88000 },
  { month: 'Jun', totalRevenue: 317000, activeVehicles: 4, trips: 910, maintenance: 75000 }
];

const routePerformanceData = [
  { route: 'Nairobi - Kikuyu', vehicles: 1, revenue: 85000, trips: 245, avgEfficiency: 95 },
  { route: 'Nairobi - Thika', vehicles: 1, revenue: 62000, trips: 180, avgEfficiency: 78 },
  { route: 'Nairobi - Kisumu', vehicles: 1, revenue: 0, trips: 0, avgEfficiency: 0 },
  { route: 'Nairobi - Machakos', vehicles: 1, revenue: 78000, trips: 220, avgEfficiency: 88 },
  { route: 'Nairobi - Nakuru', vehicles: 1, revenue: 92000, trips: 265, avgEfficiency: 97 }
];

const maintenanceData = [
  {
    id: 'M001',
    vehicle: 'KCA 123X',
    type: 'Routine Service',
    cost: 8000,
    date: '2024-06-15',
    status: 'Completed',
    nextDue: '2024-09-15'
  },
  {
    id: 'M002',
    vehicle: 'KBD 456Y',
    type: 'Brake Repair',
    cost: 15000,
    date: '2024-06-10',
    status: 'Completed',
    nextDue: '2024-12-10'
  },
  {
    id: 'M003',
    vehicle: 'KCA 890A',
    type: 'Engine Overhaul',
    cost: 25000,
    date: '2024-06-20',
    status: 'In Progress',
    nextDue: 'N/A'
  },
  {
    id: 'M004',
    vehicle: 'KBB 234B',
    type: 'Tire Replacement',
    cost: 12000,
    date: '2024-06-08',
    status: 'Completed',
    nextDue: '2024-12-08'
  }
];

const statusColors = {
  'Excellent': 'bg-green-100 text-green-800',
  'Good': 'bg-blue-100 text-blue-800',
  'Fair': 'bg-yellow-100 text-yellow-800',
  'Poor': 'bg-red-100 text-red-800',
  'Inactive': 'bg-gray-100 text-gray-800'
};

const pieChartData = [
  { name: 'Excellent', value: 2, color: '#10B981' },
  { name: 'Good', value: 2, color: '#3B82F6' },
  { name: 'Inactive', value: 1, color: '#6B7280' }
];

export function FleetReports({ user, onNavigate, onLogout }: FleetReportsProps) {
  const [dateRange, setDateRange] = useState('last-30-days');
  const [reportType, setReportType] = useState('performance');

  const handleExportPerformance = () => {
    const headers = ['Vehicle ID', 'Plate Number', 'Owner', 'Route', 'Monthly Revenue', 'Trips Completed', 'Fuel Consumption (L)', 'Maintenance Cost', 'Efficiency (%)', 'Status'];
    const csvContent = [
      headers.join(','),
      ...vehiclePerformanceData.map(vehicle => [
        vehicle.id,
        vehicle.plateNumber,
        vehicle.owner,
        vehicle.route,
        vehicle.monthlyRevenue,
        vehicle.tripsCompleted,
        vehicle.fuelConsumption,
        vehicle.maintenanceCost,
        vehicle.efficiency,
        vehicle.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fleet_performance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportRoute = () => {
    const headers = ['Route', 'Vehicles', 'Total Revenue', 'Total Trips', 'Average Efficiency (%)'];
    const csvContent = [
      headers.join(','),
      ...routePerformanceData.map(route => [
        route.route,
        route.vehicles,
        route.revenue,
        route.trips,
        route.avgEfficiency
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `route_performance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportMaintenance = () => {
    const headers = ['Maintenance ID', 'Vehicle', 'Type', 'Cost', 'Date', 'Status', 'Next Due'];
    const csvContent = [
      headers.join(','),
      ...maintenanceData.map(maintenance => [
        maintenance.id,
        maintenance.vehicle,
        maintenance.type,
        maintenance.cost,
        maintenance.date,
        maintenance.status,
        maintenance.nextDue
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maintenance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout 
      user={user} 
      currentPage="admin/reports/fleet" 
      onNavigate={onNavigate} 
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive fleet performance and analytics</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="date-range">Period:</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-3-months">Last 3 months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 months</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">KSh 317,000</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">4 / 5</p>
                  <p className="text-xs text-gray-500 mt-1">80% utilization</p>
                </div>
                <Car className="h-8 w-8 text-[var(--neon-turquoise)]" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold text-gray-900">910</p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -5.2% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Maintenance Cost</p>
                  <p className="text-2xl font-bold text-gray-900">KSh 75,000</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -8.1% from last month
                  </p>
                </div>
                <Settings className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Vehicle Performance</TabsTrigger>
            <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
            <TabsTrigger value="routes">Route Analysis</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          {/* Vehicle Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Vehicle Performance Report</CardTitle>
                      <Button variant="outline" size="sm" onClick={handleExportPerformance}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Trips</TableHead>
                          <TableHead>Efficiency</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehiclePerformanceData.map((vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{vehicle.plateNumber}</p>
                                <p className="text-sm text-gray-500">{vehicle.route}</p>
                              </div>
                            </TableCell>
                            <TableCell>{vehicle.owner}</TableCell>
                            <TableCell>
                              <span className="font-medium">
                                KSh {vehicle.monthlyRevenue.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>{vehicle.tripsCompleted}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="w-12 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${vehicle.efficiency}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm">{vehicle.efficiency}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[vehicle.status as keyof typeof statusColors]}>
                                {vehicle.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Fleet Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Monthly Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalRevenue" fill="#10B981" name="Revenue (KSh)" />
                      <Line yAxisId="right" type="monotone" dataKey="trips" stroke="#3B82F6" strokeWidth={2} name="Total Trips" />
                      <Line yAxisId="right" type="monotone" dataKey="activeVehicles" stroke="#F59E0B" strokeWidth={2} name="Active Vehicles" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Route Analysis Tab */}
          <TabsContent value="routes" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Route Performance Analysis</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportRoute}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Vehicles</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Total Trips</TableHead>
                      <TableHead>Avg Efficiency</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routePerformanceData.map((route, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{route.route}</TableCell>
                        <TableCell>{route.vehicles}</TableCell>
                        <TableCell>KSh {route.revenue.toLocaleString()}</TableCell>
                        <TableCell>{route.trips}</TableCell>
                        <TableCell>{route.avgEfficiency}%</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {route.avgEfficiency >= 90 ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : route.avgEfficiency >= 70 ? (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            ) : route.avgEfficiency > 0 ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <div className="h-4 w-4 rounded-full bg-gray-400" />
                            )}
                            <span className="text-sm">
                              {route.avgEfficiency >= 90 ? 'Excellent' : 
                               route.avgEfficiency >= 70 ? 'Good' : 
                               route.avgEfficiency > 0 ? 'Needs Attention' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Maintenance Report</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportMaintenance}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceData.map((maintenance) => (
                      <TableRow key={maintenance.id}>
                        <TableCell className="font-medium">{maintenance.vehicle}</TableCell>
                        <TableCell>{maintenance.type}</TableCell>
                        <TableCell>KSh {maintenance.cost.toLocaleString()}</TableCell>
                        <TableCell>{maintenance.date}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              maintenance.status === 'Completed' 
                                ? 'bg-green-100 text-green-800'
                                : maintenance.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {maintenance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{maintenance.nextDue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}