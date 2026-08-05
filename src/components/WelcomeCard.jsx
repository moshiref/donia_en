export default function WelcomeCard({ children }) {
  return (
    <div
      className="w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/60 px-6 py-10 text-center shadow-xl shadow-primary/10 backdrop-blur-lg sm:px-10 sm:py-12 animate-pop-in"
      style={{ animationDelay: "0.15s" }}
    >
      {children}
    </div>
  );
}
