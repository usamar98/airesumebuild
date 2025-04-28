"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { ExternalLink, Github } from "lucide-react";

export default function Projects() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const projectRefs = useRef([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.from(headingRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: headingRef.current,
        start: "top 80%",
      },
    });

    projectRefs.current.forEach((project, index) => {
      gsap.from(project, {
        y: 100,
        opacity: 0,
        duration: 0.8,
        delay: index * 0.2,
        scrollTrigger: {
          trigger: project,
          start: "top 85%",
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const projects = [
    {
      title: "Media Depot Hub",
      description:
        "A comprehensive media management platform with advanced organization and sharing capabilities.",
      image: "/images/media.png", // ✅ correct path
      tags: ["React", "Node.js", "MongoDB", "Express"],
      link: "https://mediadepottest1.com/mdh/",
    },
    {
      title: "Loops Studio",
      description:
        "Creative agency website with immersive animations and interactive elements.",
      image: "/images/LoopsImg.png", // ✅ correct path
      tags: ["HTML/CSS", "JavaScript", "GSAP", "Responsive Design"],
      link: "https://loopsstudio.netlify.app/",
    },
    {
      title: "SEO Configurator",
      description:
        "A dynamic SEO and marketing tool that allows users to effortlessly configure and optimize their online presence for better visibility and engagement.",
      image: "/images/zcv.png", // ✅ correct path
      tags: ["Social Media Marketing", "SEO"],
      link: "#",
    },
  ];

  return (
    <section ref={sectionRef} id="projects" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <h2 ref={headingRef} className="text-4xl font-bold mb-16 text-center">
          Featured Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div
              key={index}
              ref={(el) => (projectRefs.current[index] = el)}
              className="bg-gray-900 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="relative w-full h-48">
                <Image
                  src={project.image || "/images/placeholder.svg"}
                  alt={project.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                <p className="text-gray-400 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-purple-900 bg-opacity-50 text-purple-300 text-xs px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4">
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-purple-400 transition-colors flex items-center gap-1"
                  >
                    <ExternalLink size={18} />
                    <span>Visit Site</span>
                  </a>
                  <a
                    href="#"
                    className="text-white hover:text-purple-400 transition-colors flex items-center gap-1"
                  >
                    <Github size={18} />
                    <span>Code</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
