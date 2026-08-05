import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import WelcomeCard from "../components/WelcomeCard";
import PrimaryButton from "../components/PrimaryButton";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <WelcomeCard>
        <h1
          className="animate-fade-up text-2xl font-extrabold text-navy sm:text-3xl md:text-4xl"
          style={{ animationDelay: "0.1s" }}
        >
          🌟 أهلاً بيكم يا أبطال! 🌟
        </h1>

        <p
          className="animate-fade-up mt-6 text-lg font-bold leading-relaxed text-primary sm:text-xl"
          style={{ animationDelay: "0.3s" }}
        >
          أنا الأستاذة دنيا المصري ❤️
          <br />
          مبسوطة جدًا إنكم معايا النهارده!
        </p>

        <p
          className="animate-fade-up mt-5 text-base leading-relaxed text-navy/80 sm:text-lg"
          style={{ animationDelay: "0.5s" }}
        >
          هنا هتختبروا نفسكم في الإنجليزي،
          <br />
          وتشوفوا شطارتكم وصلت لفين 💪📚
        </p>

        <p
          className="animate-fade-up mt-5 text-lg font-bold text-purple sm:text-xl"
          style={{ animationDelay: "0.7s" }}
        >
          جاهزين نبدأ التحدي؟ 🚀
        </p>

        <div
          className="animate-fade-up mt-9"
          style={{ animationDelay: "0.9s" }}
        >
          <PrimaryButton onClick={() => navigate("/levels")}>
            يلا نبدأ 🚀
          </PrimaryButton>
        </div>
      </WelcomeCard>
    </MainLayout>
  );
}
