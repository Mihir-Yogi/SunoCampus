import { Link } from "react-router-dom";

function About() {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide">
              Welcome to SunoCampus
            </span>
            <h1 className="text-5xl font-bold mt-4 mb-6">
              The Voice of <br />
              <span className="text-blue-600">Your Campus</span>
            </h1>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              SunoCampus is your college-focused social networking and event management 
              platform that brings students, contributors, and campus events together in 
              one place. Never miss out on events, opportunities, and peer connections again.
            </p>
            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Get Started
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-gray-400 transition">
                Learn More
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600"
                alt="Students collaborating"
                className="rounded-lg w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
            <div className="text-gray-600">Partner Colleges</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">10k+</div>
            <div className="text-gray-600">Active Students</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">100+</div>
            <div className="text-gray-600">Events Monthly</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-gray-600">Platform Support</div>
          </div>
        </div>
      </section>

      {/* Our Purpose Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Our Purpose</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Connecting campus communities and empowering students to make the most of their college experience
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To create a central hub where students never miss campus events, opportunities, 
                or connections. We're building a trusted platform that brings college life together, 
                making it easier for students to engage, contribute, and grow.
              </p>
            </div>

            {/* Vision Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">👁️</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To become the go-to platform for every college student across the country. 
                We envision a future where campus communities are connected, informed, and 
                empowered to make the most of their academic journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Everything you need to succeed on campus
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Discover features designed to enhance your college experience
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Social Networking */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-blue-50 transition">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Social Networking</h3>
              <p className="text-gray-600">
                Connect with peers across colleges, share posts, like, comment, 
                and build meaningful campus relationships.
              </p>
            </div>

            {/* Event Management */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-blue-50 transition">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Event Management</h3>
              <p className="text-gray-600">
                Browse campus events, apply to participate, and never miss an 
                opportunity. From workshops to fests, it's all here.
              </p>
            </div>

            {/* Verified Content */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:bg-blue-50 transition">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Verified Content</h3>
              <p className="text-gray-600">
                One verified contributor per college ensures authentic, 
                trustworthy content from official campus representatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Your Journey with SunoCampus
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-blue-50 rounded-2xl p-8 flex items-start gap-6">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Stay Updated</h3>
                <p className="text-gray-700">
                  Register and instantly access a vibrant social feed with campus posts, 
                  event listings, and community updates. Like, comment, share, and bookmark 
                  content that matters to you.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-green-50 rounded-2xl p-8 flex items-start gap-6">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Connect & Collaborate</h3>
                <p className="text-gray-700">
                  Engage with students from your college and beyond. Discover events, 
                  apply for opportunities, and build connections that last beyond graduation. 
                  Want to do more? Apply to become a contributor!
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-purple-50 rounded-2xl p-8 flex items-start gap-6">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Grow & Succeed</h3>
                <p className="text-gray-700">
                  As a verified contributor, publish posts and create events to shape your 
                  campus community. One representative per college ensures quality content 
                  and authentic campus experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to be part of the change?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students already connected on SunoCampus. 
            Your campus community awaits!
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Sign Up Now
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">SunoCampus</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Press Kit</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Features</a></li>
              <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition">Updates</a></li>
              <li><a href="#" className="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Licenses</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Connect</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white transition">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p>&copy; 2026 SunoCampus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default About;
