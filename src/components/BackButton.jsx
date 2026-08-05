import { useNavigate } from "react-router-dom";

export default function BackButton({ to, label }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-navy/70 transition-colors duration-200 hover:text-primary sm:text-base"
    >
      <span className="transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
        ←
      </span>
      {label}
    </button>
  );
}
