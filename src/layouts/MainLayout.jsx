import FloatingBackground from "../components/FloatingBackground";

export default function MainLayout({ children }) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-b from-sky via-white to-sky">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-purple/20 blur-3xl sm:h-96 sm:w-96"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl sm:h-96 sm:w-96"
      />
      <FloatingBackground />
      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
