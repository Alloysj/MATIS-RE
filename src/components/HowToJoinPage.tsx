import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  UserPlus, 
  FileText, 
  CheckCircle2, 
  Bus, 
  TrendingUp,
  Clock,
  Shield,
  Coins,
  Phone,
  IdCard,
  Car,
  DollarSign,
  ArrowRight,
  Download,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

interface HowToJoinPageProps {
  onNavigate: (page: string) => void;
}

export function HowToJoinPage({ onNavigate }: HowToJoinPageProps) {
  const steps = [
    {
      step: 1,
      title: "Submit Application",
      description: "Fill out our simple membership application form with your personal and business details.",
      icon: FileText,
      color: "from-[var(--neon-yellow)] to-[var(--neon-orange)]",
      requirements: [
        "Valid national ID or passport",
        "Proof of residence",
        "Business registration (if applicable)",
        "Completed application form"
      ]
    },
    {
      step: 2,
      title: "Document Verification",
      description: "Our team reviews your application and verifies all submitted documents.",
      icon: Shield,
      color: "from-[var(--neon-turquoise)] to-[var(--electric-blue)]",
      requirements: [
        "Background verification",
        "Document authentication",
        "Reference checks",
        "Business validation"
      ]
    },
    {
      step: 3,
      title: "Membership Approval",
      description: "Upon successful verification, your membership is approved and activated.",
      icon: CheckCircle2,
      color: "from-[var(--neon-purple)] to-[var(--hot-pink)]",
      requirements: [
        "Approval notification",
        "Membership number assignment",
        "Welcome package",
        "Account setup"
      ]
    },
    {
      step: 4,
      title: "Vehicle Registration",
      description: "Register your matatu(s) with our fleet management system.",
      icon: Bus,
      color: "from-[var(--neon-orange)] to-[var(--neon-purple)]",
      requirements: [
        "Vehicle logbook",
        "Insurance certificate",
        "Route permit",
        "Vehicle inspection"
      ]
    },
    {
      step: 5,
      title: "Start Earning",
      description: "Begin accessing our services and growing your transport business.",
      icon: TrendingUp,
      color: "from-[var(--lime-green)] to-[var(--neon-turquoise)]",
      requirements: [
        "Savings account activation",
        "Loan eligibility assessment",
        "Insurance enrollment",
        "Digital platform access"
      ]
    }
  ];

  const benefits = [
    {
      icon: Coins,
      title: "Competitive Loan Rates",
      description: "Access loans at attractive interest rates starting from 12% per annum",
      highlight: "From 12% p.a."
    },
    {
      icon: Shield,
      title: "Comprehensive Insurance",
      description: "Vehicle and personal insurance coverage for complete peace of mind",
      highlight: "Full Coverage"
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Join a network of over 500 successful matatu operators",
      highlight: "500+ Members"
    },
    {
      icon: Clock,
      title: "24/7 Digital Access",
      description: "Manage your account, apply for loans, and track payments online",
      highlight: "24/7 Access"
    }
  ];

  const membershipTypes = [
    {
      type: "Individual Membership",
      price: "KSH 5,000",
      description: "Perfect for individual matatu operators",
      features: [
        "Personal savings account",
        "Vehicle loans up to KSH 2M",
        "Basic insurance coverage",
        "Monthly financial reports",
        "Mobile banking access"
      ],
      popular: false
    },
    {
      type: "Business Membership",
      price: "KSH 15,000",
      description: "Ideal for matatu business owners with multiple vehicles",
      features: [
        "Business savings account",
        "Vehicle loans up to KSH 10M",
        "Comprehensive insurance",
        "Fleet management tools",
        "Priority customer support",
        "Investment opportunities"
      ],
      popular: true
    },
    {
      type: "Group Membership",
      price: "KSH 25,000",
      description: "For established transport SACCOs and groups",
      features: [
        "Group savings management",
        "Bulk loan facilities",
        "Group insurance discounts",
        "Advanced reporting",
        "Dedicated relationship manager",
        "Custom financial products"
      ],
      popular: false
    }
  ];

  const faqs = [
    {
      question: "How long does the approval process take?",
      answer: "Typically 3-5 business days after submitting all required documents."
    },
    {
      question: "What is the minimum age requirement?",
      answer: "You must be at least 18 years old and have a valid national ID."
    },
    {
      question: "Can I apply if I don't own a matatu yet?",
      answer: "Yes! We offer vehicle acquisition loans to help you purchase your first matatu."
    },
    {
      question: "Are there any hidden fees?",
      answer: "No hidden fees. All charges are clearly outlined in our fee structure."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Join
              <span className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-turquoise)] bg-clip-text text-transparent"> Vuka SACCO</span>
              <br />
              in 5 Simple Steps
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Transform your matatu business with our comprehensive financial services. 
              Join hundreds of successful operators who trust Vuka SACCO.
            </p>
            <Button
              size="lg"
              onClick={() => onNavigate('register')}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-white hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
            >
              <UserPlus className="w-6 h-6 mr-2" />
              Start Your Application
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose
              <span className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] bg-clip-text text-transparent"> Vuka SACCO?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the benefits that over 500 members already enjoy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="p-6 h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-8 h-8 text-gray-900" />
                  </div>
                  <Badge className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-white mb-3">
                    {benefit.highlight}
                  </Badge>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Your Journey to
              <span className="bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-purple)] bg-clip-text text-transparent"> Financial Freedom</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Follow these 5 simple steps to become a Vuka SACCO member and unlock exclusive benefits.
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className={`grid lg:grid-cols-2 gap-8 items-center ${
                    index % 2 === 0 ? '' : 'lg:grid-flow-col-dense'
                  }`}>
                    <div className={index % 2 === 0 ? '' : 'lg:col-start-2'}>
                      <div className="flex items-center mb-6">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center mr-4`}>
                          <step.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <Badge className={`bg-gradient-to-r ${step.color} text-white mb-2`}>
                            Step {step.step}
                          </Badge>
                          <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-6 leading-relaxed">{step.description}</p>
                      <div className="space-y-2">
                        {step.requirements.map((req, reqIndex) => (
                          <div key={reqIndex} className="flex items-center text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-[var(--neon-turquoise)] mr-2 flex-shrink-0" />
                            {req}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`relative ${index % 2 === 0 ? '' : 'lg:col-start-1 lg:row-start-1'}`}>
                      <div className={`w-32 h-32 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto shadow-lg`}>
                        <step.icon className="w-16 h-16 text-white" />
                      </div>
                      <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                        {step.step}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              onClick={() => onNavigate('register')}
              className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--hot-pink)] text-white hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
            >
              <Download className="w-6 h-6 mr-2" />
              Download Application Form
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Membership Types */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Choose Your
              <span className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] bg-clip-text text-transparent"> Membership Type</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select the membership package that best fits your business needs and goals.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {membershipTypes.map((membership, index) => (
              <motion.div
                key={membership.type}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {membership.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-gray-900 px-6 py-2">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={`p-8 h-full text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  membership.popular 
                    ? 'ring-2 ring-[var(--neon-yellow)] scale-105' 
                    : ''
                }`}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{membership.type}</h3>
                  <div className="text-4xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] bg-clip-text text-transparent">
                      {membership.price}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-8">{membership.description}</p>
                  
                  <div className="space-y-4 mb-8">
                    {membership.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-left">
                        <CheckCircle2 className="w-5 h-5 text-[var(--neon-turquoise)] mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => onNavigate('register')}
                    className={`w-full ${
                      membership.popular
                        ? 'bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-gray-900 hover:shadow-lg hover:shadow-yellow-500/50'
                        : 'bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-white hover:shadow-lg hover:shadow-cyan-500/25'
                    } transition-all duration-300`}
                  >
                    Choose {membership.type}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked
              <span className="bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-purple)] bg-clip-text text-transparent"> Questions</span>
            </h2>
            <p className="text-xl text-gray-600">
              Get answers to common questions about joining Vuka SACCO.
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 border-0 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 mb-6">Have more questions?</p>
            <Button
              variant="outline"
              onClick={() => onNavigate('contact')}
              className="border-[var(--neon-turquoise)] text-[var(--neon-turquoise)] hover:bg-[var(--neon-turquoise)] hover:text-white transition-all duration-300"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact Our Team
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to
              <span className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-turquoise)] bg-clip-text text-transparent"> Start Your Journey?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the hundreds of matatu operators who have transformed their businesses with Vuka SACCO. 
              Your success story starts today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => onNavigate('register')}
                className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-white hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
              >
                <UserPlus className="w-6 h-6 mr-2" />
                Join Vuka SACCO Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('contact')}
                className="border-[var(--neon-yellow)] text-[var(--neon-yellow)] hover:bg-[var(--neon-yellow)] hover:text-gray-900 transition-all duration-300 px-8 py-6 text-lg"
              >
                <Phone className="w-6 h-6 mr-2" />
                Speak to an Expert
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}