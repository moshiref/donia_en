import { useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import SplashScreen from "./components/SplashScreen";

function App() {
  const [showSplash, setShowSplash] = useState(
    () =>
      !sessionStorage.getItem("splashShown") &&
      window.matchMedia("(max-width: 767px)").matches
  );


  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return <AppRoutes />;
}

export default App;
