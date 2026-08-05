export default function GradeCard({ label, accent = "primary", delay = "0s", onClick }) {
  const accentStyles = {
    primary: "hover:border-primary/50 hover:text-primary",
    purple: "hover:border-purple/50 hover:text-purple",
  }[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: delay }}
      className={`animate-fade-up flex w-full items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-6 py-5 text-right text-lg font-bold text-navy shadow-md shadow-primary/10 backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 sm:text-xl ${accentStyles}`}
    >
      <span>{label}</span>
      <span aria-hidden="true" className="text-xl">
        ←
      </span>
    </button>
  );
}
