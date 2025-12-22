import { ComponentType, ReactNode, useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar, 
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Car,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ReportsProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<ReportsLayoutProps>;
  currentPage?: string;
}

interface ReportsLayoutProps {
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

export function Reports({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = StaffLayout,
  currentPage = 'staff/reports'
}: ReportsProps) {
  const [selectedReportType, setSelectedReportType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  // Mock data for available reports
  const reportTypes = [
    {
      id: 'user-summary',
      name: 'User Summary Report',
      description: 'Complete overview of all SACCO members',
      icon: Users,
      category: 'User Reports'
    },
    {
      id: 'fleet-performance',
      name: 'Fleet Performance Report',
      description: 'Vehicle performance and utilization metrics',
      icon: Car,
      category: 'Fleet Reports'
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary Report',
      description: 'Income, expenses, and profitability analysis',
      icon: DollarSign,
      category: 'Financial Reports'
    },
    {
      id: 'loan-status',
      name: 'Loan Status Report',
      description: 'Current loan portfolio and repayment status',
      icon: FileText,
      category: 'Financial Reports'
    },
    {
      id: 'savings-analysis',
      name: 'Savings Analysis Report',
      description: 'Member savings trends and growth patterns',
      icon: TrendingUp,
      category: 'Financial Reports'
    },
    {
      id: 'route-analysis',
      name: 'Route Analysis Report',
      description: 'Route performance and revenue analysis',
      icon: BarChart3,
      category: 'Fleet Reports'
    }
  ];

  // Mock data for recent reports
  const recentReports = [
    {
      id: 1,
      name: 'Monthly Financial Summary - June 2024',
      type: 'Financial Summary Report',
      generatedBy: 'John Kamau',
      generatedDate: '2024-06-30',
      status: 'Completed',
      downloadUrl: '#'
    },
    {
      id: 2,
      name: 'Fleet Performance - Q2 2024',
      type: 'Fleet Performance Report',
      generatedBy: 'Mary Wanjiku',
      generatedDate: '2024-06-28',
      status: 'Completed',
      downloadUrl: '#'
    },
    {
      id: 3,
      name: 'User Summary - June 2024',
      type: 'User Summary Report',
      generatedBy: 'Peter Mwangi',
      generatedDate: '2024-06-25',
      status: 'Processing',
      downloadUrl: null
    }
  ];

  const handleGenerateReport = () => {
    if (!selectedReportType || !dateFrom || !dateTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate report generation
    toast.success('Report generation started! You will receive an email when ready.');
    setSelectedReportType('');
    setDateFrom('');
    setDateTo('');
    setEmailRecipients('');
    setReportDescription('');
  };

  const handleExportReport = (format: string) => {
    if (!selectedReportType) {
      toast.error('Please select a report type first');
      return;
    }
    toast.success(`Report exported in ${format.toUpperCase()} format`);
  };

  const handleEmailReport = () => {
    if (!emailRecipients) {
      toast.error('Please enter email recipients');
      return;
    }
    toast.success('Report sent via email successfully!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'Processing':
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'Failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const groupedReports = reportTypes.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, typeof reportTypes>);

  return (
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and export comprehensive SACCO reports</p>
        </div>

        {/* Report Generation Form */}
        <Card className="border-l-4 border-[var(--neon-turquoise)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-[var(--neon-turquoise)]" />
              <span>Generate New Report</span>
            </CardTitle>
            <CardDescription>
              Select report type, date range, and additional parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type *</Label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedReports).map(([category, reports]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-sm font-semibold text-gray-600 border-b">
                          {category}
                        </div>
                        {reports.map((report) => (
                          <SelectItem key={report.id} value={report.id}>
                            {report.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFrom">Date From *</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">Date To *</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailRecipients">Email Recipients</Label>
                <Input
                  id="emailRecipients"
                  placeholder="emails@example.com, separated by commas"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                />
                <p className="text-xs text-gray-500">Optional: Send report via email</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Report Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add any specific requirements or notes for this report"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button 
                  onClick={handleGenerateReport}
                  className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportReport('pdf')}
                  className="border-[var(--neon-orange)] text-[var(--neon-orange)] hover:bg-[var(--neon-orange)]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportReport('csv')}
                  className="border-[var(--neon-purple)] text-[var(--neon-purple)] hover:bg-[var(--neon-purple)]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportReport('excel')}
                  className="border-[var(--neon-yellow)] text-[var(--neon-orange)] hover:bg-[var(--neon-yellow)]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleEmailReport}
                  className="border-gray-400 text-gray-600 hover:bg-gray-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Report Types */}
        <Card className="border-l-4 border-[var(--neon-yellow)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-[var(--neon-orange)]" />
              <span>Available Report Types</span>
            </CardTitle>
            <CardDescription>Overview of all available reports and their purposes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                     onClick={() => setSelectedReportType(report.id)}>
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-yellow)]/10">
                      <report.icon className="h-5 w-5 text-[var(--neon-turquoise)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {report.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="border-l-4 border-[var(--neon-purple)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-[var(--neon-purple)]" />
              <span>Recent Reports</span>
            </CardTitle>
            <CardDescription>Previously generated reports and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-gradient-to-r from-[var(--neon-purple)]/10 to-[var(--hot-pink)]/10">
                      <FileText className="h-4 w-4 text-[var(--neon-purple)]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600">{report.type}</p>
                      <p className="text-xs text-gray-500">
                        Generated by {report.generatedBy} on {report.generatedDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(report.status)}
                    {report.downloadUrl && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Future Chart Placeholder */}
        <Card className="bg-gradient-to-r from-gray-50 to-white border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[var(--neon-turquoise)]/20 to-[var(--neon-yellow)]/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-[var(--neon-turquoise)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Interactive Charts Coming Soon</h3>
                <p className="text-gray-600 mt-2">
                  Advanced data visualization and interactive charts will be available in future updates.
                  This will include trend analysis, comparative charts, and drill-down capabilities.
                </p>
              </div>
              <div className="flex justify-center space-x-2">
                <Badge variant="secondary">Data Visualization</Badge>
                <Badge variant="secondary">Interactive Charts</Badge>
                <Badge variant="secondary">Trend Analysis</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutComponent>
  );
}
