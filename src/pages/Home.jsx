import { Link } from "react-router-dom";
import logo from "../../public/assets/sunocampus_logo.png";

function Home() {
  return (
    <div className="h-screen w-screen bg-[#0B1F3B] flex flex-col items-center justify-center gap-8">
      <img
        src={logo}  
        alt="Suno Campus Logo"
        className="w-96 object-contain"
      />
      <Link 
        to="/about"
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Explore About Us
      </Link>
    </div>
  );
}

export default Home;
