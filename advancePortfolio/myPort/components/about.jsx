"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

export default function About() {
  const sectionRef = useRef(null);
  const textRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse",
      },
    });

    tl.from(textRef.current, {
      x: -100,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });

    tl.from(
      imageRef.current,
      {
        x: 100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      },
      "-=0.5"
    );

    return () => {
      if (tl.scrollTrigger) {
        tl.scrollTrigger.kill();
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="py-20 bg-gradient-to-b from-black to-purple-900"
    >
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-16 text-center">About Me</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div ref={textRef} className="space-y-6">
            <h3 className="text-2xl font-semibold">
              Creative Developer & Designer
            </h3>
            <p className="text-gray-300">
              I'm a passionate developer with expertise in creating immersive
              digital experiences. With a strong foundation in both design and
              development, I bring creative concepts to life through code,
              animation, and interactive elements.
            </p>
            <p className="text-gray-300">
              My journey in web development started 5 years ago, and I've since
              worked with various technologies including React, Three.js, GSAP,
              and WebGL to create memorable user experiences.
            </p>
            <div className="pt-4">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full transition-all">
                Download Resume
              </button>
            </div>
          </div>
          <div
            ref={imageRef}
            className="relative h-[400px] rounded-lg overflow-hidden shadow-xl"
          >
            <Image
              src="/images/my.png"
              alt="Profile"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
