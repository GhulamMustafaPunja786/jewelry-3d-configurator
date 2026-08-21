import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesPreview } from "@/components/home/CategoriesPreview";
import { HowItWorks } from "@/components/home/HowItWorks";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <CategoriesPreview />
    </main>
  );
}
