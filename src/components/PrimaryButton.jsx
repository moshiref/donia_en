export default function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-primary to-purple px-10 py-4 text-xl font-bold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-purple/40 active:scale-95 sm:text-2xl ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
      />
    </button>
  );
}
