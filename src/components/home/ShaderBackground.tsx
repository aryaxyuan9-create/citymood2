'use client'
import { useEffect, useRef } from 'react'

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Generate stars
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.2,
      opacity: Math.random() * 0.7 + 0.1,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }))

    let frame = 0
    let animId: number

    const draw = () => {
      const w = canvas.width
      const h = canvas.height

      // Static gradient background
      const grad = ctx.createLinearGradient(0, 0, w * 0.6, h)
      grad.addColorStop(0, '#0D0B1F')
      grad.addColorStop(0.25, '#1A1035')
      grad.addColorStop(0.5, '#2D1B69')
      grad.addColorStop(0.72, '#4A2F8A')
      grad.addColorStop(0.88, '#6B3CC8')
      grad.addColorStop(1, '#8B5CF6')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Draw stars with twinkle
      stars.forEach(star => {
        const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinkleOffset)
        const opacity = star.opacity * (0.5 + 0.5 * twinkle)
        const x = star.x * w
        const y = star.y * h

        // Soft glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, star.r * 4)
        glow.addColorStop(0, `rgba(196,174,244,${opacity})`)
        glow.addColorStop(1, 'rgba(196,174,244,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, star.r * 4, 0, Math.PI * 2)
        ctx.fill()

        // Star core
        ctx.fillStyle = `rgba(237,232,248,${Math.min(opacity * 1.5, 1)})`
        ctx.beginPath()
        ctx.arc(x, y, star.r, 0, Math.PI * 2)
        ctx.fill()
      })

      frame++
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
