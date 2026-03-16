import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import AppShowcase from "@/components/AppShowcase";
import Pricing from "@/components/Pricing";
import Trust from "@/components/Trust";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import ChatWidget from "@/components/ChatWidget";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <HowItWorks />
      <AppShowcase />
      <Pricing />
      <Trust />
      <Testimonials />
      <FAQ />
      <ChatWidget />
      <Footer />
    </>
  );
}
