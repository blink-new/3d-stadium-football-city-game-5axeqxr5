import { useState, useEffect, useRef } from 'react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Play, Pause, RotateCcw, Trophy, Target, Timer, Zap, Users, Volume2, Camera, Map, Navigation } from 'lucide-react'

// Game state interface
interface GameState {
  score: number
  time: number
  isPlaying: boolean
  ballPosition: { x: number; y: number; z: number }
  playerPosition: { x: number; y: number; z: number }
  goals: number
  ballVelocity: { x: number; y: number; z: number }
  cameraMode: 'follow' | 'stadium' | 'aerial' | 'city'
  gameMode: 'practice' | 'match' | 'explore'
  currentStadium: number
  stadiumsDiscovered: number[]
  cityPosition: { x: number; y: number }
  isInStadium: boolean
  ballTrail: { x: number; y: number; opacity: number }[]
  particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[]
}

// Stadium locations in the city
const STADIUMS = [
  { position: { x: 400, y: 300 }, name: "Central Arena", capacity: 75000, color: "#00D4AA" },
  { position: { x: 200, y: 150 }, name: "North Stadium", capacity: 45000, color: "#FF6B35" },
  { position: { x: 600, y: 150 }, name: "East Complex", capacity: 60000, color: "#9333EA" },
  { position: { x: 400, y: 450 }, name: "South Field", capacity: 35000, color: "#F59E0B" },
]

// Particle system for effects
const createParticles = (x: number, y: number, color: string, count: number = 10) => {
  const particles = []
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1,
      color
    })
  }
  return particles
}

// Main App Component
function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    time: 0,
    isPlaying: false,
    ballPosition: { x: 400, y: 300, z: 0 },
    playerPosition: { x: 400, y: 500, z: 0 },
    goals: 0,
    ballVelocity: { x: 0, y: 0, z: 0 },
    cameraMode: 'city',
    gameMode: 'explore',
    currentStadium: 0,
    stadiumsDiscovered: [],
    cityPosition: { x: 400, y: 300 },
    isInStadium: false,
    ballTrail: [],
    particles: []
  })
  
  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameState.isPlaying) {
      interval = setInterval(() => {
        setGameState(prev => ({ ...prev, time: prev.time + 1 }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameState.isPlaying])
  
  // Enhanced game loop with 3D-style effects
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const animate = () => {
      // Clear canvas with dynamic gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#0A0E1A')
      gradient.addColorStop(0.3, '#1a1a2e')
      gradient.addColorStop(0.7, '#16213e')
      gradient.addColorStop(1, '#0A0E1A')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      if (gameState.isInStadium) {
        drawStadiumView(ctx, canvas.width, canvas.height)
      } else {
        drawCityView(ctx, canvas.width, canvas.height)
      }
      
      // Draw particles
      drawParticles(ctx)
      
      // Update physics and effects
      if (gameState.isPlaying) {
        updateGamePhysics()
        updateParticles()
        if (gameState.isInStadium) {
          updateBallTrail()
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState])
  
  const drawCityView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // City background with depth
    const cityGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 400)
    cityGradient.addColorStop(0, '#2a2a3e')
    cityGradient.addColorStop(0.7, '#1a1a2e')
    cityGradient.addColorStop(1, '#0f0f1a')
    ctx.fillStyle = cityGradient
    ctx.fillRect(0, 0, width, height)
    
    // City grid with perspective
    ctx.strokeStyle = '#333344'
    ctx.lineWidth = 1
    const gridSize = 40
    for (let i = 0; i < width; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, height)
      ctx.stroke()
    }
    for (let i = 0; i < height; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i)
      ctx.stroke()
    }
    
    // Draw city buildings with 3D effect
    const buildings = [
      { x: 100, y: 100, w: 60, h: 120, depth: 20 },
      { x: 200, y: 80, w: 80, h: 160, depth: 30 },
      { x: 320, y: 120, w: 50, h: 100, depth: 15 },
      { x: 500, y: 90, w: 70, h: 140, depth: 25 },
      { x: 600, y: 110, w: 60, h: 110, depth: 20 },
      { x: 150, y: 400, w: 90, h: 180, depth: 35 },
      { x: 550, y: 380, w: 70, h: 150, depth: 25 },
    ]
    
    buildings.forEach((building, index) => {
      // Building shadow (3D depth)
      ctx.fillStyle = '#111122'
      ctx.fillRect(building.x + building.depth, building.y + building.depth, building.w, building.h)
      
      // Building face
      const buildingGradient = ctx.createLinearGradient(building.x, building.y, building.x + building.w, building.y)
      buildingGradient.addColorStop(0, `hsl(${210 + index * 15}, 40%, ${20 + index * 3}%)`)
      buildingGradient.addColorStop(1, `hsl(${210 + index * 15}, 40%, ${15 + index * 2}%)`)
      ctx.fillStyle = buildingGradient
      ctx.fillRect(building.x, building.y, building.w, building.h)
      
      // Building windows with animation
      const time = Date.now() * 0.001
      for (let i = 0; i < 12; i++) {
        const windowX = building.x + 8 + (i % 3) * 18
        const windowY = building.y + 15 + Math.floor(i / 3) * 25
        
        if (windowX < building.x + building.w - 10 && windowY < building.y + building.h - 10) {
          const flicker = Math.sin(time * 2 + i + index) > -0.2
          if (flicker) {
            ctx.fillStyle = index % 2 === 0 ? '#00D4AA' : '#FF6B35'
            ctx.shadowColor = index % 2 === 0 ? '#00D4AA' : '#FF6B35'
            ctx.shadowBlur = 6
            ctx.fillRect(windowX, windowY, 8, 8)
            ctx.shadowBlur = 0
          }
        }
      }
    })
    
    // Draw stadiums with glow effects
    STADIUMS.forEach((stadium, index) => {
      const distance = Math.sqrt(
        Math.pow(gameState.cityPosition.x - stadium.position.x, 2) + 
        Math.pow(gameState.cityPosition.y - stadium.position.y, 2)
      )
      const isNear = distance < 80
      
      // Stadium glow
      if (isNear) {
        const glowGradient = ctx.createRadialGradient(
          stadium.position.x, stadium.position.y, 0,
          stadium.position.x, stadium.position.y, 100
        )
        glowGradient.addColorStop(0, `${stadium.color}40`)
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.fillRect(stadium.position.x - 100, stadium.position.y - 100, 200, 200)
      }
      
      // Stadium structure with 3D effect
      const size = 40
      const depth = 8
      
      // Stadium shadow
      ctx.fillStyle = '#000011'
      ctx.fillRect(stadium.position.x - size/2 + depth, stadium.position.y - size/2 + depth, size, size)
      
      // Stadium main structure
      ctx.fillStyle = isNear ? stadium.color : '#444444'
      ctx.shadowColor = isNear ? stadium.color : 'transparent'
      ctx.shadowBlur = isNear ? 15 : 0
      ctx.fillRect(stadium.position.x - size/2, stadium.position.y - size/2, size, size)
      ctx.shadowBlur = 0
      
      // Stadium details
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(stadium.position.x - 15, stadium.position.y - 2, 30, 4)
      ctx.fillRect(stadium.position.x - 2, stadium.position.y - 15, 4, 30)
      
      // Stadium name when near
      if (isNear) {
        ctx.fillStyle = stadium.color
        ctx.font = 'bold 14px Orbitron'
        ctx.textAlign = 'center'
        ctx.fillText(stadium.name, stadium.position.x, stadium.position.y - 35)
        
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Orbitron'
        ctx.fillText('Press E to Enter', stadium.position.x, stadium.position.y + 50)
      }
      
      // Discovery indicator
      if (gameState.stadiumsDiscovered.includes(index)) {
        ctx.fillStyle = '#00D4AA'
        ctx.beginPath()
        ctx.arc(stadium.position.x + 15, stadium.position.y - 15, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    
    // Draw player in city with enhanced 3D effect
    const playerSize = 12
    const playerDepth = 4
    
    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.beginPath()
    ctx.ellipse(gameState.cityPosition.x + playerDepth, gameState.cityPosition.y + playerSize + playerDepth, playerSize, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // Player body with gradient and glow
    const playerGradient = ctx.createLinearGradient(
      gameState.cityPosition.x - playerSize, gameState.cityPosition.y - playerSize,
      gameState.cityPosition.x + playerSize, gameState.cityPosition.y + playerSize
    )
    playerGradient.addColorStop(0, '#00D4AA')
    playerGradient.addColorStop(1, '#00A085')
    
    ctx.fillStyle = playerGradient
    ctx.shadowColor = '#00D4AA'
    ctx.shadowBlur = gameState.isPlaying ? 10 : 5
    ctx.fillRect(gameState.cityPosition.x - playerSize/2, gameState.cityPosition.y - playerSize, playerSize, playerSize * 1.5)
    ctx.shadowBlur = 0
    
    // Player head
    ctx.fillStyle = '#ffdbac'
    ctx.beginPath()
    ctx.arc(gameState.cityPosition.x, gameState.cityPosition.y - playerSize - 6, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // Movement indicator
    if (gameState.isPlaying) {
      const time = Date.now() * 0.005
      ctx.strokeStyle = '#00D4AA'
      ctx.lineWidth = 2
      ctx.shadowColor = '#00D4AA'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(gameState.cityPosition.x, gameState.cityPosition.y, 20 + Math.sin(time) * 3, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    
    // Mini-map
    drawMiniMap(ctx, width, height)
  }
  
  const drawStadiumView = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Stadium field with enhanced 3D perspective
    const fieldGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 300)
    fieldGradient.addColorStop(0, '#2d5a27')
    fieldGradient.addColorStop(0.7, '#1e3d1a')
    fieldGradient.addColorStop(1, '#0f1f0d')
    ctx.fillStyle = fieldGradient
    ctx.fillRect(80, 120, width - 160, height - 240)
    
    // Field pattern with perspective
    ctx.strokeStyle = '#1e3d1a'
    ctx.lineWidth = 1
    for (let i = 0; i < 15; i++) {
      const x = 80 + i * (width - 160) / 15
      ctx.beginPath()
      ctx.moveTo(x, 120)
      ctx.lineTo(x + (i - 7) * 2, height - 120) // Perspective effect
      ctx.stroke()
    }
    
    // Enhanced field lines with 3D glow
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 8
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    
    // Field boundary with perspective
    ctx.strokeRect(80, 120, width - 160, height - 240)
    
    // Center line and circle
    ctx.beginPath()
    ctx.moveTo(80, height / 2)
    ctx.lineTo(width - 80, height / 2)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, 40, 0, Math.PI * 2)
    ctx.stroke()
    
    // Enhanced 3D goals
    ctx.shadowBlur = 12
    ctx.fillStyle = '#ffffff'
    
    // Top goal with depth
    ctx.fillRect(width / 2 - 50, 115, 100, 10)
    ctx.fillRect(width / 2 - 55, 120, 8, 40)
    ctx.fillRect(width / 2 + 47, 120, 8, 40)
    
    // Goal net effect
    ctx.strokeStyle = '#cccccc'
    ctx.lineWidth = 1
    ctx.shadowBlur = 0
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.moveTo(width / 2 - 50 + i * 12.5, 125)
      ctx.lineTo(width / 2 - 50 + i * 12.5, 160)
      ctx.stroke()
    }
    
    // Bottom goal
    ctx.shadowBlur = 12
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(width / 2 - 50, height - 125, 100, 10)
    ctx.fillRect(width / 2 - 55, height - 160, 8, 40)
    ctx.fillRect(width / 2 + 47, height - 160, 8, 40)
    
    ctx.shadowBlur = 0
    
    // Stadium atmosphere with 3D crowd
    drawStadiumCrowd(ctx, width, height)
    
    // Draw ball trail
    drawBallTrail(ctx)
    
    // Draw enhanced 3D player
    drawEnhanced3DPlayer(ctx, gameState.playerPosition)
    
    // Draw enhanced 3D ball
    drawEnhanced3DBall(ctx, gameState.ballPosition)
  }
  
  const drawStadiumCrowd = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Stadium stands with 3D effect
    const time = Date.now() * 0.002
    
    // Top stand
    const topGradient = ctx.createLinearGradient(0, 0, 0, 120)
    topGradient.addColorStop(0, '#1a1a2e')
    topGradient.addColorStop(1, '#2a2a3e')
    ctx.fillStyle = topGradient
    ctx.fillRect(0, 0, width, 120)
    
    // Bottom stand
    const bottomGradient = ctx.createLinearGradient(0, height - 120, 0, height)
    bottomGradient.addColorStop(0, '#2a2a3e')
    bottomGradient.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = bottomGradient
    ctx.fillRect(0, height - 120, width, 120)
    
    // Side stands
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 120, 80, height - 240)
    ctx.fillRect(width - 80, 120, 80, height - 240)
    
    // Animated crowd
    ctx.fillStyle = '#FF6B35'
    for (let i = 0; i < 100; i++) {
      const x = (i * width) / 100 + Math.sin(time + i) * 2
      const y = 60 + Math.sin(time * 2 + i) * 4
      ctx.fillRect(x, y, 2, 3)
      
      const y2 = height - 60 + Math.sin(time * 1.5 + i) * 3
      ctx.fillRect(x, y2, 2, 3)
    }
    
    // Stadium lights with 3D glow
    const lightPositions = [
      { x: 120, y: 60 },
      { x: width - 120, y: 60 },
      { x: 120, y: height - 60 },
      { x: width - 120, y: height - 60 }
    ]
    
    lightPositions.forEach(light => {
      const lightGradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 100)
      lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
      lightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)')
      lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = lightGradient
      ctx.fillRect(light.x - 100, light.y - 100, 200, 200)
      
      // Light source
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(light.x, light.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    })
  }
  
  const drawEnhanced3DPlayer = (ctx: CanvasRenderingContext2D, position: { x: number; y: number; z: number }) => {
    const scale = 1 + position.z * 0.01 // 3D scaling effect
    
    // Player shadow with depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.beginPath()
    ctx.ellipse(position.x + 2, position.y + 20 * scale, 12 * scale, 6 * scale, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // Player body with 3D gradient
    const bodyGradient = ctx.createLinearGradient(
      position.x - 8 * scale, position.y - 15 * scale,
      position.x + 8 * scale, position.y + 8 * scale
    )
    bodyGradient.addColorStop(0, '#00D4AA')
    bodyGradient.addColorStop(0.5, '#00B899')
    bodyGradient.addColorStop(1, '#00A085')
    
    ctx.fillStyle = bodyGradient
    ctx.shadowColor = '#00D4AA'
    ctx.shadowBlur = 8
    ctx.fillRect(position.x - 8 * scale, position.y - 15 * scale, 16 * scale, 25 * scale)
    ctx.shadowBlur = 0
    
    // Player head with 3D effect
    ctx.shadowColor = '#ffdbac'
    ctx.shadowBlur = 4
    ctx.fillStyle = '#ffdbac'
    ctx.beginPath()
    ctx.arc(position.x, position.y - 20 * scale, 6 * scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    
    // Player legs with depth
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(position.x - 6 * scale, position.y + 8 * scale, 5 * scale, 12 * scale)
    ctx.fillRect(position.x + 1 * scale, position.y + 8 * scale, 5 * scale, 12 * scale)
    
    // Player number with glow
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${12 * scale}px Orbitron`
    ctx.textAlign = 'center'
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 3
    ctx.fillText('10', position.x, position.y - 2 * scale)
    ctx.shadowBlur = 0
    
    // 3D selection indicator
    if (gameState.isPlaying) {
      const time = Date.now() * 0.005
      ctx.strokeStyle = '#00D4AA'
      ctx.lineWidth = 2
      ctx.shadowColor = '#00D4AA'
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(position.x, position.y, (20 + Math.sin(time) * 3) * scale, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }
  
  const drawEnhanced3DBall = (ctx: CanvasRenderingContext2D, position: { x: number; y: number; z: number }) => {
    const scale = 1 + position.z * 0.01
    const velocity = Math.sqrt(gameState.ballVelocity.x ** 2 + gameState.ballVelocity.y ** 2)
    
    // Ball shadow with motion blur and depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.beginPath()
    ctx.ellipse(
      position.x + velocity * 0.3 + position.z * 0.1, 
      position.y + 12 * scale, 
      (10 + velocity * 0.2) * scale, 
      5 * scale, 
      0, 0, Math.PI * 2
    )
    ctx.fill()
    
    // Ball with enhanced 3D gradient
    const ballGradient = ctx.createRadialGradient(
      position.x - 2 * scale, position.y - 2 * scale, 0,
      position.x, position.y, 8 * scale
    )
    ballGradient.addColorStop(0, '#ffffff')
    ballGradient.addColorStop(0.3, '#f8f8f8')
    ballGradient.addColorStop(0.7, '#e0e0e0')
    ballGradient.addColorStop(1, '#c0c0c0')
    
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 10
    ctx.fillStyle = ballGradient
    ctx.beginPath()
    ctx.arc(position.x, position.y, 8 * scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    
    // Enhanced ball pattern with 3D rotation
    const time = Date.now() * 0.01
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1.5
    
    // Rotating pentagon pattern with depth
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 + time + position.z * 0.1
      const radius = 6 * scale
      ctx.beginPath()
      ctx.moveTo(position.x, position.y)
      ctx.lineTo(
        position.x + Math.cos(angle) * radius,
        position.y + Math.sin(angle) * radius * 0.8 // 3D perspective
      )
      ctx.stroke()
    }
  }
  
  const drawBallTrail = (ctx: CanvasRenderingContext2D) => {
    gameState.ballTrail.forEach((trail, index) => {
      const scale = 1 + index * 0.05
      ctx.fillStyle = `rgba(255, 255, 255, ${trail.opacity})`
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 5 * trail.opacity
      ctx.beginPath()
      ctx.arc(trail.x, trail.y, 3 * trail.opacity * scale, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.shadowBlur = 0
  }
  
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    gameState.particles.forEach(particle => {
      ctx.fillStyle = particle.color
      ctx.globalAlpha = particle.life
      ctx.shadowColor = particle.color
      ctx.shadowBlur = 8 * particle.life
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, 2 + particle.life, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
  }
  
  const drawMiniMap = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const mapSize = 120
    const mapX = width - mapSize - 20
    const mapY = 20
    
    // Mini-map background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(mapX, mapY, mapSize, mapSize)
    
    ctx.strokeStyle = '#00D4AA'
    ctx.lineWidth = 2
    ctx.strokeRect(mapX, mapY, mapSize, mapSize)
    
    // Mini-map stadiums
    STADIUMS.forEach((stadium, index) => {
      const x = mapX + (stadium.position.x / 800) * mapSize
      const y = mapY + (stadium.position.y / 600) * mapSize
      
      ctx.fillStyle = gameState.stadiumsDiscovered.includes(index) ? stadium.color : '#666666'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })
    
    // Player position on mini-map
    const playerX = mapX + (gameState.cityPosition.x / 800) * mapSize
    const playerY = mapY + (gameState.cityPosition.y / 600) * mapSize
    
    ctx.fillStyle = '#00D4AA'
    ctx.shadowColor = '#00D4AA'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(playerX, playerY, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    
    // Mini-map title
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px Orbitron'
    ctx.textAlign = 'center'
    ctx.fillText('CITY MAP', mapX + mapSize/2, mapY - 5)
  }
  
  const updateGamePhysics = () => {
    if (!gameState.isInStadium) return
    
    setGameState(prev => {
      const newBallPosition = {
        x: prev.ballPosition.x + prev.ballVelocity.x,
        y: prev.ballPosition.y + prev.ballVelocity.y,
        z: prev.ballPosition.z + prev.ballVelocity.z
      }
      
      const newVelocity = {
        x: prev.ballVelocity.x * 0.98,
        y: prev.ballVelocity.y * 0.98,
        z: prev.ballVelocity.z * 0.95
      }
      
      // Boundary collision with enhanced effects
      if (newBallPosition.x < 90 || newBallPosition.x > 710) {
        newVelocity.x *= -0.8
        newBallPosition.x = Math.max(90, Math.min(710, newBallPosition.x))
        
        const particles = createParticles(newBallPosition.x, newBallPosition.y, '#FF6B35', 8)
        return {
          ...prev,
          ballPosition: newBallPosition,
          ballVelocity: newVelocity,
          particles: [...prev.particles, ...particles]
        }
      }
      
      if (newBallPosition.y < 130 || newBallPosition.y > 470) {
        newVelocity.y *= -0.8
        newBallPosition.y = Math.max(130, Math.min(470, newBallPosition.y))
        
        // Enhanced goal detection with 3D depth
        if ((newBallPosition.y < 160 || newBallPosition.y > 440) && 
            newBallPosition.x > 350 && newBallPosition.x < 450) {
          const goalParticles = createParticles(newBallPosition.x, newBallPosition.y, '#00D4AA', 25)
          return {
            ...prev,
            score: prev.score + 100,
            goals: prev.goals + 1,
            ballPosition: { x: 400, y: 300, z: 0 },
            ballVelocity: { x: 0, y: 0, z: 0 },
            particles: [...prev.particles, ...goalParticles],
            ballTrail: []
          }
        }
      }
      
      // 3D depth physics
      if (newBallPosition.z < -10) {
        newBallPosition.z = -10
        newVelocity.z *= -0.7
      }
      if (newBallPosition.z > 10) {
        newBallPosition.z = 10
        newVelocity.z *= -0.7
      }
      
      return {
        ...prev,
        ballPosition: newBallPosition,
        ballVelocity: newVelocity
      }
    })
  }
  
  const updateParticles = () => {
    setGameState(prev => ({
      ...prev,
      particles: prev.particles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vx: particle.vx * 0.98,
          vy: particle.vy * 0.98,
          life: particle.life - 0.02
        }))
        .filter(particle => particle.life > 0)
    }))
  }
  
  const updateBallTrail = () => {
    setGameState(prev => {
      const velocity = Math.sqrt(prev.ballVelocity.x ** 2 + prev.ballVelocity.y ** 2)
      if (velocity > 2) {
        const newTrail = {
          x: prev.ballPosition.x,
          y: prev.ballPosition.y,
          opacity: Math.min(velocity / 10, 1)
        }
        
        return {
          ...prev,
          ballTrail: [...prev.ballTrail, newTrail]
            .slice(-12)
            .map((trail, index, array) => ({
              ...trail,
              opacity: trail.opacity * (index / array.length)
            }))
        }
      }
      
      return {
        ...prev,
        ballTrail: prev.ballTrail
          .map(trail => ({ ...trail, opacity: trail.opacity * 0.9 }))
          .filter(trail => trail.opacity > 0.1)
      }
    })
  }
  
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickY = event.clientY - rect.top
    
    if (gameState.isInStadium) {
      // Stadium ball interaction
      const ballDistance = Math.sqrt(
        Math.pow(clickX - gameState.ballPosition.x, 2) + 
        Math.pow(clickY - gameState.ballPosition.y, 2)
      )
      
      if (ballDistance < 30) {
        if (!gameState.isPlaying) {
          setGameState(prev => ({ ...prev, isPlaying: true }))
        }
        
        const playerDistance = Math.sqrt(
          Math.pow(gameState.ballPosition.x - gameState.playerPosition.x, 2) + 
          Math.pow(gameState.ballPosition.y - gameState.playerPosition.y, 2)
        )
        
        if (playerDistance < 40) {
          const kickPower = 10
          const angle = Math.atan2(
            clickY - gameState.ballPosition.y,
            clickX - gameState.ballPosition.x
          )
          
          const kickParticles = createParticles(
            gameState.ballPosition.x, 
            gameState.ballPosition.y, 
            '#00D4AA', 
            12
          )
          
          setGameState(prev => ({
            ...prev,
            ballVelocity: {
              x: Math.cos(angle) * kickPower,
              y: Math.sin(angle) * kickPower,
              z: (Math.random() - 0.5) * 2
            },
            score: prev.score + 10,
            particles: [...prev.particles, ...kickParticles]
          }))
        }
      }
    }
  }
  
  const handlePlayPause = () => {
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
  }
  
  const handleReset = () => {
    setGameState({
      score: 0,
      time: 0,
      isPlaying: false,
      ballPosition: { x: 400, y: 300, z: 0 },
      playerPosition: { x: 400, y: 500, z: 0 },
      goals: 0,
      ballVelocity: { x: 0, y: 0, z: 0 },
      cameraMode: 'city',
      gameMode: 'explore',
      currentStadium: 0,
      stadiumsDiscovered: [],
      cityPosition: { x: 400, y: 300 },
      isInStadium: false,
      ballTrail: [],
      particles: []
    })
  }
  
  const toggleCameraMode = () => {
    const modes = gameState.isInStadium 
      ? ['follow', 'stadium', 'aerial'] 
      : ['city', 'aerial']
    const currentIndex = modes.indexOf(gameState.cameraMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setGameState(prev => ({ ...prev, cameraMode: nextMode }))
  }
  
  // Handle player movement
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!gameState.isPlaying) return
      
      const speed = gameState.isInStadium ? 4 : 6
      const key = event.key.toLowerCase()
      
      setGameState(prev => {
        if (gameState.isInStadium) {
          // Stadium movement
          let newX = prev.playerPosition.x
          let newY = prev.playerPosition.y
          
          switch (key) {
            case 'w':
            case 'arrowup':
              newY = Math.max(140, newY - speed)
              break
            case 's':
            case 'arrowdown':
              newY = Math.min(460, newY + speed)
              break
            case 'a':
            case 'arrowleft':
              newX = Math.max(100, newX - speed)
              break
            case 'd':
            case 'arrowright':
              newX = Math.min(700, newX + speed)
              break
            case ' ':
              // Enhanced kick with 3D effect
              const distance = Math.sqrt(
                Math.pow(prev.ballPosition.x - prev.playerPosition.x, 2) + 
                Math.pow(prev.ballPosition.y - prev.playerPosition.y, 2)
              )
              if (distance < 40) {
                const direction = {
                  x: prev.ballPosition.x - prev.playerPosition.x,
                  y: prev.ballPosition.y - prev.playerPosition.y
                }
                const length = Math.sqrt(direction.x ** 2 + direction.y ** 2)
                const normalized = {
                  x: direction.x / length,
                  y: direction.y / length
                }
                
                const kickParticles = createParticles(
                  prev.ballPosition.x, 
                  prev.ballPosition.y, 
                  '#00D4AA', 
                  15
                )
                
                return {
                  ...prev,
                  ballVelocity: {
                    x: normalized.x * 12,
                    y: normalized.y * 12,
                    z: (Math.random() - 0.5) * 3
                  },
                  score: prev.score + 10,
                  particles: [...prev.particles, ...kickParticles]
                }
              }
              break
            case 'e':
              // Exit stadium
              return {
                ...prev,
                isInStadium: false,
                cameraMode: 'city',
                gameMode: 'explore'
              }
          }
          
          return {
            ...prev,
            playerPosition: { ...prev.playerPosition, x: newX, y: newY }
          }
        } else {
          // City movement
          let newX = prev.cityPosition.x
          let newY = prev.cityPosition.y
          
          switch (key) {
            case 'w':
            case 'arrowup':
              newY = Math.max(50, newY - speed)
              break
            case 's':
            case 'arrowdown':
              newY = Math.min(550, newY + speed)
              break
            case 'a':
            case 'arrowleft':
              newX = Math.max(50, newX - speed)
              break
            case 'd':
            case 'arrowright':
              newX = Math.min(750, newX + speed)
              break
            case 'e':
              // Enter stadium
              const nearStadium = STADIUMS.find(stadium => {
                const distance = Math.sqrt(
                  Math.pow(prev.cityPosition.x - stadium.position.x, 2) + 
                  Math.pow(prev.cityPosition.y - stadium.position.y, 2)
                )
                return distance < 80
              })
              
              if (nearStadium) {
                const stadiumIndex = STADIUMS.indexOf(nearStadium)
                return {
                  ...prev,
                  isInStadium: true,
                  playerPosition: { x: 400, y: 500, z: 0 },
                  ballPosition: { x: 400, y: 300, z: 0 },
                  ballVelocity: { x: 0, y: 0, z: 0 },
                  cameraMode: 'follow',
                  gameMode: 'practice',
                  currentStadium: stadiumIndex,
                  stadiumsDiscovered: [...new Set([...prev.stadiumsDiscovered, stadiumIndex])],
                  ballTrail: [],
                  particles: []
                }
              }
              break
          }
          
          return {
            ...prev,
            cityPosition: { x: newX, y: newY }
          }
        }
      })
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState.isPlaying, gameState.isInStadium])
  
  const nearestStadium = gameState.isInStadium 
    ? null 
    : STADIUMS.find(stadium => {
        const distance = Math.sqrt(
          Math.pow(gameState.cityPosition.x - stadium.position.x, 2) + 
          Math.pow(gameState.cityPosition.y - stadium.position.y, 2)
        )
        return distance < 80
      })
  
  return (
    <div className="w-full h-screen bg-background relative overflow-hidden">
      {/* Enhanced 3D-Style Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-primary/30 rounded-xl cursor-pointer shadow-2xl neon-primary"
        onClick={handleCanvasClick}
      />
      
      {/* Enhanced Game HUD */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top HUD */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
          <Card className="p-4 glass-dark border-primary/30 shadow-2xl hover-lift">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent animate-pulse" />
                <span className="font-orbitron text-xl font-bold text-primary animate-shimmer">
                  {gameState.score.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="font-orbitron text-xl font-bold">{gameState.goals}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-muted-foreground" />
                <span className="font-orbitron text-xl font-bold">
                  {Math.floor(gameState.time / 60)}:{(gameState.time % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-accent" />
                <span className="font-orbitron text-sm font-bold">
                  {gameState.stadiumsDiscovered.length}/{STADIUMS.length}
                </span>
              </div>
            </div>
          </Card>
          
          <div className="flex gap-2">
            <Button
              onClick={toggleCameraMode}
              variant="outline"
              size="icon"
              className="glass-dark border-primary/30 hover:bg-accent/20 hover-lift"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Button
              onClick={handlePlayPause}
              variant="outline"
              size="icon"
              className="glass-dark border-primary/30 hover:bg-primary/20 hover-lift"
            >
              {gameState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="icon"
              className="glass-dark border-primary/30 hover:bg-accent/20 hover-lift"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Enhanced Game Title */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {!gameState.isPlaying && gameState.time === 0 && (
            <div className="text-center animate-fade-in">
              <h1 className="font-orbitron text-responsive-lg font-bold text-primary mb-6 animate-pulse-glow drop-shadow-2xl">
                3D STADIUM CITY FC
              </h1>
              <p className="text-responsive text-muted-foreground mb-8 font-medium">
                {gameState.isInStadium ? 'Play football in the stadium' : 'Explore the city • Discover stadiums'}
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Badge variant="outline" className="text-lg px-6 py-3 animate-float glass backdrop-blur-sm hover-lift">
                  <Zap className="w-5 h-5 mr-2" />
                  Enhanced 3D Graphics
                </Badge>
                <Badge variant="outline" className="text-lg px-6 py-3 animate-float glass backdrop-blur-sm hover-lift">
                  <Navigation className="w-5 h-5 mr-2" />
                  City Exploration
                </Badge>
                <Badge variant="outline" className="text-lg px-6 py-3 animate-float glass backdrop-blur-sm hover-lift">
                  <Volume2 className="w-5 h-5 mr-2" />
                  Stadium Atmosphere
                </Badge>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Controls Info */}
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <Card className="p-4 glass-dark border-primary/30 shadow-2xl hover-lift">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="font-semibold text-primary mb-2 font-orbitron">
                {gameState.isInStadium ? 'STADIUM CONTROLS' : 'CITY CONTROLS'}
              </div>
              <div><strong>WASD/Arrows:</strong> {gameState.isInStadium ? 'Move player' : 'Explore city'}</div>
              {gameState.isInStadium ? (
                <>
                  <div><strong>Click Ball:</strong> Kick with 3D effects</div>
                  <div><strong>SPACE:</strong> Enhanced kick</div>
                  <div><strong>E:</strong> Exit stadium</div>
                </>
              ) : (
                <div><strong>E:</strong> Enter nearby stadium</div>
              )}
              <div><strong>Camera:</strong> {gameState.cameraMode.toUpperCase()}</div>
              <div><strong>Mode:</strong> {gameState.gameMode.toUpperCase()}</div>
            </div>
          </Card>
        </div>
        
        {/* Stadium Info or Score Display */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          {nearestStadium ? (
            <Card className="p-6 glass-dark border-primary/30 shadow-2xl hover-lift neon-primary">
              <div className="text-center">
                <div className="text-2xl font-orbitron font-bold text-primary mb-2 animate-pulse-glow">
                  {nearestStadium.name}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Capacity: {nearestStadium.capacity.toLocaleString()}
                </div>
                <div className="text-xs text-accent mt-2 font-orbitron animate-pulse">
                  Press E to Enter
                </div>
              </div>
            </Card>
          ) : gameState.isInStadium ? (
            <Card className="p-6 glass-dark border-primary/30 shadow-2xl hover-lift neon-primary">
              <div className="text-center">
                <div className="text-4xl font-orbitron font-bold text-primary mb-2 animate-pulse-glow">
                  {gameState.goals}
                </div>
                <div className="text-sm text-muted-foreground font-medium">GOALS SCORED</div>
                <div className="text-xs text-accent mt-1 font-orbitron">
                  {STADIUMS[gameState.currentStadium]?.name || 'Stadium'}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 glass-dark border-primary/30 shadow-2xl hover-lift">
              <div className="text-center">
                <div className="text-2xl font-orbitron font-bold text-primary mb-2">
                  {gameState.stadiumsDiscovered.length}
                </div>
                <div className="text-sm text-muted-foreground font-medium">STADIUMS FOUND</div>
                <div className="text-xs text-accent mt-1 font-orbitron">
                  Explore to discover more
                </div>
              </div>
            </Card>
          )}
        </div>
        
        {/* Performance indicator */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <div className="text-xs text-muted-foreground glass px-3 py-2 rounded-full font-orbitron">
            Enhanced 3D • Optimized • {gameState.particles.length} FX • {gameState.isInStadium ? 'Stadium' : 'City'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App