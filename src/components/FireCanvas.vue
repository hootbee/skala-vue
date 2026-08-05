<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({ intensity: { type: Number, default: 1 } })
const canvasElement = ref(null)
let context
let animationFrame
let resizeObserver
let intersectionObserver
let motionQuery
let particles = []
let isVisible = true
let reducedMotion = false

const createParticle = (width, height, initial = false) => {
  const life = 34 + Math.random() * 32
  const currentLife = initial ? life * (.2 + Math.random() * .76) : life
  return {
    x: Math.random() * width,
    y: height + (initial ? -Math.random() * height * .72 : Math.random() * 12),
    radius: 6 + Math.random() * 13,
    velocityX: (Math.random() - .5) * .55,
    velocityY: .8 + Math.random() * 1.55,
    phase: Math.random() * Math.PI * 2,
    life: currentLife,
    maxLife: life,
  }
}

const resizeCanvas = () => {
  const canvas = canvasElement.value
  if (!canvas) return
  const bounds = canvas.getBoundingClientRect()
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio))
  canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio))
  context = canvas.getContext('2d')
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  const particleCount = Math.max(10, Math.min(28, Math.round((bounds.width / 8) * props.intensity)))
  particles = Array.from({ length: particleCount }, () => createParticle(bounds.width, bounds.height, true))
}

const drawFlame = (particle, progress) => {
  const size = particle.radius * (.5 + progress * .7)
  const alpha = Math.min(1, progress * 2.4) * Math.min(1, (1 - progress) * 4) * props.intensity
  const sway = Math.sin(particle.phase) * .13
  context.save()
  context.translate(particle.x, particle.y)
  context.rotate(sway)

  const gradient = context.createLinearGradient(0, -size * 1.8, 0, size)
  gradient.addColorStop(0, 'rgba(190, 26, 12, 0)')
  gradient.addColorStop(.2, `rgba(218, 42, 15, ${alpha * .58})`)
  gradient.addColorStop(.55, `rgba(255, 104, 20, ${alpha * .88})`)
  gradient.addColorStop(.82, `rgba(255, 199, 42, ${alpha})`)
  gradient.addColorStop(1, `rgba(255, 242, 148, ${alpha * .92})`)
  context.fillStyle = gradient
  context.beginPath()
  context.moveTo(0, -size * 1.85)
  context.bezierCurveTo(size * .18, -size * 1.25, size * .82, -size * .52, size * .68, size * .32)
  context.bezierCurveTo(size * .55, size * .9, -size * .55, size * .9, -size * .68, size * .32)
  context.bezierCurveTo(-size * .78, -size * .38, -size * .2, -size * .95, 0, -size * 1.85)
  context.fill()

  if (progress > .28) {
    const coreGradient = context.createLinearGradient(0, -size * .75, 0, size * .6)
    coreGradient.addColorStop(0, 'rgba(255, 197, 36, 0)')
    coreGradient.addColorStop(.5, `rgba(255, 225, 78, ${alpha * .7})`)
    coreGradient.addColorStop(1, `rgba(255, 255, 222, ${alpha * .9})`)
    context.fillStyle = coreGradient
    context.beginPath()
    context.moveTo(0, -size * .78)
    context.bezierCurveTo(size * .34, -size * .26, size * .36, size * .5, 0, size * .62)
    context.bezierCurveTo(-size * .36, size * .5, -size * .32, -size * .24, 0, -size * .78)
    context.fill()
  }
  context.restore()
}

const renderFrame = () => {
  const canvas = canvasElement.value
  if (!canvas || !context) return
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  context.clearRect(0, 0, width, height)

  const baseGlow = context.createLinearGradient(0, height, 0, height * .3)
  baseGlow.addColorStop(0, `rgba(226, 44, 16, ${.32 * props.intensity})`)
  baseGlow.addColorStop(.55, `rgba(255, 126, 20, ${.12 * props.intensity})`)
  baseGlow.addColorStop(1, 'rgba(255, 126, 20, 0)')
  context.fillStyle = baseGlow
  context.fillRect(0, height * .25, width, height * .75)
  context.globalCompositeOperation = 'lighter'

  for (const particle of particles) {
    particle.life -= reducedMotion ? 0 : 1
    const progress = particle.life / particle.maxLife
    particle.phase += .075
    particle.x += particle.velocityX + Math.sin(particle.phase) * .28
    particle.y -= reducedMotion ? 0 : particle.velocityY
    drawFlame(particle, progress)
    if (particle.life <= 0 || particle.y < -particle.radius) Object.assign(particle, createParticle(width, height))
  }
  context.globalCompositeOperation = 'source-over'

  if (!reducedMotion && isVisible) animationFrame = requestAnimationFrame(renderFrame)
}

const startAnimation = () => {
  cancelAnimationFrame(animationFrame)
  if (isVisible) renderFrame()
}

const handleMotionChange = (event) => {
  reducedMotion = event.matches
  startAnimation()
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)
  resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
    startAnimation()
  })
  resizeObserver.observe(canvasElement.value)
  intersectionObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting
    if (isVisible) startAnimation()
    else cancelAnimationFrame(animationFrame)
  })
  intersectionObserver.observe(canvasElement.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
})
</script>

<template><canvas ref="canvasElement" aria-hidden="true"></canvas></template>
