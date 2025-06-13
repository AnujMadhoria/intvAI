import { FaVideo, FaUserTie, FaCalendarAlt, FaChartLine, FaLightbulb } from 'react-icons/fa';
import { FiArrowRight, FiFileText } from 'react-icons/fi';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation */}
      <nav className="bg-blue-800 text-white px-4 sm:px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/intvLogo.png" alt="Logo" className="w-14 h-12 rounded-sm" />
            <span className="text-lg sm:text-xl font-bold">InterviewConnect</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#features" className="hover:text-blue-200 transition">Features</a>
            <a href="#how-it-works" className="hover:text-blue-200 transition">How It Works</a>
            <a href="#testimonials" className="hover:text-blue-200 transition">Testimonials</a>
          </div>
          <div className="hidden sm:flex space-x-3">
            <a href="/auth" className="px-4 py-2 rounded hover:bg-blue-700 transition">Login</a>
            <a href="/auth" className="bg-white text-blue-800 px-4 py-2 rounded font-semibold hover:bg-blue-100 transition">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
              Revolutionize Your Interview Process
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-6">
              Seamless video interviews with candidate tracking, real-time feedback, and automated scheduling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a href="/auth" className="bg-white text-blue-800 px-6 py-3 rounded font-bold flex items-center justify-center hover:bg-blue-100 transition">
                Start Free Trial <FiArrowRight className="ml-2" />
              </a>
              <a href="#demo" className="border-2 border-white px-6 py-3 rounded font-bold hover:bg-blue-700 transition text-white">
                Watch Demo
              </a>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute -top-6 -left-6 w-full h-full border-4 border-blue-400 rounded-xl hidden sm:block"></div>
              <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                  alt="Dashboard"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Everything you need to conduct efficient and effective interviews
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <FaVideo />, title: "Live Video Interviews", desc: "High-quality video calls with screen sharing, recording, and real-time collaboration tools." },
              { icon: <FaUserTie />, title: "Candidate Evaluation", desc: "Rate candidates during interviews with our structured evaluation framework." },
              { icon: <FaCalendarAlt />, title: "Automated Scheduling", desc: "Eliminate scheduling headaches with calendar integration and auto-reminders." },
              { icon: <FaChartLine />, title: "Analytics Dashboard", desc: "Track interview metrics and pipeline with visualizations." },
              { icon: <FaLightbulb />, title: "Smart Recommendations", desc: "AI suggests top candidates based on your criteria." },
              { icon: <FiFileText />, title: "Resume Integration", desc: "View resumes side-by-side with your evaluation notes." }
            ].map((f, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition">
                <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4 text-xl text-blue-800">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Get started in minutes with our simple three-step process</p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            {["Schedule Interviews", "Conduct Interviews", "Make Decisions"].map((step, i) => (
              <div key={i} className="text-center max-w-xs">
                <div className="bg-blue-800 text-white w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{step}</h3>
                <p className="text-gray-600 text-sm">
                  {i === 0 ? "Set up interviews with candidate email and time." : i === 1 ? "Join call, evaluate and take notes." : "Compare and select top talent."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-800 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Hiring?</h2>
          <p className="text-blue-100 text-lg mb-6">Join thousands who interview better with InterviewConnect</p>
          <a href="/auth" className="bg-white text-blue-800 px-6 py-3 rounded-lg font-bold hover:bg-blue-100 transition text-lg">
            Start Your Free Trial
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/intvLogo.png" alt="Logo" className="w-14 h-12 rounded-sm" />
              <span className="text-lg font-bold text-white">InterviewConnect</span>
            </div>
            <p className="text-sm">The modern platform for conducting and managing interviews.</p>
          </div>

          {[
            { title: "Product", items: ["Features", "Pricing", "Demo"] },
            { title: "Company", items: ["About Us", "Careers", "Contact"] },
            { title: "Legal", items: ["Privacy Policy", "Terms of Service", "Security"] },
          ].map((section, idx) => (
            <div key={idx}>
              <h4 className="text-white font-bold mb-3">{section.title}</h4>
              <ul className="space-y-2 text-sm">
                {section.items.map((item, i) => (
                  <li key={i}><a href="#" className="hover:text-white">{item}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center text-sm mt-8 border-t border-gray-700 pt-4">
          &copy; {new Date().getFullYear()} InterviewConnect. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
