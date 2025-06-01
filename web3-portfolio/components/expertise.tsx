"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Progress } from "@/components/ui/progress"

interface Skill {
  name: string
  percentage: number
}

const blockchainSkills: Skill[] = [
  { name: "Ethereum / Solidity", percentage: 95 },
  { name: "Polygon / L2 Solutions", percentage: 90 },
  { name: "Solana", percentage: 85 },
  { name: "Smart Contract Security", percentage: 92 },
]

const developmentSkills: Skill[] = [
  { name: "React / Next.js", percentage: 95 },
  { name: "TypeScript", percentage: 90 },
  { name: "Web3.js / Ethers.js", percentage: 95 },
  { name: "Node.js / GraphQL", percentage: 88 },
]

const marketingSkills: Skill[] = [
  { name: "Web3 Growth Strategy", percentage: 94 },
  { name: "Community Building", percentage: 92 },
  { name: "Token Launch Campaigns", percentage: 90 },
  { name: "Analytics & Optimization", percentage: 88 },
]

export default function Expertise() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, 100])

  return (
    <section id="expertise" ref={sectionRef} className="py-20 px-4 md:px-8 bg-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0,_transparent_70%)]"></div>
        <div className="grid grid-cols-10 h-full w-full">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/5"></div>
          ))}
        </div>
      </div>

      <motion.div className="max-w-7xl mx-auto relative z-10" style={{ opacity, y }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Expertise</h2>
          <div className="w-20 h-1 bg-white mx-auto mb-6"></div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Specialized skills in blockchain technology, development, and Web3 marketing
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <SkillCategory title="Blockchain" skills={blockchainSkills} delay={0} />
          <SkillCategory title="Development" skills={developmentSkills} delay={0.2} />
          <SkillCategory title="Marketing" skills={marketingSkills} delay={0.4} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-bold mb-6">Experience Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="text-4xl font-bold mb-2">5+</div>
              <div className="text-gray-400">Years in Blockchain</div>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="text-4xl font-bold mb-2">30+</div>
              <div className="text-gray-400">Projects Delivered</div>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="text-4xl font-bold mb-2">$15M+</div>
              <div className="text-gray-400">Raised for Clients</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function SkillCategory({ title, skills, delay }: { title: string; skills: Skill[]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="bg-zinc-900 p-6 rounded-lg border border-zinc-800"
    >
      <h3 className="text-xl font-bold mb-6">{title}</h3>
      <div className="space-y-6">
        {skills.map((skill, index) => (
          <div key={index}>
            <div className="flex justify-between mb-2">
              <span>{skill.name}</span>
              <span>{skill.percentage}%</span>
            </div>
            <ProgressBar value={skill.percentage} index={index} />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function ProgressBar({ value, index }: { value: number; index: number }) {
  return (
    <motion.div
      initial={{ width: 0 }}
      whileInView={{ width: `${value}%` }}
      transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
      viewport={{ once: true }}
    >
      <Progress value={value} className="h-2" />
    </motion.div>
  )
}
