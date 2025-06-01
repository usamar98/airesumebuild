import Header from "@/components/header"
import Hero from "@/components/hero"
import Projects from "@/components/projects"
import Services from "@/components/services"
import Expertise from "@/components/expertise"
import Contact from "@/components/contact"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="bg-black text-white min-h-screen">
      <Header />
      <Hero />
      <Projects />
      <Services />
      <Expertise />
      <Contact />
      <Footer />
    </main>
  )
}
