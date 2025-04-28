"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Code, Layers, Palette, Cpu } from "lucide-react"

export default function Skills() {
  const sectionRef = useRef(null)
  const headingRef = useRef(null)
  const skillsRef = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    gsap.from(headingRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: headingRef.current,
        start: "top 80%",
      },
    })

    const skillItems = skillsRef.current?.querySelectorAll(".skill-item")

    skillItems?.forEach((item, index) => {
      gsap.from(item, {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        delay: index * 0.1,
        scrollTrigger: {
          trigger: skillsRef.current,
          start: "top 80%",
        },
      })
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  const skillCategories = [
    {
      title: "Frontend Development",
      icon: <Code className="w-8 h-8 text-purple-400" />,
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML/CSS"],
    },
    {
      title: "SEO",
      icon: <Layers className="w-8 h-8 text-purple-400" />,
      skills: ["SEO Optimization", "Keyword Research", "On-Page SEO", "Technical SEO", "Content Strategy"],
    },
    {
      title: "Social Media Marketing (SMM)",
      icon: <Palette className="w-8 h-8 text-purple-400" />,
      skills: ["Facebook Marketing", "Instagram Marketing", "LinkedIn Marketing", "Content Creation", "Brand Promotion"],
    },
    {
      title: "Other Technologies",
      icon: <Cpu className="w-8 h-8 text-purple-400" />,
      skills: ["Node.js", "Express", "Git", "REST APIs", "GraphQL"],
    },
  ]
  
  

  return (
    <section ref={sectionRef} id="skills" className="py-20 bg-gradient-to-b from-purple-900 to-black">
      <div className="container mx-auto px-4">
        <h2 ref={headingRef} className="text-4xl font-bold mb-16 text-center">
          Skills & Expertise
        </h2>
        <div ref={skillsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {skillCategories.map((category, index) => (
            <div key={index} className="skill-item bg-gray-900 bg-opacity-50 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center mb-4">
                {category.icon}
                <h3 className="text-xl font-semibold ml-3">{category.title}</h3>
              </div>
              <ul className="space-y-2">
                {category.skills.map((skill, i) => (
                  <li key={i} className="text-gray-300 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
