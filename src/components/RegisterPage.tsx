import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { 
  UserPlus, 
  Eye, 
  EyeOff,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Shield,
  ArrowRight,
  FileText,
  Bus
} from 'lucide-react';
import { motion } from 'motion/react';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    dateOfBirth: '',
    
    // Address Information
    county: '',
    town: '',
    address: '',
    
    // Business Information
    businessName: '',
    businessType: '',
    membershipType: 'individual',
    
    // Account Setup
    password: '',
    confirmPassword: '',
    
    // Agreements
    termsAccepted: false,
    privacyAccepted: false,
    marketingConsent: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate registration
    setTimeout(() => {
      setIsLoading(false);
      alert('Registration successful! Please check your email for verification. (Demo)');
      onNavigate('login');
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const membershipTypes = [
    {
      type: 'individual',
      title: 'Individual Membership',
      price: 'KSH 5,000',
      description: 'Perfect for individual matatu operators',
      features: ['Personal savings account', 'Vehicle loans up to KSH 2M', 'Basic insurance']
    },
    {
      type: 'business',
      title: 'Business Membership',
      price: 'KSH 15,000',
      description: 'Ideal for matatu business owners',
      features: ['Business savings account', 'Vehicle loans up to KSH 10M', 'Comprehensive insurance'],
      popular: true
    },
    {
      type: 'group',
      title: 'Group Membership',
      price: 'KSH 25,000',
      description: 'For transport SACCOs and groups',
      features: ['Group savings management', 'Bulk loan facilities', 'Group insurance discounts']
    }
  ];

  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Machakos', 'Meru', 'Thika',
    'Nyeri', 'Kitale', 'Kakamega', 'Kericho', 'Malindi', 'Garissa', 'Isiolo'
  ];

  const businessTypes = [
    'Matatu Operations', 'Transport Business', 'Fleet Management', 'Taxi Services',
    'Logistics & Delivery', 'Car Hire', 'Motorcycle Transport', 'Other'
  ];

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Address & Business', icon: Building },
    { number: 3, title: 'Membership Type', icon: FileText },
    { number: 4, title: 'Account Setup', icon: Shield }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h3>
              <p className="text-gray-600">Let's start with your basic details</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  className="pl-12"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+254 xxx xxx xxx"
                    className="pl-12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  National ID Number *
                </label>
                <Input
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                  placeholder="12345678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <Input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Address & Business Information</h3>
              <p className="text-gray-600">Tell us about your location and business</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County *
                </label>
                <select
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--neon-turquoise)] focus:border-transparent"
                >
                  <option value="">Select County</option>
                  {counties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Town/City *
                </label>
                <Input
                  name="town"
                  value={formData.town}
                  onChange={handleChange}
                  required
                  placeholder="Enter your town/city"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Physical Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter your physical address"
                  className="pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name (Optional)
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Enter your business name"
                  className="pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--neon-turquoise)] focus:border-transparent"
              >
                <option value="">Select Business Type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Membership Type</h3>
              <p className="text-gray-600">Select the membership package that fits your needs</p>
            </div>

            <div className="space-y-4">
              {membershipTypes.map((membership) => (
                <div key={membership.type} className="relative">
                  {membership.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-gray-900">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <label className={`block cursor-pointer ${membership.popular ? 'pt-4' : ''}`}>
                    <input
                      type="radio"
                      name="membershipType"
                      value={membership.type}
                      checked={formData.membershipType === membership.type}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <Card className={`p-6 border-2 transition-all duration-300 ${
                      formData.membershipType === membership.type
                        ? 'border-[var(--neon-turquoise)] bg-[var(--neon-turquoise)]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{membership.title}</h4>
                          <p className="text-gray-600 text-sm">{membership.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[var(--neon-purple)]">{membership.price}</div>
                          <div className="text-xs text-gray-500">One-time fee</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {membership.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-[var(--neon-turquoise)] mr-2 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Secure Your Account</h3>
              <p className="text-gray-600">Create a strong password and review our terms</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a strong password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, termsAccepted: checked as boolean })
                  }
                  required
                />
                <div className="text-sm">
                  <label htmlFor="terms" className="text-gray-700">
                    I agree to the{' '}
                    <a href="#" className="text-[var(--neon-turquoise)] hover:underline">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-[var(--neon-turquoise)] hover:underline">
                      Membership Agreement
                    </a>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={formData.privacyAccepted}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, privacyAccepted: checked as boolean })
                  }
                  required
                />
                <div className="text-sm">
                  <label htmlFor="privacy" className="text-gray-700">
                    I acknowledge that I have read and understand the{' '}
                    <a href="#" className="text-[var(--neon-turquoise)] hover:underline">
                      Privacy Policy
                    </a>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, marketingConsent: checked as boolean })
                  }
                />
                <div className="text-sm">
                  <label htmlFor="marketing" className="text-gray-700">
                    I consent to receive marketing communications and updates about MATIS services
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-[var(--neon-turquoise)]/10 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-[var(--neon-turquoise)] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <div className="font-semibold mb-1">Data Protection Notice</div>
                  <div>
                    Your personal information is encrypted and stored securely. We comply with 
                    Kenya's Data Protection Act and never share your data with third parties 
                    without your consent.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--neon-yellow)] via-[var(--neon-orange)] to-[var(--neon-purple)] p-0.5">
              <div className="w-full h-full bg-gray-900 rounded-xl flex items-center justify-center">
                <Bus className="w-6 h-6 text-[var(--neon-turquoise)]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">MATIS</h1>
              <p className="text-[var(--neon-turquoise)] text-sm">Transport Solutions</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Join Our
            <span className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-turquoise)] bg-clip-text text-transparent"> Community</span>
          </h2>
          <p className="text-xl text-gray-300">
            Start your journey to financial freedom with Kenya's leading transport SACCO
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur rounded-full px-6 py-3">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center space-x-2 ${
                  currentStep >= step.number 
                    ? 'text-[var(--neon-turquoise)]' 
                    : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step.number
                      ? 'bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)]'
                      : 'bg-gray-600'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <step.icon className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    currentStep > step.number 
                      ? 'bg-[var(--neon-turquoise)]' 
                      : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Card className="p-8 bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
            <form onSubmit={handleSubmit}>
              {renderStepContent()}

              <div className="flex justify-between mt-8">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onNavigate('login')}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Already have an account?
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || (currentStep === 4 && (!formData.termsAccepted || !formData.privacyAccepted))}
                  className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 px-8"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </div>
                  ) : currentStep === 4 ? (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create Account
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-8"
        >
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Your information is protected with bank-level security</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}