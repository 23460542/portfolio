import {
  BookOpen,
  CircuitBoard,
  ExternalLink,
  FileText,
  GitBranch,
  GraduationCap,
  Layers3,
  Maximize2,
  Move,
  Printer,
  TerminalSquare,
} from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as THREE from 'three'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

const SCENE_SNAP_COMMIT = 0.42
const SCENE_SNAP_DELAY = 0.2

function buildPageSnapPoints(maxScroll: number) {
  const anchors = gsap.utils.toArray<HTMLElement>('.snap-anchor')

  return [
    0,
    ...anchors.map((anchor) =>
      gsap.utils.clamp(0, 1, (anchor.getBoundingClientRect().top + window.scrollY) / maxScroll),
    ),
  ]
    .sort((a, b) => a - b)
    .filter((point, index, points) => index === 0 || Math.abs(point - points[index - 1]) > 0.003)
}

function resolveThresholdSnap(
  progress: number,
  points: number[],
  direction: number,
  commitRatio = SCENE_SNAP_COMMIT,
) {
  if (points.length === 0) {
    return progress
  }

  if (points.length === 1) {
    return points[0]
  }

  if (progress <= points[0]) {
    return points[0]
  }

  const lastPoint = points[points.length - 1]

  if (progress >= lastPoint) {
    return lastPoint
  }

  let segmentIndex = 0

  for (let index = 0; index < points.length - 1; index += 1) {
    if (progress < points[index + 1]) {
      segmentIndex = index
      break
    }

    segmentIndex = index
  }

  const start = points[segmentIndex]
  const end = points[segmentIndex + 1]
  const span = end - start

  if (span <= 0) {
    return start
  }

  const local = (progress - start) / span

  if (!direction) {
    return local >= 0.5 ? end : start
  }

  if (direction > 0) {
    return local >= commitRatio ? end : start
  }

  return local <= 1 - commitRatio ? start : end
}

type Point = {
  x: number
  y: number
}

type Metric = {
  label: string
  value: string
  delta: string
}

type TableRow = {
  label: string
  value: string
  signal: string
}

type StackNode = {
  id: string
  label: string
  x: number
  y: number
}

type StackLink = {
  from: string
  to: string
}

type ProjectPanel = {
  id: string
  title: string
  tag: string
  summary: string
  metrics: Metric[]
  chart: number[]
  rows: TableRow[]
  accent: string
  position: Point
  stackNodes: StackNode[]
  stackLinks: StackLink[]
}

type EducationEntry = {
  period: string
  title: string
  detail: string
  region: 'uwa' | 'waapa' | 'aquinas'
  logoVariant: 'columns' | 'stage' | 'crest'
}

type TerminalLine = {
  text: string
  tone: 'command' | 'output'
}

type TerminalCommand = {
  command: string
  output: string[]
  duration: number
}

type IntroPhase = 'loading' | 'revealing' | 'settling' | 'ready'
type StoryScene = 'hero' | 'aboutOpening' | 'about' | 'projectsOpening' | 'projects' | 'educationOpening' | 'education' | 'resumeOpening' | 'resume'
type StorySectionId = 'about' | 'projects' | 'education' | 'resume'

const terminalTranscript: TerminalLine[] = [
  { text: '$ boot portfolio --ascii', tone: 'command' },
  { text: 'ok   renderer: vertical mesh strands / damped cursor tug / ambient wave online', tone: 'output' },
  { text: 'ok   route table: #about #projects #education #resume linked into header', tone: 'output' },
  { text: '$ polym sync --mock-feed --wallets --topics --edge-score', tone: 'command' },
  { text: 'recv 2,408 wallets, 184 markets, 37 watched topics, confidence 0.71', tone: 'output' },
  { text: 'emit dashboard.polym.edge_score=84.6 delta=+6.2 status=watch', tone: 'output' },
  { text: '$ aitrade risk --dry-run --broker paper --audit trace', tone: 'command' },
  { text: 'pass latency=82ms cap=0.35R orders=1,182 risk_pass=97.4%', tone: 'output' },
  { text: 'lock audit_hash=9af3-21 replay_window=24h fail_closed=true', tone: 'output' },
  { text: '$ resume viewer --mount #resume --placeholder public/resume.pdf', tone: 'command' },
  { text: 'ready zoom controls attached, draggable paper window waiting for real PDF', tone: 'output' },
  { text: '$ aws amplify preview --static dist --future-hosting', tone: 'command' },
  { text: 'note build remains static and portable for Pages, Amplify, or S3/CloudFront', tone: 'output' },
  { text: '$ reset terminal --loop', tone: 'command' },
]

const githubUrl = 'https://github.com/23460542'
const linkedInUrl = 'https://www.linkedin.com/in/your-linkedin/'

const projects: ProjectPanel[] = [
  {
    id: 'polym',
    title: 'polym',
    tag: 'suspicious edge store',
    summary: 'Polymarket wallet/topic analytics with copyable edge signals and paper trading views.',
    accent: '#7bff9d',
    position: { x: 0, y: 18 },
    metrics: [
      { label: 'wallets', value: '2,408', delta: '+18%' },
      { label: 'edge score', value: '84.6', delta: '+6.2' },
      { label: 'hit rate', value: '61%', delta: '+3%' },
    ],
    chart: [28, 34, 31, 45, 42, 58, 54, 66, 61, 73, 71, 86],
    rows: [
      { label: '0x7a...91c', value: 'copyability 91', signal: 'YES' },
      { label: 'topic: fed', value: 'sharpe 1.84', signal: 'WATCH' },
      { label: 'paper pnl', value: '+12.7%', signal: 'LIVE' },
    ],
    stackNodes: [
      { id: 'ingest', label: 'Market ingest', x: 14, y: 28 },
      { id: 'wallets', label: 'Wallet graph', x: 40, y: 18 },
      { id: 'signals', label: 'Edge scoring', x: 62, y: 42 },
      { id: 'ui', label: 'React dashboard', x: 32, y: 70 },
      { id: 'paper', label: 'Paper trades', x: 76, y: 74 },
    ],
    stackLinks: [
      { from: 'ingest', to: 'wallets' },
      { from: 'wallets', to: 'signals' },
      { from: 'signals', to: 'paper' },
      { from: 'signals', to: 'ui' },
    ],
  },
  {
    id: 'aitrade',
    title: 'AITrade',
    tag: 'deterministic risk engine',
    summary: 'Portable AI-assisted trading stack with broker adapters, audits, and risk gates.',
    accent: '#b7f7d2',
    position: { x: 350, y: 78 },
    metrics: [
      { label: 'orders', value: '1,182', delta: '+9%' },
      { label: 'risk pass', value: '97.4%', delta: '+1.1' },
      { label: 'latency', value: '82ms', delta: '-14' },
    ],
    chart: [72, 68, 75, 71, 79, 88, 83, 91, 87, 94, 90, 96],
    rows: [
      { label: 'BTC/AUD', value: 'long bias', signal: 'GATED' },
      { label: 'risk cap', value: '0.35R', signal: 'PASS' },
      { label: 'audit hash', value: '9af3-21', signal: 'LOCK' },
    ],
    stackNodes: [
      { id: 'model', label: 'Model advice', x: 18, y: 26 },
      { id: 'risk', label: 'Risk gate', x: 46, y: 22 },
      { id: 'broker', label: 'Broker adapter', x: 74, y: 40 },
      { id: 'audit', label: 'Audit trail', x: 34, y: 70 },
      { id: 'ops', label: 'Ops console', x: 68, y: 76 },
    ],
    stackLinks: [
      { from: 'model', to: 'risk' },
      { from: 'risk', to: 'broker' },
      { from: 'risk', to: 'audit' },
      { from: 'audit', to: 'ops' },
    ],
  },
  {
    id: 'atlas',
    title: 'atlas.feed',
    tag: 'placeholder telemetry',
    summary: 'Future dashboard slot for cross-project health, traces, and deployment signals.',
    accent: '#d7f6a2',
    position: { x: 178, y: 274 },
    metrics: [
      { label: 'jobs', value: '37', delta: '+5' },
      { label: 'uptime', value: '99.8%', delta: 'OK' },
      { label: 'alerts', value: '02', delta: '-3' },
    ],
    chart: [18, 22, 24, 28, 35, 31, 38, 44, 42, 48, 54, 52],
    rows: [
      { label: 'etl run', value: '04:18 UTC', signal: 'DONE' },
      { label: 'model drift', value: '0.08', signal: 'LOW' },
      { label: 'queue depth', value: '13', signal: 'OK' },
    ],
    stackNodes: [
      { id: 'jobs', label: 'Jobs', x: 20, y: 28 },
      { id: 'events', label: 'Events', x: 48, y: 24 },
      { id: 'traces', label: 'Traces', x: 70, y: 48 },
      { id: 'alerts', label: 'Alerts', x: 36, y: 74 },
      { id: 'health', label: 'Health UI', x: 78, y: 76 },
    ],
    stackLinks: [
      { from: 'jobs', to: 'events' },
      { from: 'events', to: 'traces' },
      { from: 'traces', to: 'health' },
      { from: 'events', to: 'alerts' },
    ],
  },
]

const education: EducationEntry[] = [
  {
    period: '2015 -> 2021',
    title: 'Aquinas College',
    detail: 'I was deeply involved in the performing arts, no school day was complete without a couple of hours of rehearsal.',
    region: 'aquinas',
    logoVariant: 'crest',
  },
  {
    period: '2022 -> 2022',
    title: 'WAAPA',
    detail: 'Honing my musical talents, I had to learn how to work well in a team.',
    region: 'waapa',
    logoVariant: 'stage',
  },
  {
    period: '2023 -> 2027',
    title: 'University of Western Australia',
    detail: 'Majoring in Data Science and Cybersecurity with a minor in German, UWA has kept me busy in all aspects of life.',
    region: 'uwa',
    logoVariant: 'columns',
  },
]

const resumeLines = [
  'JAMES T.',
  'Quant systems / AI trading / data product engineering',
  '',
  'SUMMARY',
  'Builds compact tools for market analysis, risk controls, and signal exploration.',
  'Turns noisy public data into dashboards that are fast to scan and easy to trust.',
  '',
  'SELECTED PROJECTS',
  'polym        Polymarket edge scoring, wallet/topic analytics, paper trading.',
  'AITrade     Broker adapters, deterministic risk gates, audit trails.',
  'atlas.feed  Placeholder for future telemetry and portfolio data.',
  '',
  'EDUCATION',
  'Replace this placeholder with your real education details.',
  '',
  'CONTACT',
  'github.com/23460542',
]

const commandSequences: Record<Exclude<StoryScene, 'hero' | 'about' | 'projects' | 'education' | 'resume'>, TerminalCommand[]> = {
  aboutOpening: [
    { command: 'clear', output: [], duration: 520 },
    { command: 'open ABOUTME.md', output: ['mounting paper workspace', 'rendering markdown'], duration: 980 },
  ],
  projectsOpening: [
    { command: 'close ABOUTME.md', output: ['saved viewport state'], duration: 620 },
    { command: 'cd Projects', output: [], duration: 520 },
    { command: 'git log --oneline --decorate', output: ['9f42c8a polym: wallet edge dashboard', '8ae3b01 AITrade: risk gates and audit trail', '52dd811 atlas.feed: telemetry surface'], duration: 1280 },
  ],
  educationOpening: [
    { command: 'close Projects', output: ['dashboard process detached'], duration: 620 },
    { command: 'cd ..', output: [], duration: 420 },
    { command: 'open EDUCATION.md', output: ['loading institutional notes', 'placing placeholder SVG marks'], duration: 1040 },
  ],
  resumeOpening: [
    { command: 'close EDUCATION.md', output: ['paper window collapsed'], duration: 620 },
    { command: 'lp resume.pdf', output: ['spooling placeholder resume', 'future source: /resume.pdf'], duration: 1120 },
  ],
}

const settledSceneByOpening: Record<keyof typeof commandSequences, StoryScene> = {
  aboutOpening: 'about',
  projectsOpening: 'projects',
  educationOpening: 'education',
  resumeOpening: 'resume',
}

function getActiveStorySection(scene: StoryScene): StorySectionId {
  if (scene === 'projects' || scene === 'projectsOpening') {
    return 'projects'
  }

  if (scene === 'education' || scene === 'educationOpening') {
    return 'education'
  }

  if (scene === 'resume' || scene === 'resumeOpening') {
    return 'resume'
  }

  return 'about'
}

function makeSparkline(values: number[]) {
  const width = 220
  const height = 74
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function useDraggable(initialPosition: Point) {
  const [position, setPosition] = useState(initialPosition)
  const [dragStart, setDragStart] = useState<Point | null>(null)

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    })
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (!dragStart) {
      return
    }

    setPosition({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    })
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    setDragStart(null)
  }

  return {
    position,
    setPosition,
    dragging: Boolean(dragStart),
    dragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}

function createBinaryFrame(length = 32) {
  return Array.from({ length }, () => (Math.random() > 0.5 ? '1' : '0'))
    .join('')
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function BinaryTicker({ length = 32 }: { length?: number }) {
  const [frame, setFrame] = useState(() => createBinaryFrame(length))

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFrame(createBinaryFrame(length))
    }, 78)

    return () => window.clearInterval(interval)
  }, [length])

  return (
    <span className="binary-ticker" aria-label="Rapidly changing binary code">
      ---- {frame} ----
    </span>
  )
}

function LoadingScreen({
  onFinished,
  onRevealStart,
  targetRef,
}: {
  onFinished: () => void
  onRevealStart: () => void
  targetRef: RefObject<HTMLAnchorElement>
}) {
  const logoRef = useRef<HTMLDivElement | null>(null)
  const [isFlying, setIsFlying] = useState(false)

  const updateTarget = useCallback(() => {
    const logo = logoRef.current
    const target = targetRef.current

    if (!logo || !target) {
      return
    }

    const logoRect = logo.getBoundingClientRect()
    const targetMark = target.querySelector<HTMLElement>('.hero-underline')
    const targetRect = (targetMark ?? target).getBoundingClientRect()
    const logoCenterX = logoRect.left + logoRect.width / 2
    const logoCenterY = logoRect.top + logoRect.height / 2
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2
    const targetScale = Math.min(targetRect.width / logoRect.width, targetRect.height / logoRect.height)

    logo.style.setProperty('--loader-shift-x', `${targetCenterX - logoCenterX}px`)
    logo.style.setProperty('--loader-shift-y', `${targetCenterY - logoCenterY}px`)
    logo.style.setProperty('--loader-scale', `${Math.max(0.34, Math.min(targetScale, 0.72))}`)
  }, [targetRef])

  useLayoutEffect(() => {
    updateTarget()
    window.addEventListener('resize', updateTarget)
    document.fonts?.ready.then(updateTarget).catch(() => undefined)

    return () => window.removeEventListener('resize', updateTarget)
  }, [updateTarget])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const flyTimer = window.setTimeout(() => {
      updateTarget()
      setIsFlying(true)
      onRevealStart()
    }, prefersReducedMotion ? 140 : 980)
    const finishTimer = window.setTimeout(onFinished, prefersReducedMotion ? 460 : 1900)

    return () => {
      window.clearTimeout(flyTimer)
      window.clearTimeout(finishTimer)
    }
  }, [onFinished, onRevealStart, updateTarget])

  return (
    <div className={`loading-screen ${isFlying ? 'is-flying' : ''}`} aria-label="Loading portfolio">
      <div className="loading-screen-panels" aria-hidden="true">
        <span className="loading-panel loading-panel-top" />
        <span className="loading-panel loading-panel-right" />
        <span className="loading-panel loading-panel-bottom" />
        <span className="loading-panel loading-panel-left" />
      </div>

      <div className="loading-screen-inner">
        <div className="loading-logo-flight" ref={logoRef} aria-hidden="true">
          <div className="loading-logo">
            <span className="loading-logo-layer loading-logo-base">JT</span>
            <span className="loading-logo-layer loading-logo-reveal">JT</span>
          </div>
        </div>
        <div className="loading-pulse" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  )
}

function AsciiRail({ className = '' }: { className?: string }) {
  return (
    <div className={`ascii-rail ${className}`} aria-hidden="true">
      <span className="slash-run">////////////////////////////////////////////////</span>
      <BinaryTicker />
      <span className="slash-run">////////////////////////////////////////////////</span>
    </div>
  )
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <rect x="3" y="8.5" width="3.8" height="12.5" rx="0.5" />
      <circle cx="4.9" cy="4.8" r="2.1" />
      <path d="M10 8.5h3.6v1.7c0.8-1.2 2-2 3.8-2 2.8 0 4.6 1.8 4.6 5.6V21h-3.9v-6.4c0-2-0.7-3-2.1-3-1.5 0-2.2 1.1-2.2 3V21H10V8.5Z" />
    </svg>
  )
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M12 2.2c-5.5 0-9.8 4.3-9.8 9.8 0 4.3 2.8 8 6.7 9.3 0.5 0.1 0.7-0.2 0.7-0.5v-1.9c-2.7 0.6-3.3-1.2-3.3-1.2-0.4-1.1-1.1-1.4-1.1-1.4-0.9-0.6 0.1-0.6 0.1-0.6 1 0.1 1.6 1.1 1.6 1.1 0.9 1.5 2.4 1.1 2.9 0.8 0.1-0.7 0.4-1.1 0.7-1.4-2.2-0.2-4.5-1.1-4.5-4.8 0-1.1 0.4-1.9 1.1-2.6-0.1-0.3-0.5-1.3 0.1-2.6 0 0 0.9-0.3 2.7 1 0.8-0.2 1.6-0.3 2.5-0.3s1.7 0.1 2.5 0.3c1.9-1.3 2.7-1 2.7-1 0.6 1.3 0.2 2.3 0.1 2.6 0.7 0.7 1.1 1.5 1.1 2.6 0 3.7-2.3 4.6-4.5 4.8 0.4 0.3 0.7 0.9 0.7 1.9v2.7c0 0.3 0.2 0.6 0.7 0.5 3.9-1.3 6.7-5 6.7-9.3 0-5.5-4.3-9.8-9.8-9.8Z" />
    </svg>
  )
}

function HeroTerminal() {
  const transcriptLoops = [terminalTranscript, terminalTranscript]

  return (
    <div className="terminal-panel" aria-hidden="true">
      <div className="terminal-panel-bar">
        <TerminalSquare size={16} aria-hidden="true" />
        <span>portfolio terminal</span>
      </div>
      <div className="terminal-scroll">
        {transcriptLoops.map((lines, loopIndex) => (
          <div className="terminal-block" key={`terminal-loop-${loopIndex}`}>
            {lines.map((line, lineIndex) => (
              <span className={`terminal-line terminal-line-${line.tone}`} key={`${line.text}-${loopIndex}-${lineIndex}`}>
                {line.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroIdentityBand() {
  const marqueeWords = ['STUDENT', '+', 'CREATIVE', '+', 'VIBE CODER', '+']
  const marqueeSequence = Array.from({ length: 4 }, () => marqueeWords).flat()

  return (
    <section className="hero-identity-band" aria-label="Identity ticker">
      <HeroTerminal />

      <div className="identity-marquee" aria-hidden="true">
        {Array.from({ length: 2 }, (_, groupIndex) => (
          <div className="identity-marquee-group" key={`identity-${groupIndex}`}>
            {marqueeSequence.map((word, wordIndex) => (
              <span className={word === '+' ? 'identity-plus' : undefined} key={`${word}-${groupIndex}-${wordIndex}`}>
                {word}
              </span>
            ))}
          </div>
        ))}
      </div>

      <h1 className="sr-only">Student, creative, vibe coder</h1>
    </section>
  )
}

function createVerticalWaveGeometry(width: number, height: number, columns: number, rows: number) {
  const vertices: number[] = []

  for (let column = 0; column < columns; column += 1) {
    const x = (column / (columns - 1) - 0.5) * width

    for (let row = 0; row < rows - 1; row += 1) {
      const yA = (row / (rows - 1) - 0.5) * height
      const yB = ((row + 1) / (rows - 1) - 0.5) * height

      vertices.push(x, yA, 0, x, yB, 0)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

  return geometry
}

function WaveMeshHero({ introPhase }: { introPhase: IntroPhase }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const introPhaseRef = useRef<IntroPhase>(introPhase)
  const revealStartRef = useRef<number | null>(introPhase === 'revealing' ? performance.now() : null)

  useEffect(() => {
    introPhaseRef.current = introPhase

    if (introPhase === 'revealing') {
      revealStartRef.current = performance.now()
    }

    if (introPhase === 'loading') {
      revealStartRef.current = null
    }
  }, [introPhase])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const host = container
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.className = 'wave-canvas'
    renderer.domElement.setAttribute('aria-label', 'Interactive green vertical wave mesh')
    host.appendChild(renderer.domElement)

    const cursorDot = document.createElement('span')
    cursorDot.className = 'wave-cursor-dot'
    cursorDot.setAttribute('aria-hidden', 'true')
    host.appendChild(cursorDot)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, -0.12, 4.55)
    camera.lookAt(0, 0, 0)

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uCursorAcceleration: { value: new THREE.Vector2(0, 0) },
      uCursorImpulse: { value: 0 },
      uCursorTug: { value: new THREE.Vector2(0, 0) },
      uHover: { value: 0 },
      uIntroProgress: { value: 0 },
    }

    const geometry = createVerticalWaveGeometry(16.8, 7.4, 86, 38)
    const material = new THREE.ShaderMaterial({
      fragmentShader: `
        uniform float uIntroProgress;
        varying float vElevation;
        varying vec2 vRevealCoord;

        float smootherStep(float value) {
          float t = clamp(value, 0.0, 1.0);
          return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
        }

        void main() {
          float pulse = clamp(vElevation * 1.4 + 0.55, 0.0, 1.0);
          vec3 deep = vec3(0.25, 0.95, 0.48);
          vec3 hot = vec3(0.9, 1.0, 0.72);
          vec3 color = mix(deep, hot, pulse);
          float sweepDelay = vRevealCoord.x * 0.42;
          float lineProgress = smootherStep((uIntroProgress - sweepDelay) / (1.0 - sweepDelay));
          float revealAlpha = smoothstep(vRevealCoord.y - 0.035, vRevealCoord.y + 0.035, lineProgress);

          if (revealAlpha <= 0.01) {
            discard;
          }

          gl_FragColor = vec4(color, 0.82 * revealAlpha);
        }
      `,
      transparent: true,
      uniforms,
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform vec2 uCursorAcceleration;
        uniform float uCursorImpulse;
        uniform vec2 uCursorTug;
        uniform float uHover;
        varying float vElevation;
        varying vec2 vRevealCoord;

        void main() {
          vec3 pos = position;
          vec2 normalized = vec2(position.x / 8.4, position.y / 3.7);
          float waveFront = position.x * 1.15 + uTime * 1.05;
          float waveSweep = sin(waveFront);
          float noisyBand = sin(position.y * 3.4 + uTime * 0.74) * 0.018;
          float compression = waveSweep * 0.26 + noisyBand;
          pos.x += compression;

          float baseWave = sin(position.x * 1.28 + uTime * 0.48) * 0.16;
          baseWave += sin(position.y * 2.5 - uTime * 0.58) * 0.072;
          baseWave += sin((position.x * 1.7 + position.y * 0.82) + uTime * 0.44) * 0.09;

          vec2 cursorDelta = normalized - uMouse;
          float dist = length(cursorDelta);
          float impulse = clamp(uCursorImpulse, 0.0, 2.25);
          float catchFalloff = mix(4.3, 1.85, clamp(impulse * 0.55, 0.0, 1.0));
          float catchInfluence = exp(-dist * catchFalloff) * uHover;
          float tugStrength = clamp(length(uCursorTug) * (3.6 + impulse * 4.8), 0.0, 2.6);
          vec2 motionVector = uCursorTug * 0.78 + uCursorAcceleration * 0.32;
          vec2 motionDirection = motionVector / max(length(motionVector), 0.001);
          float trailingSide = 1.0 - smoothstep(-0.62, 0.28, dot(cursorDelta, motionDirection));
          float followInfluence = catchInfluence * mix(0.9, 2.8, trailingSide) * (1.0 + impulse * 0.85);
          float depthInfluence = exp(-dist * 4.3) * uHover;
          float forwardPull = depthInfluence * 0.34;

          pos.xy += (uCursorTug * 0.62 + uCursorAcceleration * 0.18) * followInfluence;
          pos.z = baseWave + forwardPull;
          vElevation = pos.z;
          vRevealCoord = vec2((position.x + 8.4) / 16.8, (position.y + 3.7) / 7.4);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
    })

    const waveLines = new THREE.LineSegments(geometry, material)
    waveLines.rotation.x = -0.28
    waveLines.rotation.y = 0.08
    waveLines.rotation.z = -0.045
    scene.add(waveLines)

    let frameId = 0
    let targetHover = 0
    let targetImpulse = 0
    let hasPointerSample = false
    let lastPointerSampleTime = performance.now()
    let previousTimestamp = performance.now()
    const accelerationTarget = new THREE.Vector2(0, 0)
    const currentVelocity = new THREE.Vector2(0, 0)
    const latestAcceleration = new THREE.Vector2(0, 0)
    const previousPointer = new THREE.Vector2(0, 0)
    const previousVelocity = new THREE.Vector2(0, 0)
    const sampledMouse = new THREE.Vector2(0, 0)
    const targetMouse = new THREE.Vector2(0, 0)
    const tugTarget = new THREE.Vector2(0, 0)
    const timer = new THREE.Timer()
    timer.connect(document)

    function resize() {
      const { width, height } = host.getBoundingClientRect()
      const safeWidth = Math.max(width, 1)
      const safeHeight = Math.max(height, 1)

      renderer.setSize(safeWidth, safeHeight, false)
      camera.aspect = safeWidth / safeHeight
      camera.updateProjectionMatrix()
    }

    function onPointerMove(event: globalThis.PointerEvent) {
      const rect = host.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) {
        return
      }

      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      const sampleTime = performance.now()
      const sampleDelta = Math.min(Math.max((sampleTime - lastPointerSampleTime) / 1000, 1 / 240), 0.1)

      sampledMouse.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1))

      if (hasPointerSample) {
        currentVelocity.subVectors(sampledMouse, previousPointer).divideScalar(sampleDelta)
        latestAcceleration
          .subVectors(currentVelocity, previousVelocity)
          .multiplyScalar(0.024)
          .clampLength(0, 1.55)
        targetImpulse = Math.max(
          targetImpulse,
          THREE.MathUtils.clamp(currentVelocity.length() * 0.18 + latestAcceleration.length() * 1.55, 0, 2.25),
        )
        previousVelocity.copy(currentVelocity)
      } else {
        currentVelocity.set(0, 0)
        latestAcceleration.set(0, 0)
        previousVelocity.set(0, 0)
        hasPointerSample = true
      }

      previousPointer.copy(sampledMouse)
      targetMouse.copy(sampledMouse)
      targetHover = 1
      lastPointerSampleTime = sampleTime
    }

    function releaseCursor() {
      targetHover = 0
      targetImpulse = 0
      hasPointerSample = false
      latestAcceleration.set(0, 0)
      previousVelocity.set(0, 0)
    }

    function onPointerLeave() {
      releaseCursor()
    }

    function onWindowPointerMove(event: globalThis.PointerEvent) {
      const rect = host.getBoundingClientRect()
      const isInsideHost =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (!isInsideHost) {
        releaseCursor()
      }
    }

    function animate(timestamp?: number) {
      const now = timestamp ?? performance.now()
      const deltaTime = Math.min(Math.max((now - previousTimestamp) / 1000, 1 / 240), 0.08)
      previousTimestamp = now
      timer.update(timestamp)
      uniforms.uTime.value = timer.getElapsed()
      uniforms.uMouse.value.x = THREE.MathUtils.damp(uniforms.uMouse.value.x, targetMouse.x, 7.6, deltaTime)
      uniforms.uMouse.value.y = THREE.MathUtils.damp(uniforms.uMouse.value.y, targetMouse.y, 7.6, deltaTime)
      uniforms.uHover.value = THREE.MathUtils.damp(uniforms.uHover.value, targetHover, 8.4, deltaTime)
      targetImpulse = THREE.MathUtils.damp(targetImpulse, 0, 3.6, deltaTime)
      latestAcceleration.multiplyScalar(Math.exp(-5.6 * deltaTime))
      accelerationTarget.copy(latestAcceleration).multiplyScalar(uniforms.uHover.value)
      uniforms.uCursorImpulse.value = THREE.MathUtils.damp(
        uniforms.uCursorImpulse.value,
        targetImpulse * uniforms.uHover.value,
        10.8,
        deltaTime,
      )
      uniforms.uCursorAcceleration.value.x = THREE.MathUtils.damp(
        uniforms.uCursorAcceleration.value.x,
        accelerationTarget.x,
        9.4,
        deltaTime,
      )
      uniforms.uCursorAcceleration.value.y = THREE.MathUtils.damp(
        uniforms.uCursorAcceleration.value.y,
        accelerationTarget.y,
        9.4,
        deltaTime,
      )
      tugTarget
        .subVectors(targetMouse, uniforms.uMouse.value)
        .multiplyScalar(uniforms.uHover.value * (1 + uniforms.uCursorImpulse.value * 1.3))
        .clampLength(0, 0.62 + uniforms.uCursorImpulse.value * 0.48)
      uniforms.uCursorTug.value.x = THREE.MathUtils.damp(uniforms.uCursorTug.value.x, tugTarget.x, 11.4, deltaTime)
      uniforms.uCursorTug.value.y = THREE.MathUtils.damp(uniforms.uCursorTug.value.y, tugTarget.y, 11.4, deltaTime)

      const cursorX = ((uniforms.uMouse.value.x + 1) / 2) * host.clientWidth
      const cursorY = ((1 - uniforms.uMouse.value.y) / 2) * host.clientHeight
      const cursorScale = 1 + uniforms.uCursorImpulse.value * 0.52
      cursorDot.style.transform = `translate3d(${cursorX.toFixed(2)}px, ${cursorY.toFixed(2)}px, 0) translate(-50%, -50%) scale(${cursorScale.toFixed(3)})`
      cursorDot.style.opacity = `${THREE.MathUtils.smoothstep(uniforms.uHover.value, 0.08, 0.58).toFixed(3)}`

      if (introPhaseRef.current === 'revealing') {
        const revealStart = revealStartRef.current ?? performance.now()
        uniforms.uIntroProgress.value = THREE.MathUtils.clamp((performance.now() - revealStart) / 1280, 0, 1)
      } else if (introPhaseRef.current === 'loading') {
        uniforms.uIntroProgress.value = 0
      } else {
        uniforms.uIntroProgress.value = 1
      }

      waveLines.rotation.z = Math.sin(uniforms.uTime.value * 0.11) * 0.014 - 0.045
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('pointermove', onWindowPointerMove)
    resize()
    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('pointermove', onWindowPointerMove)
      timer.dispose()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      cursorDot.remove()
    }
  }, [])

  return <div className="wave-scene" ref={containerRef} />
}

type OpeningScene = keyof typeof commandSequences

function isOpeningScene(scene: StoryScene): scene is OpeningScene {
  return Object.prototype.hasOwnProperty.call(commandSequences, scene)
}

function StoryTerminal({ lines, active }: { lines: TerminalLine[]; active: boolean }) {
  return (
    <div className={`story-command-terminal ${active ? 'is-active' : ''}`} aria-live="polite">
      <div className="story-command-frame">
        <div className="story-command-bar">
          <TerminalSquare size={16} aria-hidden="true" />
          <span>portfolio terminal</span>
        </div>
        <div className="story-command-body">
          {lines.length > 0 ? (
            lines.map((line, index) => (
              <span className={`terminal-line terminal-line-${line.tone}`} key={`${line.text}-${index}`}>
                {line.tone === 'command' ? `$ ${line.text}` : line.text}
              </span>
            ))
          ) : (
            <span className="terminal-line terminal-line-command">$</span>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionSwitcher({
  activeSection,
  visible,
}: {
  activeSection: StorySectionId
  visible: boolean
}) {
  const sections: Array<{ id: StorySectionId; label: string }> = [
    { id: 'about', label: 'ABOUT' },
    { id: 'projects', label: 'PROJECTS' },
    { id: 'education', label: 'EDUCATION' },
    { id: 'resume', label: 'RESUME' },
  ]

  return (
    <nav className={`section-switcher ${visible ? 'is-visible' : ''}`} aria-label="Portfolio sections">
      {sections.map((section) => (
        <a
          className={activeSection === section.id ? 'is-active' : undefined}
          href={`#${section.id}`}
          key={section.id}
        >
          {section.label}
        </a>
      ))}
    </nav>
  )
}

function FileWindow({
  children,
  icon,
  state = 'open',
  title,
  variant = 'paper',
}: {
  children: ReactNode
  icon: ReactNode
  state?: 'open' | 'closing' | 'dormant'
  title: string
  variant?: 'paper' | 'projects' | 'resume'
}) {
  return (
    <section className={`file-window file-window-${variant} is-${state}`} aria-label={title}>
      <header className="file-window-titlebar">
        <span>
          {icon}
          {title}
        </span>
        <span>
          <Maximize2 size={14} aria-hidden="true" />
          window
        </span>
      </header>
      <div className="file-window-body">{children}</div>
    </section>
  )
}

function AboutMarkdown() {
  return (
    <article className="markdown-paper">
      <p className="markdown-kicker">ABOUTME.md</p>
      <h2>James Turner</h2>
      <p>
        I always like to put my education into practice. Where that used to mean playing guitar in jazz bars and pubs,
        now it means turning real-world data into real-world results.
      </p>
      <p>
        My interest in financial markets drives the way I study data science: I like systems that can be inspected,
        challenged, and improved. That naturally led me toward quant trading tools, large-scale analysis, and machine
        learning workflows with practical feedback loops.
      </p>
      <blockquote>
        Build the thing, measure the thing, then make the thing easier to trust.
      </blockquote>
      <h3>Current focus</h3>
      <ul>
        <li>Data science and cybersecurity at UWA.</li>
        <li>Financial market analysis, risk gates, and signal dashboards.</li>
        <li>Interfaces that make complex systems feel calm and readable.</li>
      </ul>
    </article>
  )
}

function ProjectSparkline({ project }: { project: ProjectPanel }) {
  const points = useMemo(() => makeSparkline(project.chart), [project.chart])

  return (
    <svg viewBox="0 0 220 74" role="img" aria-label={`${project.title} trend`}>
      <polyline points={points} />
    </svg>
  )
}

function ProjectCarousel({ activeIndex, onSelect }: { activeIndex: number; onSelect: (index: number) => void }) {
  return (
    <div className="project-carousel" aria-label="Project carousel">
      {projects.map((project, index) => {
        const offset = index - activeIndex
        const distance = Math.abs(offset)
        const isActive = index === activeIndex

        return (
          <button
            className={`carousel-card ${isActive ? 'is-active' : ''}`}
            key={project.id}
            onClick={() => onSelect(index)}
            type="button"
            style={
              {
                '--card-offset': offset,
                '--card-opacity': Math.max(0.2, 1 - distance * 0.22),
                '--card-rotate': `${offset * -5}deg`,
                '--card-scale': Math.max(0.88, 1 - distance * 0.045),
                '--card-y': `${offset * 238}px`,
                '--card-z': `${Math.abs(offset) * -64}px`,
                '--card-stack': projects.length - distance,
                '--accent': project.accent,
              } as CSSProperties
            }
            aria-current={isActive ? 'true' : undefined}
          >
            <span>{project.tag}</span>
            <h3>{project.title}</h3>
            <ProjectSparkline project={project} />
          </button>
        )
      })}
    </div>
  )
}

function TechStackDiagram({ project }: { project: ProjectPanel }) {
  const { position, dragging, dragProps } = useDraggable({ x: 0, y: 0 })
  const nodeById = useMemo(() => new Map(project.stackNodes.map((node) => [node.id, node])), [project.stackNodes])

  return (
    <div className={`tech-map ${dragging ? 'is-dragging' : ''}`}>
      <div
        className="tech-map-canvas"
        style={
          {
            '--map-x': `${position.x}px`,
            '--map-y': `${position.y}px`,
            '--accent': project.accent,
          } as CSSProperties
        }
        {...dragProps}
      >
        <svg className="tech-map-links" viewBox="0 0 100 100" aria-hidden="true">
          {project.stackLinks.map((link) => {
            const from = nodeById.get(link.from)
            const to = nodeById.get(link.to)

            if (!from || !to) {
              return null
            }

            return <line key={`${link.from}-${link.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
          })}
        </svg>
        {project.stackNodes.map((node) => (
          <span
            className="tech-node"
            key={node.id}
            style={
              {
                '--node-x': `${node.x}%`,
                '--node-y': `${node.y}%`,
              } as CSSProperties
            }
          >
            {node.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProjectsWindow({
  activeIndex,
  onSelectProject,
}: {
  activeIndex: number
  onSelectProject: (index: number) => void
}) {
  const project = projects[activeIndex] ?? projects[0]

  return (
    <div className="projects-workspace" style={{ '--accent': project.accent } as CSSProperties}>
      <aside className="projects-dashboard">
        <div className="dashboard-heading">
          <Layers3 size={18} aria-hidden="true" />
          <span>git log</span>
        </div>
        <ProjectCarousel activeIndex={activeIndex} onSelect={onSelectProject} />
        <div className="metric-grid">
          {project.metrics.map((metric) => (
            <div className="metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <em>{metric.delta}</em>
            </div>
          ))}
        </div>
      </aside>

      <div className="project-detail-grid">
        <article className="project-summary-panel">
          <p className="markdown-kicker">{project.tag}</p>
          <h2>{project.title}</h2>
          <p>{project.summary}</p>
          <div className="project-table">
            {project.rows.map((row) => (
              <div className="project-row" key={row.label}>
                <span>{row.label}</span>
                <span>{row.value}</span>
                <strong>{row.signal}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="tech-stack-panel">
          <header>
            <CircuitBoard size={18} aria-hidden="true" />
            <span>movable stack map</span>
            <Move size={14} aria-hidden="true" />
          </header>
          <TechStackDiagram project={project} />
        </article>
      </div>
    </div>
  )
}

function InstitutionLogo({ variant }: { variant: EducationEntry['logoVariant'] }) {
  if (variant === 'stage') {
    return (
      <svg className="institution-logo" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M10 48h44v8H10z" />
        <path d="M16 14h32l6 24H10z" />
        <path d="M22 22h20M18 32h28" />
      </svg>
    )
  }

  if (variant === 'crest') {
    return (
      <svg className="institution-logo" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 8 52 16v14c0 13-8 22-20 28C20 52 12 43 12 30V16z" />
        <path d="M22 25h20M32 18v30" />
      </svg>
    )
  }

  return (
    <svg className="institution-logo" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 52h48M12 18h40L32 8zM16 22v24M28 22v24M40 22v24M52 22v24" />
    </svg>
  )
}

function EducationCard({ entry }: { entry: EducationEntry }) {
  return (
    <article className={`education-card education-card-${entry.region}`}>
      <header>
        <InstitutionLogo variant={entry.logoVariant} />
        <div>
          <span>{entry.period}</span>
          <h3>{entry.title}</h3>
        </div>
      </header>
      <p>{entry.detail}</p>
    </article>
  )
}

function EducationWindow() {
  const educationByRegion = useMemo(
    () =>
      education.reduce(
        (entries, entry) => ({
          ...entries,
          [entry.region]: entry,
        }),
        {} as Record<EducationEntry['region'], EducationEntry>,
      ),
    [],
  )

  return (
    <div className="education-paper-grid">
      <EducationCard entry={educationByRegion.uwa} />
      <div className="education-right-column">
        <EducationCard entry={educationByRegion.waapa} />
        <EducationCard entry={educationByRegion.aquinas} />
      </div>
    </div>
  )
}

function ResumeWindow({ resumeSource = null }: { resumeSource?: string | null }) {
  return (
    <div className="resume-paper-shell" data-resume-source={resumeSource ?? 'placeholder'}>
      {resumeSource ? (
        <object className="resume-pdf-slot" data={resumeSource} type="application/pdf">
          <ResumePlaceholder />
        </object>
      ) : (
        <ResumePlaceholder />
      )}
    </div>
  )
}

function ResumePlaceholder() {
  return (
    <article className="resume-document-scroll">
      {resumeLines.map((line, index) =>
        line ? (
          <p key={`${line}-${index}`}>{line}</p>
        ) : (
          <div className="resume-gap" key={`gap-${index}`} aria-hidden="true" />
        ),
      )}
      <div className="resume-future-note">
        <Printer size={16} aria-hidden="true" />
        <span>Placeholder render. The component can swap to a real PDF through the resumeSource prop.</span>
      </div>
    </article>
  )
}

function TransitionGhost({ scene }: { scene: StoryScene }) {
  if (scene === 'projectsOpening') {
    return (
      <FileWindow icon={<BookOpen size={16} aria-hidden="true" />} state="closing" title="ABOUTME.md">
        <AboutMarkdown />
      </FileWindow>
    )
  }

  if (scene === 'educationOpening') {
    return (
      <FileWindow icon={<Layers3 size={16} aria-hidden="true" />} state="closing" title="Projects/git-log.dashboard" variant="projects">
        <ProjectsWindow activeIndex={0} onSelectProject={() => undefined} />
      </FileWindow>
    )
  }

  if (scene === 'resumeOpening') {
    return (
      <FileWindow icon={<GraduationCap size={16} aria-hidden="true" />} state="closing" title="EDUCATION.md">
        <EducationWindow />
      </FileWindow>
    )
  }

  return null
}

function App() {
  const shellRef = useRef<HTMLElement | null>(null)
  const logoHomeRef = useRef<HTMLAnchorElement | null>(null)
  const wavePanelRef = useRef<HTMLDivElement | null>(null)
  const [introPhase, setIntroPhase] = useState<IntroPhase>('loading')
  const [showLoader, setShowLoader] = useState(true)
  const [storyScene, setStoryScene] = useState<StoryScene>('hero')
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [activeProjectIndex, setActiveProjectIndex] = useState(0)
  const [heroHandoffActive, setHeroHandoffActive] = useState(false)

  const scrollToProject = useCallback((index: number) => {
    const shell = shellRef.current
    const projectsSection = shell?.querySelector<HTMLElement>('.projects-scene')
    const boundedIndex = Math.max(0, Math.min(projects.length - 1, index))
    const projectStop = shell?.querySelector<HTMLElement>(`.project-scroll-stop[data-project-index="${boundedIndex}"]`)

    if (projectStop) {
      const top = projectStop.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top, behavior: 'smooth' })
      return
    }

    if (!projectsSection) {
      return
    }

    const travel = Math.max(projectsSection.offsetHeight - window.innerHeight, 1)
    const ratio = projects.length > 1 ? boundedIndex / (projects.length - 1) : 0
    const top = projectsSection.getBoundingClientRect().top + window.scrollY + travel * ratio

    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  const updateWaveRiseDistance = useCallback(() => {
    const shell = shellRef.current
    const wavePanel = wavePanelRef.current

    if (!shell || !wavePanel) {
      return
    }

    const { left, top } = wavePanel.getBoundingClientRect()
    const revealHeight = Math.max(window.innerHeight - top, 0)
    const viewportMax = Math.max(window.innerWidth, window.innerHeight)

    shell.style.setProperty('--wave-reveal-height', `${revealHeight}px`)
    shell.style.setProperty('--wave-rise-distance', `${revealHeight}px`)
    shell.style.setProperty('--wave-glow-x', `${window.innerWidth * 0.52 - left}px`)
    shell.style.setProperty('--wave-glow-y', `${window.innerHeight * 0.47 - top}px`)
    shell.style.setProperty('--wave-glow-radius', `${viewportMax * 0.34}px`)
    shell.style.setProperty('--wave-mask-x', `${window.innerWidth * 0.5 - left}px`)
    shell.style.setProperty('--wave-mask-y', `${window.innerHeight * 0.5 - top}px`)
    shell.style.setProperty('--wave-mask-rx', `${window.innerWidth * 0.54}px`)
    shell.style.setProperty('--wave-mask-ry', `${window.innerHeight * 0.48}px`)
  }, [])

  const startReveal = useCallback(() => {
    updateWaveRiseDistance()
    setIntroPhase('revealing')
  }, [updateWaveRiseDistance])

  const finishLoading = useCallback(() => {
    setShowLoader(false)
  }, [])

  useLayoutEffect(() => {
    updateWaveRiseDistance()
    window.addEventListener('resize', updateWaveRiseDistance)

    return () => window.removeEventListener('resize', updateWaveRiseDistance)
  }, [updateWaveRiseDistance])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (introPhase === 'revealing') {
      const revealTimer = window.setTimeout(() => setIntroPhase('settling'), prefersReducedMotion ? 90 : 1280)

      return () => window.clearTimeout(revealTimer)
    }

    if (introPhase === 'settling') {
      const settleTimer = window.setTimeout(() => setIntroPhase('ready'), prefersReducedMotion ? 90 : 660)

      return () => window.clearTimeout(settleTimer)
    }

    return undefined
  }, [introPhase])

  useEffect(() => {
    if (!isOpeningScene(storyScene)) {
      if (storyScene === 'hero') {
        setTerminalLines([])
      }

      return undefined
    }

    const timers: number[] = []
    let elapsed = 140

    setTerminalLines([])

    commandSequences[storyScene].forEach((command) => {
      timers.push(
        window.setTimeout(() => {
          setTerminalLines((lines) => [...lines, { text: command.command, tone: 'command' }])
        }, elapsed),
      )

      if (command.output.length > 0) {
        timers.push(
          window.setTimeout(() => {
            setTerminalLines((lines) => [
              ...lines,
              ...command.output.map((text) => ({ text, tone: 'output' as const })),
            ])
          }, elapsed + Math.min(320, command.duration * 0.34)),
        )
      }

      elapsed += command.duration
    })

    timers.push(
      window.setTimeout(() => {
        const settledScene = settledSceneByOpening[storyScene]

        if (settledScene === 'projects') {
          setActiveProjectIndex(0)
        }

        setStoryScene(settledScene)
      }, elapsed + 180),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [storyScene])

  useLayoutEffect(() => {
    const shell = shellRef.current

    if (!shell || showLoader) {
      return undefined
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const context = gsap.context(() => {
      const hero = shell.querySelector<HTMLElement>('.hero')
      const header = shell.querySelector<HTMLElement>('.hero-grid-header')
      const wave = shell.querySelector<HTMLElement>('.hero-wave-panel')
      const marquee = shell.querySelector<HTMLElement>('.identity-marquee')
      const bottomRail = shell.querySelector<HTMLElement>('.ascii-rail-bottom')
      const scrollStory = shell.querySelector<HTMLElement>('.scroll-story')
      const storyStage = shell.querySelector<HTMLElement>('.story-stage')

      if (hero && header && wave && marquee && bottomRail) {
        const handoffThreshold = 0.72

        const heroTimeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: prefersReducedMotion ? false : true,
            onEnter: () => setStoryScene('hero'),
            onUpdate: (self) => {
              const nextHandoffActive = self.progress > handoffThreshold

              setHeroHandoffActive((current) => {
                return current === nextHandoffActive ? current : nextHandoffActive
              })

              if (!nextHandoffActive) {
                setStoryScene((current) => (current === 'hero' ? current : 'hero'))
              }

              if (self.progress > 0.985) {
                setStoryScene((current) => (current === 'hero' ? 'aboutOpening' : current))
              }
            },
            onLeave: () => {
              setHeroHandoffActive(true)
              setStoryScene((current) => (current === 'hero' ? 'aboutOpening' : current))
            },
            onLeaveBack: () => setHeroHandoffActive(false),
          },
        })

        heroTimeline
          .to(marquee, { autoAlpha: 0, duration: 0.42, scale: 0.96 }, 0.08)
          .to(hero, { '--hero-frame-x': '0px', duration: 0.48 }, 0.38)
          .to(wave, { autoAlpha: 0.72, duration: 0.36, yPercent: -7 }, 0.44)
          .to(header, { autoAlpha: 0, duration: 0.24, yPercent: -112 }, 0.76)
      }

      const sectionScenes: Array<[string, OpeningScene]> = [
        ['.about-scene', 'aboutOpening'],
        ['.projects-scene', 'projectsOpening'],
        ['.education-scene', 'educationOpening'],
        ['.resume-scene', 'resumeOpening'],
      ]
      const sectionEntries = sectionScenes.flatMap(([selector, opening]) => {
        const section = shell.querySelector<HTMLElement>(selector)

        return section ? [{ opening, section, selector }] : []
      })
      const openingForScrollPosition = () => {
        const scrollTop = window.scrollY

        return sectionEntries.reduce<OpeningScene | null>((activeOpening, { opening, section }) => {
          const sectionTop = section.getBoundingClientRect().top + window.scrollY

          return sectionTop <= scrollTop ? opening : activeOpening
        }, null)
      }

      const activateOpening = (opening: OpeningScene, source: string) => {
        const shouldResolveFromScroll = !source.startsWith('.') || !source.endsWith(':enterBack')
        const resolvedOpening = shouldResolveFromScroll ? openingForScrollPosition() ?? opening : opening

        setStoryScene((current) =>
          current === resolvedOpening || current === settledSceneByOpening[resolvedOpening] ? current : resolvedOpening,
        )
      }

      sectionEntries.forEach(({ opening, section, selector }) => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          onEnter: () => activateOpening(opening, `${selector}:enter`),
          onEnterBack: () => activateOpening(opening, `${selector}:enterBack`),
        })
      })

      if (scrollStory && storyStage) {
        ScrollTrigger.create({
          trigger: scrollStory,
          start: 'top top',
          end: 'bottom bottom',
          pin: storyStage,
          pinSpacing: false,
          anticipatePin: 1,
          onEnter: () => {
            setHeroHandoffActive(true)
            activateOpening('aboutOpening', 'scroll-story:enter')
          },
          onEnterBack: () => {
            setHeroHandoffActive(true)
            activateOpening('aboutOpening', 'scroll-story:enterBack')
          },
          onLeaveBack: () => {
            setHeroHandoffActive(window.scrollY > window.innerHeight * 0.72)
          },
        })
      }

      const projectsSection = shell.querySelector<HTMLElement>('.projects-scene')

      if (projectsSection) {
        ScrollTrigger.create({
          trigger: projectsSection,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            const nextIndex =
              self.progress >= 1
                ? projects.length - 1
                : Math.min(projects.length - 1, Math.floor(self.progress * projects.length))
            setActiveProjectIndex(nextIndex)
          },
        })
      }

      ScrollTrigger.create({
        trigger: shell,
        start: 0,
        end: () => ScrollTrigger.maxScroll(window),
        snap: prefersReducedMotion
          ? undefined
          : {
              directional: false,
              delay: SCENE_SNAP_DELAY,
              duration: { min: 0.32, max: 0.82 },
              ease: 'power3.inOut',
              snapTo: (progress, self) => {
                const maxScroll = Math.max(ScrollTrigger.maxScroll(window), 1)
                const snapPoints = buildPageSnapPoints(maxScroll)

                return resolveThresholdSnap(progress, snapPoints, self?.direction ?? 0)
              },
            },
      })
    }, shell)

    document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => undefined)

    return () => context.revert()
  }, [showLoader])

  const storyActive = storyScene !== 'hero'
  const chromeVisible = storyActive || heroHandoffActive
  const activeSection = getActiveStorySection(storyScene)

  return (
    <main
      className={`site-shell is-${introPhase} ${showLoader ? 'has-loader' : ''} ${
        storyActive ? 'is-story-active' : ''
      }`}
      ref={shellRef}
    >
      {showLoader ? (
        <LoadingScreen onFinished={finishLoading} onRevealStart={startReveal} targetRef={logoHomeRef} />
      ) : null}

      <a className={`floating-logo ${chromeVisible ? 'is-visible' : ''}`} href="#top" aria-label="Back to top">
        JT
      </a>
      <SectionSwitcher activeSection={activeSection} visible={chromeVisible} />

      <section className="hero" id="top">
        <header className="hero-grid-header">
          <a href="#top" className="hero-logo" aria-label="Back to top" ref={logoHomeRef}>
            <span className="hero-underline">JT</span>
          </a>

          <div className="hero-status">
            <span className="hero-underline">PORTFOLIO://JAMES_TURNER</span>
            <span className="hero-underline">UWA / 23460542</span>
          </div>

          <nav className="hero-nav" aria-label="Portfolio sections">
            <a href="#about">
              <span className="hero-underline">ABOUT</span>
            </a>
            <a href="#projects">
              <span className="hero-underline">PROJECTS</span>
            </a>
            <a href="#education">
              <span className="hero-underline">EDUCATION</span>
            </a>
          </nav>

          <div className="hero-actions" aria-label="Social links">
            <a className="hero-social-link" href={linkedInUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedInMark />
            </a>
            <a className="hero-social-link" href={githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GitHubMark />
            </a>
          </div>

          <a className="resume-jump" href="#resume">
            <span className="hero-underline resume-jump-label resume-jump-label-full">
              ↓ I'm just here for the resume ↓
            </span>
            <span className="hero-underline resume-jump-label resume-jump-label-compact">↓ Resume ↓</span>
          </a>
        </header>

        <div className="hero-wave-panel" ref={wavePanelRef}>
          <WaveMeshHero introPhase={introPhase} />
        </div>

        <div className="hero-story-stack">
          <AsciiRail className="ascii-rail-top" />
          <HeroIdentityBand />
          <AsciiRail className="ascii-rail-bottom" />
        </div>
      </section>

      <div className="scroll-story">
        <div className="story-stage">
          <div className="story-viewport">
            <StoryTerminal active={storyActive} lines={terminalLines} />
            <TransitionGhost scene={storyScene} />

            <div className="scene-layer">
              <FileWindow
                icon={<BookOpen size={16} aria-hidden="true" />}
                state={storyScene === 'about' ? 'open' : 'dormant'}
                title="ABOUTME.md"
              >
                <AboutMarkdown />
              </FileWindow>
            </div>

            <div className="scene-layer">
              <FileWindow
                icon={<Layers3 size={16} aria-hidden="true" />}
                state={storyScene === 'projects' ? 'open' : 'dormant'}
                title="Projects/git-log.dashboard"
                variant="projects"
              >
                <ProjectsWindow activeIndex={activeProjectIndex} onSelectProject={scrollToProject} />
              </FileWindow>
            </div>

            <div className="scene-layer">
              <FileWindow
                icon={<GraduationCap size={16} aria-hidden="true" />}
                state={storyScene === 'education' ? 'open' : 'dormant'}
                title="EDUCATION.md"
              >
                <EducationWindow />
              </FileWindow>
            </div>

            <div className="scene-layer">
              <FileWindow
                icon={<FileText size={16} aria-hidden="true" />}
                state={storyScene === 'resume' ? 'open' : 'dormant'}
                title="resume.pdf"
                variant="resume"
              >
                <ResumeWindow />
              </FileWindow>
            </div>
          </div>
        </div>

        <section className="story-section about-scene snap-anchor" id="about" aria-label="About scene" />
        <section className="story-section projects-scene" aria-label="Projects scene">
          {projects.map((project, index) => (
            <div
              aria-hidden="true"
              className="project-scroll-stop snap-anchor"
              data-project-index={index}
              id={index === 0 ? 'projects' : undefined}
              key={project.id}
            />
          ))}
        </section>
        <section className="story-section education-scene snap-anchor" id="education" aria-label="Education scene" />
        <section className="story-section resume-scene snap-anchor" id="resume" aria-label="Resume scene" />
      </div>

      <footer className="site-footer snap-anchor">
        <a href="https://github.com/23460542" target="_blank" rel="noreferrer">
          <GitBranch size={16} aria-hidden="true" />
          github.com/23460542
        </a>
        <a href="https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html" target="_blank" rel="noreferrer">
          AWS-ready static build
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </footer>
    </main>
  )
}

export default App
