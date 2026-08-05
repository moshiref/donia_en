const FLOATING_ITEMS = [
  { icon: "⭐", top: "8%", left: "10%", size: "text-3xl", delay: "0s", speed: "animate-float-slow" },
  { icon: "✨", top: "18%", left: "82%", size: "text-2xl", delay: "1.2s", speed: "animate-float-slower" },
  { icon: "📚", top: "72%", left: "6%", size: "text-4xl", delay: "0.4s", speed: "animate-float-slower" },
  { icon: "✏️", top: "60%", left: "88%", size: "text-2xl", delay: "2s", speed: "animate-float-slow" },
  { icon: "🎓", top: "12%", left: "48%", size: "text-3xl", delay: "0.8s", speed: "animate-float-slow" },
  { icon: "⭐", top: "85%", left: "45%", size: "text-2xl", delay: "1.6s", speed: "animate-float-slower" },
  { icon: "✨", top: "40%", left: "4%", size: "text-xl", delay: "2.4s", speed: "animate-float-slow" },
  { icon: "📚", top: "30%", left: "92%", size: "text-2xl", delay: "0.6s", speed: "animate-float-slow" },
];

/**
 * Purely decorative, ambient floating icons for the background.
 * CSS-only animation, no images, no canvas — kept light for performance.
 */
export default function FloatingBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {FLOATING_ITEMS.map((item, index) => (
        <span
          key={index}
          className={`absolute opacity-30 ${item.size} ${item.speed}`}
          style={{ top: item.top, left: item.left, animationDelay: item.delay }}
        >
          {item.icon}
        </span>
      ))}
    </div>
  );
}
