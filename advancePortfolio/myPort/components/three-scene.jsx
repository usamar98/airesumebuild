"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { gsap } from "gsap"

export default function ThreeScene() {
  const mountRef = useRef(null)

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement)
    }

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 2000

    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x8a2be2,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Create sphere
    const geometry = new THREE.SphereGeometry(1.5, 64, 64)
    const material = new THREE.MeshStandardMaterial({
      color: 0x8a2be2,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    })

    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    // Add lights
    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Animation
    gsap.to(sphere.rotation, {
      y: Math.PI * 2,
      duration: 20,
      repeat: -1,
      ease: "none",
    })

    // Mouse movement effect
    let mouseX = 0
    let mouseY = 0

    function onDocumentMouseMove(event) {
      mouseX = (event.clientX - window.innerWidth / 2) / 100
      mouseY = (event.clientY - window.innerHeight / 2) / 100
    }

    document.addEventListener("mousemove", onDocumentMouseMove)

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      particlesMesh.rotation.y += 0.001

      // Responsive to mouse movement
      sphere.rotation.x += 0.001
      sphere.rotation.y += 0.002

      sphere.position.x = mouseX * 0.1
      sphere.position.y = -mouseY * 0.1

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("mousemove", onDocumentMouseMove)
    }
  }, [])

  return <div ref={mountRef} className="w-full h-full" />
}
