import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Car,
  CreditCard,
  PiggyBank,
  Shield,
  TrendingUp,
  Calendar,
  Plus,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HomeDashboardProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data
const monthlyData = [
  { month: 'Jan', savings: 45000, payments: 12000 },
  { month: 'Feb', savings: 52000, payments: 11500 },
  { month: 'Mar', savings: 48000, payments: 12500 },
  { month: 'Apr', savings: 61000, payments: 11800 },
  { month: 'May', savings: 67000, payments: 12200 },
  { month: 'Jun', savings: 73000, payments: 11900 },
];

const recentPayments = [
  { id: '001', date: '2024-01-15', amount: 12000, vehicle: 'KCA 123A', status: 'Completed' },
  { id: '002', date: '2024-01-14', amount: 11500, vehicle: 'KCB 456B', status: 'Completed' },
  { id: '003', date: '2024-01-13', amount: 12200, vehicle: 'KCA 123A', status: 'Completed' },
  { id: '004', date: '2024-01-12', amount: 11800, vehicle: 'KCB 456B', status: 'Completed' },
];

const vehicles = [
  { plate: 'KCA 123A', route: 'CBD-Kikuyu', savings: 45000, loan: 25000, insurance: 'Active' },
  { plate: 'KCB 456B', route: 'Westlands-Kangemi', savings: 38000, loan: 15000, insurance: 'Active' },
];

export function HomeDashboard({ user, onNavigate, onLogout }: HomeDashboardProps) {
  const totalSavings = vehicles.reduce((sum, v) => sum + v.savings, 0);
  const totalLoans = vehicles.reduce((sum, v) => sum + v.loan, 0);

  return (
    <VehicleOwnerLayout
      currentPage="users/home"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-white/70">
            Here's your SACCO dashboard overview
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-yellow)]/20 to-[var(--neon-orange)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Savings</p>
                  <p className="text-2xl font-bold text-white">
                    KES {totalSavings.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-[var(--neon-yellow)]/20 rounded-full">
                  <PiggyBank className="w-6 h-6 text-[var(--neon-yellow)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-turquoise)]/20 to-[var(--electric-blue)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Outstanding Loans</p>
                  <p className="text-2xl font-bold text-white">
                    KES {totalLoans.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-[var(--neon-turquoise)]/20 rounded-full">
                  <CreditCard className="w-6 h-6 text-[var(--neon-turquoise)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--hot-pink)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Active Vehicles</p>
                  <p className="text-2xl font-bold text-white">
                    {vehicles.length}
                  </p>
                </div>
                <div className="p-3 bg-[var(--neon-purple)]/20 rounded-full">
                  <Car className="w-6 h-6 text-[var(--neon-purple)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-[var(--lime-green)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Insurance Status</p>
                  <p className="text-2xl font-bold text-green-400">
                    Active
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Financial Chart */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-[var(--neon-turquoise)]" />
                Monthly Financial Overview
              </CardTitle>
              <CardDescription className="text-white/70">
                Your savings and payment trends over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stackId="1"
                    stroke="var(--neon-turquoise)"
                    fill="var(--neon-turquoise)"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="payments"
                    stackId="1"
                    stroke="var(--neon-yellow)"
                    fill="var(--neon-yellow)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-white/70">
                Frequently used features for your matatu business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => onNavigate('users/vehicles')}
                className="w-full justify-between bg-gradient-to-r from-[var(--neon-yellow)]/20 to-[var(--neon-orange)]/20 text-white border border-[var(--neon-yellow)]/30 hover:from-[var(--neon-yellow)]/30 hover:to-[var(--neon-orange)]/30"
              >
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Remit Daily Payment
                </div>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => onNavigate('users/apply-loan')}
                className="w-full justify-between bg-gradient-to-r from-[var(--neon-turquoise)]/20 to-[var(--electric-blue)]/20 text-white border border-[var(--neon-turquoise)]/30 hover:from-[var(--neon-turquoise)]/30 hover:to-[var(--electric-blue)]/30"
              >
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Apply for Loan
                </div>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => onNavigate('users/financial-status')}
                className="w-full justify-between bg-gradient-to-r from-[var(--neon-purple)]/20 to-[var(--hot-pink)]/20 text-white border border-[var(--neon-purple)]/30 hover:from-[var(--neon-purple)]/30 hover:to-[var(--hot-pink)]/30"
              >
                <div className="flex items-center">
                  <PiggyBank className="w-4 h-4 mr-2" />
                  View Balance
                </div>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => onNavigate('users/addVehicle')}
                className="w-full justify-between bg-gradient-to-r from-green-500/20 to-[var(--lime-green)]/20 text-white border border-green-500/30 hover:from-green-500/30 hover:to-[var(--lime-green)]/30"
              >
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Register New Vehicle
                </div>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Payments */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[var(--neon-orange)]" />
                    Recent Payments
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Your latest payment transactions
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('users/payments')}
                  className="text-[var(--neon-turquoise)] hover:text-white hover:bg-[var(--neon-turquoise)]/20"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPayments.slice(0, 4).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div>
                      <p className="text-white font-medium">{payment.vehicle}</p>
                      <p className="text-white/60 text-sm">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[var(--neon-yellow)] font-bold">
                        KES {payment.amount.toLocaleString()}
                      </p>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Summary */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center">
                    <Car className="w-5 h-5 mr-2 text-[var(--neon-purple)]" />
                    My Vehicles
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Quick overview of your matatu fleet
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('users/vehicles')}
                  className="text-[var(--neon-turquoise)] hover:text-white hover:bg-[var(--neon-turquoise)]/20"
                >
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.plate}
                    className="p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-bold">{vehicle.plate}</p>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {vehicle.insurance}
                      </Badge>
                    </div>
                    <p className="text-white/70 text-sm mb-2">{vehicle.route}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-white/60">Savings: </span>
                        <span className="text-[var(--neon-turquoise)]">
                          KES {vehicle.savings.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/60">Loan: </span>
                        <span className="text-[var(--neon-orange)]">
                          KES {vehicle.loan.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </VehicleOwnerLayout>
  );
}