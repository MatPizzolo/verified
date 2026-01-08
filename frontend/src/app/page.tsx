import { HeroSection } from "@/components/home/hero-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { BrandLogos } from "@/components/home/brand-logos"
import { HowItWorks } from "@/components/home/how-it-works"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BrandLogos />
      <FeaturedProducts />
      <HowItWorks />
    </>
  )
}
