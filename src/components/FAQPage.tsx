import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  ChevronDown, 
  ChevronUp, 
  Search,
  HelpCircle,
  Coins,
  Bus,
  Shield,
  Users,
  Phone,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FAQPageProps {
  onNavigate: (page: string) => void;
}

export function FAQPage({ onNavigate }: FAQPageProps) {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      category: "General",
      icon: HelpCircle,
      color: "from-[var(--neon-yellow)] to-[var(--neon-orange)]",
      questions: [
        {
          question: "What is Vuka SACCO?",
          answer: "Vuka SACCO is a digital savings and credit cooperative specifically designed for matatu operators and transport entrepreneurs in Kenya. We provide comprehensive financial services including loans, savings accounts, insurance, and fleet management tools."
        },
        {
          question: "Who can join Vuka SACCO?",
          answer: "Any individual aged 18+ involved in the transport sector can join. This includes matatu owners, drivers, conductors, and transport entrepreneurs. You don't need to own a vehicle to become a member - we also help with vehicle acquisition loans."
        },
        {
          question: "How is Vuka SACCO different from banks?",
          answer: "Unlike banks, we're member-owned and operated, focusing exclusively on the transport sector. We understand your unique challenges and offer tailored solutions with competitive rates, flexible terms, and community-focused approach."
        },
        {
          question: "Is my money safe with Vuka SACCO?",
          answer: "Absolutely! We're licensed and regulated by the Kenya Union of Savings & Credit Co-operatives (KUSCCO) and follow strict financial regulations. All deposits are insured and your funds are secured through robust banking systems."
        }
      ]
    },
    {
      category: "Membership",
      icon: Users,
      color: "from-[var(--neon-turquoise)] to-[var(--electric-blue)]",
      questions: [
        {
          question: "How do I become a member?",
          answer: "Simply fill out our membership application, provide required documents (ID, proof of residence, business registration if applicable), pay the membership fee, and wait for approval. The entire process takes 3-5 business days."
        },
        {
          question: "What are the membership fees?",
          answer: "Individual membership is KSH 5,000, Business membership is KSH 15,000, and Group membership is KSH 25,000. These are one-time fees that give you lifetime access to all our services."
        },
        {
          question: "Can I upgrade my membership type later?",
          answer: "Yes! You can upgrade from Individual to Business or Group membership at any time. You'll only pay the difference in fees, and your membership history and benefits are preserved."
        },
        {
          question: "What happens if I want to leave the SACCO?",
          answer: "Members can withdraw at any time after clearing all outstanding obligations. We'll refund your shares and deposits as per our withdrawal policy. There are no penalties for voluntary withdrawal."
        }
      ]
    },
    {
      category: "Loans",
      icon: Coins,
      color: "from-[var(--neon-purple)] to-[var(--hot-pink)]",
      questions: [
        {
          question: "What types of loans do you offer?",
          answer: "We offer vehicle acquisition loans, emergency loans, business expansion loans, school fees loans, and development loans. All loans are designed specifically for the transport sector's needs."
        },
        {
          question: "What are your interest rates?",
          answer: "Our competitive rates start from 12% per annum for vehicle loans and 15% for other loan types. Rates may vary based on loan amount, repayment period, and member's credit history."
        },
        {
          question: "How quickly can I get a loan?",
          answer: "Once approved, loans are disbursed within 24-48 hours. Emergency loans can be processed and disbursed the same day for urgent situations."
        },
        {
          question: "What do I need to qualify for a loan?",
          answer: "You need to be an active member for at least 3 months, have a regular savings record, provide guarantors or collateral depending on loan amount, and demonstrate ability to repay."
        },
        {
          question: "Can I repay my loan early?",
          answer: "Yes! We encourage early repayment and offer discounts on interest for loans paid before maturity. There are no prepayment penalties."
        }
      ]
    },
    {
      category: "Savings",
      icon: Bus,
      color: "from-[var(--neon-orange)] to-[var(--neon-purple)]",
      questions: [
        {
          question: "What savings products do you offer?",
          answer: "We offer regular savings accounts, fixed deposit accounts, goal-based savings (like vehicle purchase funds), and group savings accounts with competitive interest rates."
        },
        {
          question: "What interest do I earn on my savings?",
          answer: "Regular savings earn 6% per annum, while fixed deposits earn up to 10% per annum depending on the term. Interest is calculated monthly and credited to your account."
        },
        {
          question: "Can I access my savings anytime?",
          answer: "Regular savings can be withdrawn anytime with 24-hour notice. Fixed deposits have specific terms, but we offer emergency withdrawal options with minimal penalties if needed."
        },
        {
          question: "Is there a minimum savings requirement?",
          answer: "Yes, members must maintain a minimum monthly savings of KSH 2,000 for Individual membership, KSH 5,000 for Business membership, and KSH 10,000 for Group membership."
        }
      ]
    },
    {
      category: "Insurance",
      icon: Shield,
      color: "from-[var(--lime-green)] to-[var(--neon-turquoise)]",
      questions: [
        {
          question: "What insurance coverage do you provide?",
          answer: "We offer comprehensive vehicle insurance, personal accident insurance, life insurance, and group insurance packages. All policies are designed specifically for transport sector risks."
        },
        {
          question: "Are insurance premiums competitive?",
          answer: "Yes! As a member-owned organization, we negotiate group rates with insurers, passing savings to our members. Our premiums are typically 15-20% lower than individual policies."
        },
        {
          question: "How do I make insurance claims?",
          answer: "Contact our 24/7 claims helpline immediately after an incident. We'll guide you through the process and ensure fast, fair settlement of genuine claims."
        },
        {
          question: "Is insurance mandatory for all members?",
          answer: "Vehicle insurance is mandatory if you register a vehicle with us. Personal insurance is optional but highly recommended for your protection and your family's security."
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  let questionIndex = 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-10 h-10 text-gray-900" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Frequently Asked
              <br />
              <span className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-turquoise)] bg-clip-text text-transparent">
                Questions
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Get instant answers to all your questions about Vuka SACCO services, 
              membership, loans, savings, and more.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 transition-all duration-300"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {filteredCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              >
                <div className="flex items-center mb-8">
                  <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center mr-4`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">{category.category}</h2>
                </div>

                <div className="space-y-4">
                  {category.questions.map((faq) => {
                    const currentIndex = questionIndex++;
                    return (
                      <Card key={currentIndex} className="border-0 shadow-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion(currentIndex)}
                          className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-300"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                          <div className={`p-2 rounded-full bg-gradient-to-r ${category.color} flex-shrink-0`}>
                            {openQuestion === currentIndex ? (
                              <ChevronUp className="w-5 h-5 text-white" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-white" />
                            )}
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {openQuestion === currentIndex && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="px-6 pb-6 border-t border-gray-100">
                                <p className="text-gray-700 leading-relaxed pt-4">{faq.answer}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try searching with different keywords or browse our categories above.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-20 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Still Have Questions?
            </h2>
            <p className="text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
              Can't find what you're looking for? Our friendly support team is here to help you 24/7.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => onNavigate('contact')}
                className="bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg transition-all duration-300 px-8 py-6 text-lg"
              >
                <MessageCircle className="w-6 h-6 mr-2" />
                Contact Support
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 px-8 py-6 text-lg bg-white"
              >
                <Phone className="w-6 h-6 mr-2" />
                Call Us: +254 700 000 000
              </Button>
            </div>
            
            <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">24/7</div>
                <div className="text-gray-800">Support Available</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">&lt;5min</div>
                <div className="text-gray-800">Average Response Time</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">98%</div>
                <div className="text-gray-800">Customer Satisfaction</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Topics
            </h2>
            <p className="text-xl text-gray-600">
              Most searched questions by our members
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { topic: "Loan Application Process", icon: Coins, count: "156 questions" },
              { topic: "Membership Benefits", icon: Users, count: "89 questions" },
              { topic: "Vehicle Registration", icon: Bus, count: "67 questions" },
              { topic: "Insurance Claims", icon: Shield, count: "45 questions" }
            ].map((topic, index) => (
              <motion.div
                key={topic.topic}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <div className="w-12 h-12 bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <topic.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{topic.topic}</h3>
                  <p className="text-sm text-gray-600">{topic.count}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}