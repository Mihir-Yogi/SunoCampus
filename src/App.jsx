import logo from "../public/assets/sunocampus_logo.png";

function App() {
  return (
    <div className="h-screen w-screen bg-[#0B1F3B] flex items-center justify-center">
      <img
        src={logo}  
        alt="Suno Campus Logo"
        className="w-96 object-contain"
      />
    </div>
  );
}

export default App;