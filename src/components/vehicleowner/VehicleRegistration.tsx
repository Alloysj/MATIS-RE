import { useState } from 'react';
import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  Car,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin
} from 'lucide-react';

interface VehicleRegistrationProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function VehicleRegistration({ user, onNavigate, onLogout }: VehicleRegistrationProps) {
  const [formData, setFormData] = useState({
    numberPlate: '',
    vehicleType: '',
    capacity: '',
    chassisNumber: '',
    engineNumber: '',
    yearOfManufacture: '',
    route: '',
    logbookFile: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vehicleTypes = [
    'Toyota Hiace',
    'Nissan Matatu',
    'Isuzu NPR',
    'Mitsubishi Rosa',
    'Ford Transit',
    'Other'
  ];

  const routes = [
    'CBD-Kikuyu',
    'Westlands-Kangemi',
    'Thika Road-CBD',
    'Ngong Road-CBD',
    'Eastleigh-CBD',
    'Kasarani-CBD',
    'Embakasi-CBD',
    'Karen-CBD',
    'Kawangware-CBD',
    'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logbookFile: file }));
      if (errors.logbookFile) {
        setErrors(prev => ({ ...prev, logbookFile: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.numberPlate.trim()) {
      newErrors.numberPlate = 'Number plate is required';
    } else if (!/^K[A-Z]{2}\s?\d{3}[A-Z]$/.test(formData.numberPlate.replace(/\s/g, ''))) {
      newErrors.numberPlate = 'Invalid Kenyan number plate format (e.g., KCA 123A)';
    }

    if (!formData.vehicleType) {
      newErrors.vehicleType = 'Vehicle type is required';
    }

    if (!formData.capacity.trim()) {
      newErrors.capacity = 'Capacity is required';
    } else if (isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
    }

    if (!formData.chassisNumber.trim()) {
      newErrors.chassisNumber = 'Chassis number is required';
    }

    if (!formData.engineNumber.trim()) {
      newErrors.engineNumber = 'Engine number is required';
    }

    if (!formData.yearOfManufacture.trim()) {
      newErrors.yearOfManufacture = 'Year of manufacture is required';
    } else {
      const year = Number(formData.yearOfManufacture);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1990 || year > currentYear) {
        newErrors.yearOfManufacture = `Year must be between 1990 and ${currentYear}`;
      }
    }

    if (!formData.route) {
      newErrors.route = 'Route is required';
    }

    if (!formData.logbookFile) {
      newErrors.logbookFile = 'Logbook copy is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Vehicle registration data:', formData);
    
    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Reset form
    setFormData({
      numberPlate: '',
      vehicleType: '',
      capacity: '',
      chassisNumber: '',
      engineNumber: '',
      yearOfManufacture: '',
      route: '',
      logbookFile: null
    });
    // Navigate back to vehicles page
    onNavigate('users/vehicles');
  };

  if (showSuccess) {
    return (
      <VehicleOwnerLayout
        currentPage="users/addVehicle"
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      >
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-center">
            <CardContent className="p-8">
              <div className="mx-auto mb-6 w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Vehicle Registered Successfully!
              </h2>
              <p className="text-white/70 mb-6">
                Your vehicle <strong>{formData.numberPlate}</strong> has been registered and is pending approval. 
                You will be notified once the verification process is complete.
              </p>
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30 mb-6">
                <p className="text-green-300 text-sm">
                  ✓ Vehicle details submitted<br/>
                  ✓ Logbook uploaded<br/>
                  ✓ Pending NTSA verification
                </p>
              </div>
              <Button
                onClick={handleSuccessClose}
                className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900"
              >
                Continue to My Vehicles
              </Button>
            </CardContent>
          </Card>
        </div>
      </VehicleOwnerLayout>
    );
  }

  return (
    <VehicleOwnerLayout
      currentPage="users/addVehicle"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] rounded-full mb-4">
            <Car className="w-10 h-10 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Register New Vehicle</h1>
          <p className="text-white/70">
            Add a new matatu to your SACCO fleet
          </p>
        </div>

        {/* Background Image */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=800&fit=crop"
            alt="Nairobi street background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Registration Form */}
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl relative z-10">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Vehicle Information</CardTitle>
            <CardDescription className="text-white/70">
              Please provide accurate details for your matatu registration
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Number Plate */}
                <div className="space-y-2">
                  <Label className="text-white/90">Number Plate *</Label>
                  <Input
                    value={formData.numberPlate}
                    onChange={(e) => handleInputChange('numberPlate', e.target.value.toUpperCase())}
                    placeholder="KCA 123A"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20"
                  />
                  {errors.numberPlate && (
                    <p className="text-red-400 text-sm">{errors.numberPlate}</p>
                  )}
                </div>

                {/* Vehicle Type */}
                <div className="space-y-2">
                  <Label className="text-white/90">Vehicle Type *</Label>
                  <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value)}>
                    <SelectTrigger className="bg-white/10 border-white/30 text-white">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/30 text-white">
                      {vehicleTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vehicleType && (
                    <p className="text-red-400 text-sm">{errors.vehicleType}</p>
                  )}
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <Label className="text-white/90">Passenger Capacity *</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="14"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20"
                  />
                  {errors.capacity && (
                    <p className="text-red-400 text-sm">{errors.capacity}</p>
                  )}
                </div>

                {/* Year of Manufacture */}
                <div className="space-y-2">
                  <Label className="text-white/90">Year of Manufacture *</Label>
                  <Input
                    type="number"
                    value={formData.yearOfManufacture}
                    onChange={(e) => handleInputChange('yearOfManufacture', e.target.value)}
                    placeholder="2018"
                    min="1990"
                    max={new Date().getFullYear()}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20"
                  />
                  {errors.yearOfManufacture && (
                    <p className="text-red-400 text-sm">{errors.yearOfManufacture}</p>
                  )}
                </div>

                {/* Chassis Number */}
                <div className="space-y-2">
                  <Label className="text-white/90">Chassis Number *</Label>
                  <Input
                    value={formData.chassisNumber}
                    onChange={(e) => handleInputChange('chassisNumber', e.target.value.toUpperCase())}
                    placeholder="JT11W04G0E0123456"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20"
                  />
                  {errors.chassisNumber && (
                    <p className="text-red-400 text-sm">{errors.chassisNumber}</p>
                  )}
                </div>

                {/* Engine Number */}
                <div className="space-y-2">
                  <Label className="text-white/90">Engine Number *</Label>
                  <Input
                    value={formData.engineNumber}
                    onChange={(e) => handleInputChange('engineNumber', e.target.value.toUpperCase())}
                    placeholder="1KZ123456"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20"
                  />
                  {errors.engineNumber && (
                    <p className="text-red-400 text-sm">{errors.engineNumber}</p>
                  )}
                </div>
              </div>

              {/* Route */}
              <div className="space-y-2">
                <Label className="text-white/90 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Operating Route *
                </Label>
                <Select value={formData.route} onValueChange={(value) => handleInputChange('route', value)}>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white">
                    <SelectValue placeholder="Select operating route" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/30 text-white">
                    {routes.map(route => (
                      <SelectItem key={route} value={route}>{route}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.route && (
                  <p className="text-red-400 text-sm">{errors.route}</p>
                )}
              </div>

              {/* Logbook Upload */}
              <div className="space-y-2">
                <Label className="text-white/90 flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  Logbook Copy *
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="bg-white/10 border-2 border-dashed border-white/30 rounded-lg p-6 text-center hover:border-[var(--neon-turquoise)] transition-colors">
                    <Upload className="w-8 h-8 text-white/60 mx-auto mb-2" />
                    <p className="text-white/80">
                      {formData.logbookFile ? formData.logbookFile.name : 'Click to upload logbook copy'}
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      PDF, JPG, JPEG, PNG (Max 5MB)
                    </p>
                  </div>
                </div>
                {errors.logbookFile && (
                  <p className="text-red-400 text-sm">{errors.logbookFile}</p>
                )}
              </div>

              {/* Important Notice */}
              <Alert className="bg-blue-500/10 border-blue-500/30 text-blue-200">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  All vehicle information will be verified with NTSA records. 
                  Ensure all details match your official documents exactly.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onNavigate('users/vehicles')}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] text-slate-900 hover:from-[var(--neon-turquoise)] hover:to-[var(--neon-purple)] px-8"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Registering...
                    </div>
                  ) : (
                    <>
                      <Car className="w-4 h-4 mr-2" />
                      Register Vehicle
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </VehicleOwnerLayout>
  );
}