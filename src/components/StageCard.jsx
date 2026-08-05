import { useNavigate } from "react-router-dom";

export default function StageCard({
  icon,
  title,
  description,
  gradesPath,
  accent = "primary",
  delay = "0s",
}) {
  const navigate = useNavigate();

  const accentStyles = {
    primary: {
      ring: "hover:border-primary/50",
      badge: "bg-primary/10 text-primary",
      button: "from-primary to-purple shadow-primary/30 hover:shadow-purple/40",
    },
    purple: {
      ring: "hover:border-purple/50",
      badge: "bg-purple/10 text-purple",
      button: "from-purple to-primary shadow-purple/30 hover:shadow-primary/40",
    },
  }[accent];

  return (
    <div
      className={`animate-fade-up flex w-full flex-col items-center rounded-[2rem] border border-white/60 bg-white/70 p-7 text-center shadow-lg shadow-primary/10 backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8 ${accentStyles.ring}`}
      style={{ animationDelay: delay }}
    >
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl sm:h-20 sm:w-20 sm:text-4xl ${accentStyles.badge}`}
        aria-hidden="true"
      >
        {icon}
      </span>

      <h2 className="mt-5 text-xl font-extrabold text-navy sm:text-2xl">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-navy/70 sm:text-base">
        {description}
      </p>

      <button
        type="button"
        onClick={() => navigate(gradesPath)}
        className={`group relative mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l px-6 py-3.5 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 sm:text-xl ${accentStyles.button}`}
      >
        اختار صفك 🚀
      </button>
    </div>
  );
}
