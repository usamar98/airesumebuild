"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { HashLink } from "react-router-hash-link"

const Footer = () => {
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-purple-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-gray-400 text-sm ml-2">using React, Three.js & GSAP</p>
          </div>

          <div className="mt-4 md:mt-0">
            <nav className="flex space-x-6">
              <HashLink smooth to="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy
              </HashLink>
              <HashLink smooth to="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms
              </HashLink>
              <HashLink smooth to="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Sitemap
              </HashLink>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
