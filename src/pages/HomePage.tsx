import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Cloud, 
  Container, 
  Server, 
  Shield, 
  Settings, 
  Database,
  PlayCircle,
  ArrowRight,
  CheckCircle,
  Users,
  Award,
  BookOpen
} from 'lucide-react';

const HomePage = () => {
  const techTools = [
    {
      name: 'AWS',
      description: 'Master Amazon Web Services with hands-on cloud computing labs and real-world projects.',
      icon: Cloud,
      color: 'from-orange-400 to-yellow-500',
      courses: 15,
      image: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg'
    },
    {
      name: 'Kubernetes',
      description: 'Learn container orchestration, deployment strategies, and cluster management.',
      icon: Settings,
      color: 'from-blue-400 to-cyan-500',
      courses: 12,
      image: 'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg'
    },
    {
      name: 'Docker',
      description: 'Containerize applications and master the Docker ecosystem for modern development.',
      icon: Container,
      color: 'from-cyan-400 to-blue-500',
      courses: 10,
      image: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg'
    },
    {
      name: 'Linux',
      description: 'Deep dive into Linux administration, scripting, and system optimization.',
      icon: Server,
      color: 'from-green-400 to-emerald-500',
      courses: 18,
      image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg'
    },
    {
      name: 'Ansible',
      description: 'Automate IT infrastructure with configuration management and deployment tools.',
      icon: Settings,
      color: 'from-red-400 to-pink-500',
      courses: 8,
      image: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg'
    },
    {
      name: 'GCP',
      description: 'Google Cloud Platform fundamentals, services, and advanced cloud solutions.',
      icon: Database,
      color: 'from-purple-400 to-indigo-500',
      courses: 14,
      image: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg'
    }
  ];

  const features = [
    { title: 'Hands-on Labs', description: 'Practice with real cloud environments', icon: PlayCircle },
    { title: 'Expert Instructors', description: 'Learn from industry professionals', icon: Users },
    { title: 'Certification Prep', description: 'Get ready for official certifications', icon: Award },
    { title: 'Comprehensive Content', description: 'From basics to advanced topics', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Master the{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Cloud
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Accelerate your DevOps journey with hands-on training in cloud technologies, 
            container orchestration, and infrastructure automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/courses"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center group"
            >
              Start Learning
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="border border-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Tools Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Master Modern Technologies
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              From cloud platforms to container orchestration, build the skills that matter in today's tech landscape.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {techTools.map((tool, index) => (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-cyan-500/50"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-20 rounded-bl-3xl" style={{
                  backgroundImage: `linear-gradient(to bottom right, ${tool.color.split(' ')[1]}, ${tool.color.split(' ')[3]})`
                }}></div>
                
                <div className={`bg-gradient-to-r ${tool.color} p-3 rounded-lg w-fit mb-4`}>
                  <tool.icon className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">{tool.name}</h3>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  {tool.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-cyan-300 text-sm font-medium">
                    {tool.courses} Courses
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/courses"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all inline-flex items-center group"
            >
              View All Courses
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Scale Your Skills?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of professionals who have accelerated their careers with Kloud-scaler LMS.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/courses"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center group"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="border border-white/20 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;