"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import ThreeScene from "./three-scene"
import { ArrowDown } from "lucide-react"

export default function Hero() {
  const heroRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline()

    tl.from(textRef.current?.querySelectorAll(".animate-text"), {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power4.out",
    })

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <section ref={heroRef} className="relative h-screen w-full flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <ThreeScene />
      </div>
      <div ref={textRef} className="z-10 text-center px-4 max-w-4xl">
        <h1 className="animate-text text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Creative Developer
        </h1>
        <p className="animate-text text-xl md:text-2xl mb-8 text-gray-300">
          Crafting immersive digital experiences with code and creativity
        </p>
        <button className="animate-text bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-opacity-90 transition-all">
          Explore My Work
        </button>
      </div>
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="w-8 h-8" />
      </div>
    </section>
  )
}
