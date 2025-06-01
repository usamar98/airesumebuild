"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ExternalLink, Github } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Project {
  id: number
  title: string
  description: string
  image: string
  tags: string[]
  githubUrl?: string
  liveUrl?: string
  category: "blockchain" | "dapp" | "marketing"
}

const projects: Project[] = [
  {
    id: 1,
    title: "DeFi Exchange Platform",
    description:
      "A decentralized exchange platform built on Ethereum with liquidity pools and yield farming capabilities.",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["Solidity", "React", "Web3.js", "Ethereum"],
    githubUrl: "#",
    liveUrl: "#",
    category: "dapp",
  },
  {
    id: 2,
    title: "NFT Marketplace",
    description: "A marketplace for creating, buying, and selling NFTs with support for multiple blockchains.",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["Next.js", "Solidity", "IPFS", "Polygon"],
    githubUrl: "#",
    liveUrl: "#",
    category: "blockchain",
  },
  {
    id: 3,
    title: "Blockchain Analytics Dashboard",
    description: "Real-time analytics dashboard for monitoring blockchain transactions and market trends.",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["React", "GraphQL", "The Graph", "D3.js"],
    githubUrl: "#",
    liveUrl: "#",
    category: "blockchain",
  },
  {
    id: 4,
    title: "Web3 Marketing Campaign",
    description: "Comprehensive marketing strategy for a Web3 startup, resulting in 300% increase in user acquisition.",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["Marketing", "Growth Hacking", "Analytics"],
    liveUrl: "#",
    category: "marketing",
  },
  {
    id: 5,
    title: "DAO Governance Platform",
    description: "A platform for decentralized autonomous organizations to manage proposals and voting.",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["Solidity", "React", "TypeScript", "Aragon"],
    githubUrl: "#",
    liveUrl: "#",
    category: "dapp",
  },
  {
    id: 6,
    title: "Crypto Wallet Integration",
    description: "Seamless wallet integration solution for Web3 applications with support for multiple providers.",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["TypeScript", "Ethers.js", "WalletConnect"],
    githubUrl: "#",
    category: "blockchain",
  },
]

export default function Projects() {
  const [filter, setFilter] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const filteredProjects = filter ? projects.filter((project) => project.category === filter) : projects

  return (
    <section id="projects" className="py-20 px-4 md:px-8 bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">Projects</h2>
        <div className="w-20 h-1 bg-white mb-10"></div>

        <div className="flex flex-wrap gap-4 mb-10">
          <Button
            variant={filter === null ? "default" : "outline"}
            onClick={() => setFilter(null)}
            className="rounded-full"
          >
            All
          </Button>
          <Button
            variant={filter === "blockchain" ? "default" : "outline"}
            onClick={() => setFilter("blockchain")}
            className="rounded-full"
          >
            Blockchain
          </Button>
          <Button
            variant={filter === "dapp" ? "default" : "outline"}
            onClick={() => setFilter("dapp")}
            className="rounded-full"
          >
            DApps
          </Button>
          <Button
            variant={filter === "marketing" ? "default" : "outline"}
            onClick={() => setFilter("marketing")}
            className="rounded-full"
          >
            Marketing
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              onHoverStart={() => setHoveredId(project.id)}
              onHoverEnd={() => setHoveredId(null)}
            >
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden h-full flex flex-col">
                <div className="relative overflow-hidden aspect-video">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
                    style={{
                      backgroundImage: `url(${project.image})`,
                      transform: hoveredId === project.id ? "scale(1.1)" : "scale(1)",
                    }}
                  />
                </div>
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription className="text-gray-400">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-zinc-800 text-gray-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  {project.githubUrl && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                        <span className="sr-only">GitHub</span>
                      </a>
                    </Button>
                  )}
                  {project.liveUrl && (
                    <Button variant="outline" size="icon" className={!project.githubUrl ? "ml-auto" : ""} asChild>
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Live Demo</span>
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
