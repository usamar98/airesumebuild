"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Code, LineChart, Layers, Cpu, PenTool, BarChart3, Rocket, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Service {
  icon: React.ReactNode
  title: string
  description: string
}

const services: Service[] = [
  {
    icon: <Code className="h-10 w-10" />,
    title: "Smart Contract Development",
    description:
      "Custom smart contract development for various blockchain platforms including Ethereum, Solana, and Polygon.",
  },
  {
    icon: <Layers className="h-10 w-10" />,
    title: "DApp Development",
    description:
      "End-to-end decentralized application development with modern frontend frameworks and blockchain integration.",
  },
  {
    icon: <Cpu className="h-10 w-10" />,
    title: "Blockchain Architecture",
    description: "Design and implementation of scalable blockchain architecture tailored to your business needs.",
  },
  {
    icon: <LineChart className="h-10 w-10" />,
    title: "Tokenomics Design",
    description: "Strategic token economic models designed to ensure sustainable growth and value creation.",
  },
  {
    icon: <PenTool className="h-10 w-10" />,
    title: "Web3 Branding",
    description: "Distinctive branding strategies for Web3 projects that resonate with crypto-native audiences.",
  },
  {
    icon: <BarChart3 className="h-10 w-10" />,
    title: "Analytics & Insights",
    description:
      "Data-driven insights and analytics for blockchain projects to optimize performance and user engagement.",
  },
  {
    icon: <Rocket className="h-10 w-10" />,
    title: "Token Launch Strategy",
    description: "Comprehensive token launch strategies including IDO, IEO, and community building.",
  },
  {
    icon: <Users className="h-10 w-10" />,
    title: "Community Management",
    description: "Building and nurturing engaged Web3 communities across Discord, Telegram, and other platforms.",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Services() {
  return (
    <section id="services" className="py-20 px-4 md:px-8 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Services</h2>
          <div className="w-20 h-1 bg-white mx-auto mb-6"></div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive Web3 and blockchain solutions to bring your decentralized vision to life
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={item}>
              <Card className="bg-zinc-900 border-zinc-800 h-full hover:border-white/20 transition-colors duration-300">
                <CardHeader>
                  <div className="p-2 rounded-lg bg-white/5 w-fit mb-4">{service.icon}</div>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">{service.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
