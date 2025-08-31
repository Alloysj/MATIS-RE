import { Button } from './ui/button';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  Bus, 
  Users, 
  Shield, 
  TrendingUp, 
  Coins, 
  FileText, 
  Phone, 
  MapPin,
  Star,
  ArrowRight,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const features = [
    {
      icon: Users,
      title: "Membership Management",
      description: "Easy registration and member management for your SACCO",
      color: "from-[var(--neon-yellow)] to-[var(--neon-orange)]"
    },
    {
      icon: Bus,
      title: "Fleet Management",
      description: "Track and manage your matatu fleet efficiently",
      color: "from-[var(--neon-turquoise)] to-[var(--electric-blue)]"
    },
    {
      icon: Coins,
      title: "Savings & Loans",
      description: "Secure savings and accessible loan services",
      color: "from-[var(--neon-purple)] to-[var(--hot-pink)]"
    },
    {
      icon: Shield,
      title: "Insurance Services",
      description: "Comprehensive insurance coverage for members",
      color: "from-[var(--neon-orange)] to-[var(--neon-purple)]"
    },
    {
      icon: FileText,
      title: "Smart Reporting",
      description: "Real-time analytics and financial reports",
      color: "from-[var(--electric-blue)] to-[var(--neon-turquoise)]"
    },
    {
      icon: TrendingUp,
      title: "Growth Tracking",
      description: "Monitor your SACCO's growth and performance",
      color: "from-[var(--lime-green)] to-[var(--neon-turquoise)]"
    }
  ];

  const testimonials = [
    {
      name: "James Mwangi",
      role: "SACCO Chairman",
      content: "MATIS has transformed how we manage our matatu operations. Our members are happier and our processes are streamlined.",
      rating: 5
    },
    {
      name: "Grace Wanjiku",
      role: "Matatu Owner",
      content: "The loan services are incredible. I was able to expand my fleet and increase my income significantly.",
      rating: 5
    },
    {
      name: "Peter Kiprotich",
      role: "Driver",
      content: "Finally, a SACCO that understands our needs. The insurance coverage gives me peace of mind every day.",
      rating: 5
    }
  ];

  const stats = [
    { number: "500+", label: "Active Members", icon: Users },
    { number: "200+", label: "Matatus Managed", icon: Bus },
    { number: "KSH 50M+", label: "Loans Disbursed", icon: Coins },
    { number: "99.9%", label: "Uptime", icon: Zap }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent"></div>
          </div>
          <motion.div
            className="absolute top-20 left-20 w-20 h-20 rounded-full bg-gradient-to-br from-[var(--neon-turquoise)] to-transparent opacity-60 blur-xl"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-40 right-32 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--neon-purple)] to-transparent opacity-40 blur-xl"
            animate={{
              y: [0, 30, 0],
              x: [0, -15, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-1/2 left-10 w-16 h-16 rounded-full bg-gradient-to-br from-[var(--neon-orange)] to-transparent opacity-50 blur-lg"
            animate={{
              y: [0, -25, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-[var(--neon-yellow)] via-[var(--neon-orange)] to-[var(--neon-purple)] bg-clip-text text-transparent">
                Empowering
              </span>
              <br />
              <span className="text-white">Matatu Owners</span>
              <br />
              <span className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] bg-clip-text text-transparent">
                & Communities
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Join Kenya's most vibrant SACCO platform designed specifically for matatu operators. 
              Save, invest, grow, and protect your transport business with our comprehensive financial services.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Button
              size="lg"
              onClick={() => onNavigate('register')}
              className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-gray-900 hover:shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
            >
              <UserPlus className="w-6 h-6 mr-2" />
              Join MATIS Today
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('about')}
              className="border-[var(--neon-turquoise)] text-[var(--neon-turquoise)] hover:bg-[var(--neon-turquoise)] hover:text-gray-900 transition-all duration-300 px-8 py-6 text-lg"
            >
              Learn More
            </Button>
          </motion.div>

          {/* Floating Matatu Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1604380441509-0ceda4aff0a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrZW55YW4lMjBtYXRhdHUlMjBjb2xvcmZ1bCUyMGJ1cyUyMHRyYW5zcG9ydHxlbnwxfHx8fDE3NTYzMzc3MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Colorful Kenyan Matatu"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
            </div>
            <motion.div
              className="absolute -top-4 -right-4 w-8 h-8 bg-[var(--neon-turquoise)] rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                    <stat.icon className="w-8 h-8 text-[var(--neon-turquoise)]" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-800">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] bg-clip-text text-transparent"> Grow Your Business</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From fleet management to financial services, we've got all the tools to help your matatu business thrive.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="p-8 h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                        <feature.icon className="w-8 h-8 text-gray-900" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              What Our
              <span className="bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-purple)] bg-clip-text text-transparent"> Members Say</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied members who have transformed their transport businesses with MATIS.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="p-8 h-full border-0 shadow-lg">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-[var(--neon-yellow)] fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to
              <span className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-turquoise)] bg-clip-text text-transparent"> Transform</span>
              <br />
              Your Matatu Business?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join MATIS today and experience the future of transport finance. Your journey to financial freedom starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => onNavigate('register')}
                className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-white hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
              >
                <CheckCircle2 className="w-6 h-6 mr-2" />
                Start Your Journey
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('contact')}
                className="border-[var(--neon-yellow)] text-[var(--neon-yellow)] hover:bg-[var(--neon-yellow)] hover:text-gray-900 transition-all duration-300 px-8 py-6 text-lg"
              >
                <Phone className="w-6 h-6 mr-2" />
                Contact Us
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--neon-yellow)] via-[var(--neon-orange)] to-[var(--neon-purple)] p-0.5">
                  <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                    <Bus className="w-5 h-5 text-[var(--neon-turquoise)]" />
                  </div>
                </div>
                <div>
                  <div className="font-bold text-lg">MATIS</div>
                  <div className="text-sm text-gray-400">Matatu Transport Solutions</div>
                </div>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                Transforming matatu transport through innovative financial services and community-focused solutions.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>Nairobi, Kenya</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>+254 700 000 000</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <div className="space-y-2">
                {['About Us', 'How to Join', 'Services', 'FAQ'].map((link) => (
                  <button
                    key={link}
                    className="block text-gray-400 hover:text-[var(--neon-turquoise)] transition-colors duration-300"
                    onClick={() => onNavigate(link.toLowerCase().replace(' ', ''))}
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Services</h4>
              <div className="space-y-2 text-gray-400">
                <div>Fleet Management</div>
                <div>Savings & Loans</div>
                <div>Insurance</div>
                <div>Financial Reports</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 MATIS. All rights reserved. Built with ❤️ for the matatu community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function UserPlus({ className }: { className?: string }) {
  return <Users className={className} />;
}