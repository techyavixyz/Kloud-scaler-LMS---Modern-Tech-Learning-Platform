import React from 'react';
import { Cloud, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black/30 backdrop-blur-lg border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-r from-cyan-400 to-blue-500 p-2 rounded-lg">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div className="text-white">
                <div className="text-xl font-bold">Kloud-scaler</div>
                <div className="text-xs text-cyan-300 -mt-1">LMS</div>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-md">
              Master cloud technologies with our comprehensive learning management system. 
              From AWS to Kubernetes, we provide hands-on training for modern DevOps professionals.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {['Home', 'Courses', 'About', 'Contact'].map((item) => (
                <li key={item}>
                  <a href={`/${item.toLowerCase()}`} className="text-gray-300 hover:text-cyan-300 text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Technologies */}
          <div>
            <h3 className="text-white font-semibold mb-4">Technologies</h3>
            <ul className="space-y-2">
              {['AWS', 'Kubernetes', 'Docker', 'Linux', 'Ansible', 'GCP'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-300 hover:text-cyan-300 text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Kloud-scaler LMS. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            {[Github, Twitter, Linkedin].map((Icon, index) => (
              <a
                key={index}
                href="#"
                className="text-gray-400 hover:text-cyan-300 transition-colors"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;