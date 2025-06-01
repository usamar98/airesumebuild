"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navigationItems = [
  { name: "Home", href: "#home" },
  { name: "Projects", href: "#projects" },
  { name: "Services", href: "#services" },
  { name: "Expertise", href: "#expertise" },
  { name: "Contact", href: "#contact" },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    const handleSectionChange = () => {
      const sections = ["home", "projects", "services", "expertise", "contact"]
      const scrollPosition = window.scrollY + 200 // Increased offset for better detection

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop - 100 // Account for header height
          if (scrollPosition >= offsetTop) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("scroll", handleSectionChange)
    handleScroll()
    handleSectionChange()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("scroll", handleSectionChange)
    }
  }, [])

  const scrollToSection = (href: string) => {
    const element = document.getElementById(href.substring(1))
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  const scrollToContact = () => {
    const element = document.getElementById("contact")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-black/90 backdrop-blur-md border-b border-white/10" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left Side - Name */}
            <div className="flex items-center">
              <motion.div className="text-lg font-bold tracking-tight" whileHover={{ scale: 1.05 }}>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  Usama Riaz
                </span>
              </motion.div>
            </div>

            {/* Center - Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <motion.button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    activeSection === item.href.substring(1) ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.name}
                  {activeSection === item.href.substring(1) && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                      layoutId="activeSection"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </nav>

            {/* Right Side - Contact and Hire Me Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={scrollToContact}
                className="border-white/20 text-white hover:bg-white hover:text-black transition-colors"
              >
                Contact Me
              </Button>
              <Button onClick={scrollToContact} className="bg-white text-black hover:bg-gray-200 transition-colors">
                Hire Me
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{
            height: isMobileMenuOpen ? "auto" : 0,
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden bg-black/95 backdrop-blur-md border-t border-white/10"
        >
          <div className="px-4 py-6 space-y-4">
            {/* Mobile Name */}
            <div className="text-center mb-6">
              <div className="text-xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  Usama Riaz
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-1">Web3 Developer & Blockchain Expert</div>
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <motion.button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className={`block w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.href.substring(1)
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {item.name}
                </motion.button>
              ))}
            </nav>

            {/* Mobile Action Buttons */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <Button
                variant="outline"
                onClick={scrollToContact}
                className="w-full border-white/20 text-white hover:bg-white hover:text-black"
              >
                Contact Me
              </Button>
              <Button onClick={scrollToContact} className="w-full bg-white text-black hover:bg-gray-200">
                Hire Me
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-16 md:h-20" />
    </>
  )
}
