import { useState, useEffect } from "react";

const SplashScreen = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // منع التمرير أثناء عرض شاشة البداية
    document.body.style.overflow = "hidden";

    const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
    const finishTimer = setTimeout(() => {
      sessionStorage.setItem("splashShown", "true");
      document.body.style.overflow = "";
      onFinish();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      document.body.style.overflow = "";
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] w-full h-screen overflow-hidden bg-black transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ animation: "splashFadeIn 0.4s ease-out" }}
    >
      <img
        src="/img/poster.webp"
        alt="Dunya English Platform"
        className="w-full h-screen object-cover"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        style={{
          animation: "splashZoom 2.5s ease-out forwards",
        }}
      />

      {/* Overlay أسود شفاف */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
        <div
          className="h-full bg-white"
          style={{
            animation: "splashProgress 2.5s linear forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes splashZoom {
          from { transform: scale(1); }
          to { transform: scale(1.03); }
        }
        @keyframes splashProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
