import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

/* ───────── Intersection Observer hook ───────── */
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

/* ───────── Animated counter ───────── */
const AnimatedCounter = ({ end, suffix = "", duration = 1800 }) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useInView();

  useEffect(() => {
    if (!isVisible) return;
    const numericEnd = parseInt(end, 10);
    if (isNaN(numericEnd)) {
      setCount(end);
      return;
    }
    let start = 0;
    const step = Math.ceil(numericEnd / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= numericEnd) {
        setCount(numericEnd);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref}>
      {typeof count === "number" ? count : end}
      {suffix}
    </span>
  );
};

/* ───────── Reveal wrapper ───────── */
const Reveal = ({ children, delay = 0, className = "", direction = "up" }) => {
  const [ref, isVisible] = useInView();

  const directionStyles = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
    none: "translate-y-0",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${directionStyles[direction]}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ───────── About Page ───────── */
function About() {
  return (
    <div className="bg-gray-50 overflow-hidden">
      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 px-6 relative">
        {/* Floating decorative blobs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <Reveal delay={0}>
              <span className="inline-block text-blue-600 font-semibold text-sm uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                Welcome to SunoCampus
              </span>
            </Reveal>
            <Reveal delay={120}>
              <h1 className="text-5xl font-bold mt-5 mb-6 leading-tight">
                The Voice of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Your Campus
                </span>
              </h1>
            </Reveal>
            <Reveal delay={240}>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                SunoCampus is your college-focused social networking and event management
                platform that brings students, contributors, and campus events together in
                one place. Never miss out on events, opportunities, and peer connections again.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <div className="flex gap-4">
                <Link
                  to="/register"
                  className="group bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/25 hover:-translate-y-0.5"
                >
                  Get Started
                  <span className="inline-block ml-1 transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                </Link>
                <a
                  href="#features"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-blue-400 hover:text-blue-600 transition-all duration-300"
                >
                  Learn More
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} direction="right">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="relative bg-white rounded-2xl shadow-xl p-6 transition-transform duration-500 group-hover:-translate-y-1">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600"
                  alt="Students collaborating"
                  className="rounded-lg w-full h-80 object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "50", suffix: "+", label: "Partner Colleges" },
            { value: "10", suffix: "k+", label: "Active Students" },
            { value: "100", suffix: "+", label: "Events Monthly" },
            { value: "24/7", suffix: "", label: "Platform Support" },
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 120}>
              <div className="text-center group cursor-default">
                <div className="text-4xl font-bold text-blue-600 mb-2 transition-transform duration-300 group-hover:scale-110">
                  {stat.value === "24/7" ? (
                    "24/7"
                  ) : (
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  )}
                </div>
                <div className="text-gray-600 transition-colors duration-300 group-hover:text-blue-500">
                  {stat.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Our Purpose Section ── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <h2 className="text-4xl font-bold text-center mb-4">Our Purpose</h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Connecting campus communities and empowering students to make the most of their college experience
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8">
            <Reveal delay={0} direction="left">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 group hover:-translate-y-1">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  To create a central hub where students never miss campus events, opportunities,
                  or connections. We're building a trusted platform that brings college life together,
                  making it easier for students to engage, contribute, and grow.
                </p>
              </div>
            </Reveal>

            <Reveal delay={150} direction="right">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 group hover:-translate-y-1">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  <span className="text-3xl">👁️</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  To become the go-to platform for every college student across the country.
                  We envision a future where campus communities are connected, informed, and
                  empowered to make the most of their academic journey.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <h2 className="text-4xl font-bold text-center mb-4">
              Everything you need to succeed on campus
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Discover features designed to enhance your college experience
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "👥",
                color: "blue",
                title: "Social Networking",
                desc: "Connect with peers across colleges, share posts, like, comment, and build meaningful campus relationships.",
              },
              {
                icon: "📅",
                color: "yellow",
                title: "Event Management",
                desc: "Browse campus events, apply to participate, and never miss an opportunity. From workshops to fests, it's all here.",
              },
              {
                icon: "✅",
                color: "green",
                title: "Verified Content",
                desc: "One verified contributor per college ensures authentic, trustworthy content from official campus representatives.",
              },
            ].map((feature, i) => (
              <Reveal key={feature.title} delay={i * 150}>
                <div className="bg-gray-50 rounded-2xl p-8 hover:bg-blue-50 transition-all duration-500 group cursor-default hover:-translate-y-1 hover:shadow-lg">
                  <div
                    className={`w-14 h-14 bg-${feature.color}-100 rounded-full flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110`}
                  >
                    <span className="text-3xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 group-hover:text-blue-700 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Journey Section ── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <h2 className="text-4xl font-bold text-center mb-4">
              Your Journey with SunoCampus
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </Reveal>

          <div className="space-y-6 relative">
            {/* Vertical connecting line */}
            <div className="hidden md:block absolute left-8 top-12 bottom-12 w-0.5 bg-gradient-to-b from-blue-300 via-green-300 to-purple-300 rounded-full" />

            {[
              {
                num: 1,
                bg: "bg-blue-50",
                numBg: "bg-blue-600",
                title: "Stay Updated",
                desc: "Register and instantly access a vibrant social feed with campus posts, event listings, and community updates. Like, comment, share, and bookmark content that matters to you.",
              },
              {
                num: 2,
                bg: "bg-green-50",
                numBg: "bg-green-600",
                title: "Connect & Collaborate",
                desc: "Engage with students from your college and beyond. Discover events, apply for opportunities, and build connections that last beyond graduation. Want to do more? Apply to become a contributor!",
              },
              {
                num: 3,
                bg: "bg-purple-50",
                numBg: "bg-purple-600",
                title: "Grow & Succeed",
                desc: "As a verified contributor, publish posts and create events to shape your campus community. One representative per college ensures quality content and authentic campus experiences.",
              },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 180} direction={i % 2 === 0 ? "left" : "right"}>
                <div
                  className={`${step.bg} rounded-2xl p-8 flex items-start gap-6 group transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5`}
                >
                  <div
                    className={`w-16 h-16 ${step.numBg} text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 shadow-lg`}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/5 rounded-full animate-bounce" style={{ animationDuration: "3s" }} />

        <div className="max-w-4xl mx-auto text-center text-white relative z-10">
          <Reveal>
            <h2 className="text-4xl font-bold mb-4">Ready to be part of the change?</h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students already connected on SunoCampus.
              Your campus community awaits!
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="flex gap-4 justify-center">
              <Link
                to="/register"
                className="group bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              >
                Sign Up Now
                <span className="inline-block ml-1 transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
              </Link>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 hover:-translate-y-0.5">
                Contact Us
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <Reveal delay={0}>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">SunoCampus</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">About Us</Link></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Press Kit</a></li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Updates</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">FAQ</a></li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Licenses</a></li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block">Facebook</a></li>
              </ul>
            </div>
          </Reveal>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p>&copy; 2026 SunoCampus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default About;
