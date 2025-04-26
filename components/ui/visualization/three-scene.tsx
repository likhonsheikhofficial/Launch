'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Card } from '../card'

interface ThreeSceneProps {
  data?: any
  width?: number
  height?: number
  className?: string
}

export function ThreeScene({
  data,
  width = 800,
  height = 600,
  className
}: ThreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Initialize scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    )
    camera.position.z = 5
    cameraRef.current = camera

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setClearColor(0x000000, 0) // Transparent background
    rendererRef.current = renderer

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controlsRef.current = controls

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(0, 1, 0)
    scene.add(directionalLight)

    // Mount renderer
    mountRef.current.appendChild(renderer.domElement)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    // Cleanup
    return () => {
      mountRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [width, height])

  // Update visualization when data changes
  useEffect(() => {
    if (!sceneRef.current || !data) return

    // Clear existing visualization
    while (sceneRef.current.children.length > 0) {
      const object = sceneRef.current.children[0]
      if (object instanceof THREE.Light) break
      sceneRef.current.remove(object)
    }

    // Add new visualization based on data
    // This is where you would add your custom visualization logic
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)
    sceneRef.current.add(cube)

  }, [data])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [width, height])

  return (
    <Card className={className}>
      <div ref={mountRef} className="w-full h-full" />
    </Card>
  )
}
