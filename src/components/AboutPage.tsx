import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  Users, 
  Target, 
  Heart, 
  Award, 
  TrendingUp, 
  Shield,
  CheckCircle2,
  Bus,
  Handshake,
  Lightbulb
} from 'lucide-react';
import { motion } from 'motion/react';

export function AboutPage() {
  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "We put our members and their communities at the heart of everything we do.",
      color: "from-[var(--neon-yellow)] to-[var(--neon-orange)]"
    },
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "Building lasting relationships through honest, transparent financial services.",
      color: "from-[var(--neon-turquoise)] to-[var(--electric-blue)]"
    },
    {
      icon: TrendingUp,
      title: "Growth & Innovation",
      description: "Continuously evolving to meet the changing needs of the transport sector.",
      color: "from-[var(--neon-purple)] to-[var(--hot-pink)]"
    },
    {
      icon: Handshake,
      title: "Partnership",
      description: "Working together with members to build sustainable transport businesses.",
      color: "from-[var(--neon-orange)] to-[var(--neon-purple)]"
    }
  ];

  const milestones = [
    {
      year: "2020",
      title: "Foundation",
      description: "MATIS was founded with a vision to transform matatu transport financing."
    },
    {
      year: "2021",
      title: "First 100 Members",
      description: "Reached our first milestone of 100 registered members and disbursed initial loans."
    },
    {
      year: "2022",
      title: "Digital Transformation",
      description: "Launched our digital platform, making services accessible 24/7."
    },
    {
      year: "2023",
      title: "Regional Expansion",
      description: "Expanded operations to serve matatu operators across major Kenyan cities."
    },
    {
      year: "2024",
      title: "500+ Members Strong",
      description: "Celebrating over 500 active members and KSH 50M+ in loans disbursed."
    }
  ];

  const team = [
    {
      name: "David Maina",
      role: "Chief Executive Officer",
      description: "Former matatu operator with 15+ years in transport business",
    },
    {
      name: "Sarah Wanjala",
      role: "Chief Financial Officer",
      description: "Financial services expert with background in microfinance",
    },
    {
      name: "Michael Ochieng",
      role: "Head of Operations",
      description: "Technology leader passionate about digital financial inclusion",
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Our Story:
                <br />
                <span className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-turquoise)] bg-clip-text text-transparent">
                  Empowering Dreams
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Born from the vibrant streets of Nairobi, MATIS emerged from a simple belief: 
                every matatu operator deserves access to fair financial services that help them build 
                sustainable businesses and support their families.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--neon-yellow)] mb-2">500+</div>
                  <div className="text-gray-400">Happy Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--neon-turquoise)] mb-2">4+</div>
                  <div className="text-gray-400">Years of Service</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1585924775127-a4a2c546f99e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY29tbXVuaXR5JTIwc2F2aW5ncyUyMGZpbmFuY2UlMjBjb29wZXJhdGl2ZXxlbnwxfHx8fDE3NTYzMzc3MDl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Community meeting"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
              </div>
              <motion.div
                className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-[var(--neon-yellow)] to-[var(--neon-orange)] rounded-full flex items-center justify-center shadow-lg"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <Bus className="w-12 h-12 text-gray-900" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="p-8 h-full border-0 shadow-lg bg-gradient-to-br from-[var(--neon-yellow)]/10 to-[var(--neon-orange)]/10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] rounded-xl flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-gray-900" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  To provide accessible, innovative financial services that empower matatu operators 
                  and transport entrepreneurs to build sustainable businesses, support their families, 
                  and contribute to Kenya's economic growth through a cooperative approach rooted in 
                  community values and mutual support.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 h-full border-0 shadow-lg bg-gradient-to-br from-[var(--neon-turquoise)]/10 to-[var(--electric-blue)]/10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] rounded-xl flex items-center justify-center mr-4">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  To be East Africa's leading cooperative financial institution for the transport sector, 
                  recognized for transforming lives through innovative financial solutions, fostering 
                  community development, and setting the standard for inclusive, technology-driven 
                  cooperative banking.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our
              <span className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] bg-clip-text text-transparent"> Core Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do and shape our relationships with members, 
              partners, and communities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="p-6 h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${value.color} p-0.5 mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                      <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                        <value.icon className="w-8 h-8 text-gray-900" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our
              <span className="bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-purple)] bg-clip-text text-transparent"> Journey</span>
            </h2>
            <p className="text-xl text-gray-600">
              From humble beginnings to serving hundreds of members across Kenya.
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gradient-to-b from-[var(--neon-yellow)] to-[var(--neon-purple)]"></div>

            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`relative flex items-center mb-12 ${
                  index % 2 === 0 ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                  <Card className="p-6 border-0 shadow-lg">
                    <div className={`text-2xl font-bold mb-2 bg-gradient-to-r ${
                      index % 2 === 0 
                        ? 'from-[var(--neon-turquoise)] to-[var(--electric-blue)]' 
                        : 'from-[var(--neon-yellow)] to-[var(--neon-orange)]'
                    } bg-clip-text text-transparent`}>
                      {milestone.year}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </Card>
                </div>
                
                {/* Timeline Dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-purple)] rounded-full border-4 border-white shadow-lg"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Meet Our
              <span className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--hot-pink)] bg-clip-text text-transparent"> Leadership Team</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Passionate leaders with deep understanding of the transport sector and commitment to our members' success.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-20 h-20 bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-purple)] rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <div className="text-[var(--neon-purple)] font-medium mb-3">{member.role}</div>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Impact on Communities
            </h2>
            <p className="text-xl text-gray-800 mb-12 max-w-3xl mx-auto">
              Every loan, every savings account, every service we provide contributes to building 
              stronger, more resilient transport communities across Kenya.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: CheckCircle2, title: "Lives Transformed", value: "500+" },
                { icon: Bus, title: "Vehicles Financed", value: "200+" },
                { icon: Heart, title: "Families Supported", value: "1,500+" }
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.title}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}