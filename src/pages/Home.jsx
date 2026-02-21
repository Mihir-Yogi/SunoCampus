import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-fadeIn">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🎓</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-slideUp">
            Welcome to <span className="text-gradient">SunoCampus</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 mb-8 animate-slideUp" style={{ animationDelay: '0.1s' }}>
            Your Modern College Social Network & Event Management Platform
          </p>

          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.2s' }}>
            Connect with your college community, discover events, and stay engaged with campus activities all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slideUp" style={{ animationDelay: '0.3s' }}>
            <Link
              to="/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center"
            >
              Login to SunoCampus
            </Link>
            <Link
              to="/register"
              className="px-8 py-4 border-2 border-blue-700 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 text-center"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16">
            Why Choose SunoCampus?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🤝',
                title: 'Connect & Engage',
                description: 'Build meaningful connections with your college community'
              },
              {
                icon: '📅',
                title: 'Event Management',
                description: 'Discover and participate in campus events effortlessly'
              },
              {
                icon: '📱',
                title: 'Mobile Friendly',
                description: 'Access SunoCampus anywhere, anytime on any device'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-lg transition-all duration-300 animate-slideUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of students already using SunoCampus to stay connected
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-white text-blue-700 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="text-lg font-semibold text-white mb-2">SunoCampus</p>
            <p>Your College Social Network & Event Management Platform</p>
            <p className="text-sm mt-4">© 2026 SunoCampus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
