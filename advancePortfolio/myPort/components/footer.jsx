"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import Link from "next/link"
import { Heart } from "lucide-react"

export default function Footer() {
  const footerRef = useRef(null)

  useEffect(() => {
    gsap.from(footerRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: footerRef.current,
        start: "top 90%",
      },
    })
  }, [])

  return (
    <footer ref={footerRef} className="py-8 bg-black border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Portfolio. All rights reserved.</p>
          </div>

          <div className="flex items-center">
            <p className="text-gray-400 text-sm mr-2">Made with</p>
            <Heart className="h-4 w-4 text-purple-500" />
            <p className="text-gray-400 text-sm ml-2">using React, Three.js & GSAP</p>
          </div>

          <div className="mt-4 md:mt-0">
            <nav className="flex space-x-6">
              <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Sitemap
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
