import {
  ExternalLink,
  FileText,
  GitBranch,
  Maximize2,
  Minus,
  Move,
  Plus,
  RotateCcw,
} from 'lucide-react'
import {
  type CSSProperties,
  type PointerEvent,
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
}

type EducationItem = {
  period: string
  title: string
  detail: string
}

type TerminalLine = {
  text: string
  tone: 'command' | 'output'
}

type IntroPhase = 'loading' | 'revealing' | 'settling' | 'ready'

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
  },
]

const education: EducationItem[] = [
  {
    period: '2015 -> 2021',
    title: 'Aquinas College',
    detail: 'I was deeply involved in the performing arts, no school day was complete without a couple of hours of rehearsal.',
  },
  {
    period: '2022 -> 2022',
    title: 'WAAPA',
    detail: 'Honing my musical talents, I had to learn how to work well in a team.',
  },
  {
    period: '2023 -> 2027',
    title: 'University of Western Australia',
    detail: 'Majoring in Data Science and Cybersecurity with a minor in German, UWA has kept me busy in all aspects of life.',
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
  targetRef,
}: {
  onFinished: () => void
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
    }, prefersReducedMotion ? 140 : 980)
    const finishTimer = window.setTimeout(onFinished, prefersReducedMotion ? 460 : 1900)

    return () => {
      window.clearTimeout(flyTimer)
      window.clearTimeout(finishTimer)
    }
  }, [onFinished, updateTarget])

  return (
    <div className={`loading-screen ${isFlying ? 'is-flying' : ''}`} aria-label="Loading portfolio">
      <div className="loading-screen-inner">
        <div className="loading-logo-flight" ref={logoRef} aria-hidden="true">
          <div className="loading-logo">JT</div>
        </div>
        <div className="loading-pulse" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  )
}

function AsciiRail() {
  return (
    <div className="ascii-rail" aria-hidden="true">
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
          float catchInfluence = exp(-dist * 4.6) * uHover;
          float tugStrength = clamp(length(uCursorTug) * 2.7, 0.0, 1.0);
          vec2 tugDirection = uCursorTug / max(length(uCursorTug), 0.001);
          float trailingSide = 1.0 - smoothstep(-0.46, 0.34, dot(cursorDelta, tugDirection));
          float followInfluence = catchInfluence * mix(0.72, 1.18, trailingSide);
          float forwardPull = catchInfluence * (0.12 + tugStrength * 0.16);
          float trailingLift = followInfluence * tugStrength * 0.08;

          pos.xy += uCursorTug * followInfluence * 0.22;
          pos.z = baseWave + forwardPull + trailingLift;
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
    let previousTimestamp = performance.now()
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

      targetMouse.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1))
      targetHover = 1
    }

    function onPointerLeave() {
      targetHover = 0
    }

    function onWindowPointerMove(event: globalThis.PointerEvent) {
      const rect = host.getBoundingClientRect()
      const isInsideHost =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (!isInsideHost) {
        targetHover = 0
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
      tugTarget
        .subVectors(targetMouse, uniforms.uMouse.value)
        .multiplyScalar(uniforms.uHover.value)
        .clampLength(0, 0.42)
      uniforms.uCursorTug.value.x = THREE.MathUtils.damp(uniforms.uCursorTug.value.x, tugTarget.x, 9.8, deltaTime)
      uniforms.uCursorTug.value.y = THREE.MathUtils.damp(uniforms.uCursorTug.value.y, tugTarget.y, 9.8, deltaTime)

      const cursorX = ((uniforms.uMouse.value.x + 1) / 2) * host.clientWidth
      const cursorY = ((1 - uniforms.uMouse.value.y) / 2) * host.clientHeight
      cursorDot.style.transform = `translate3d(${cursorX.toFixed(2)}px, ${cursorY.toFixed(2)}px, 0) translate(-50%, -50%)`
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

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-header">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  )
}

function ProjectCard({ project }: { project: ProjectPanel }) {
  const { position, dragging, dragProps } = useDraggable(project.position)
  const points = useMemo(() => makeSparkline(project.chart), [project.chart])

  return (
    <article
      className={`project-card ${dragging ? 'is-dragging' : ''}`}
      style={
        {
          '--panel-x': `${position.x}px`,
          '--panel-y': `${position.y}px`,
          '--accent': project.accent,
        } as CSSProperties
      }
    >
      <header className="project-handle" {...dragProps}>
        <span className="handle-title">
          <Move size={14} aria-hidden="true" />
          {project.title}
        </span>
        <span>{project.tag}</span>
      </header>

      <p className="project-summary">{project.summary}</p>

      <div className="metric-grid">
        {project.metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <em>{metric.delta}</em>
          </div>
        ))}
      </div>

      <div className="chart-panel" aria-label={`${project.title} mock trend chart`}>
        <svg viewBox="0 0 220 74" role="img">
          <polyline points={points} />
        </svg>
      </div>

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
  )
}

function ProjectsBoard() {
  return (
    <div className="projects-board">
      <div className="board-grid" aria-hidden="true" />
      {projects.map((project) => (
        <ProjectCard project={project} key={project.id} />
      ))}
    </div>
  )
}

function ResumeViewer() {
  const initialPosition = { x: 72, y: 54 }
  const [zoom, setZoom] = useState(0.92)
  const { position, setPosition, dragging, dragProps } = useDraggable(initialPosition)

  function changeZoom(amount: number) {
    setZoom((current) => Math.min(1.38, Math.max(0.72, Number((current + amount).toFixed(2)))))
  }

  function resetViewer() {
    setPosition(initialPosition)
    setZoom(0.92)
  }

  return (
    <div className="resume-stage">
      <div className="palm palm-left" aria-hidden="true" />
      <div className="palm palm-right" aria-hidden="true" />

      <div className="viewer-toolbar" aria-label="Resume viewer controls">
        <button type="button" onClick={() => changeZoom(-0.08)} aria-label="Zoom out">
          <Minus size={16} />
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => changeZoom(0.08)} aria-label="Zoom in">
          <Plus size={16} />
        </button>
        <button type="button" onClick={resetViewer} aria-label="Reset resume viewer">
          <RotateCcw size={16} />
        </button>
      </div>

      <section
        className={`resume-window ${dragging ? 'is-dragging' : ''}`}
        style={
          {
            '--resume-x': `${position.x}px`,
            '--resume-y': `${position.y}px`,
            '--resume-zoom': zoom,
          } as CSSProperties
        }
        aria-label="Placeholder resume viewer"
      >
        <header className="resume-handle" {...dragProps}>
          <span>
            <FileText size={15} aria-hidden="true" />
            resume.pdf
          </span>
          <span>
            <Maximize2 size={14} aria-hidden="true" />
            drag / zoom
          </span>
        </header>

        <div className="resume-document">
          {resumeLines.map((line, index) =>
            line ? (
              <p key={`${line}-${index}`}>{line}</p>
            ) : (
              <div className="resume-gap" key={`gap-${index}`} aria-hidden="true" />
            ),
          )}
        </div>
      </section>
    </div>
  )
}

function App() {
  const shellRef = useRef<HTMLElement | null>(null)
  const logoHomeRef = useRef<HTMLAnchorElement | null>(null)
  const wavePanelRef = useRef<HTMLDivElement | null>(null)
  const [introPhase, setIntroPhase] = useState<IntroPhase>('loading')

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

  const finishLoading = useCallback(() => {
    updateWaveRiseDistance()
    setIntroPhase('revealing')
  }, [updateWaveRiseDistance])

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

  return (
    <main className={`site-shell is-${introPhase}`} ref={shellRef}>
      {introPhase === 'loading' ? <LoadingScreen onFinished={finishLoading} targetRef={logoHomeRef} /> : null}

      <section className="hero" id="top">
        <header className="hero-grid-header">
          <a href="#top" className="hero-logo" aria-label="Back to top" ref={logoHomeRef}>
            <span className="hero-underline">JT</span>
          </a>

          <div className="hero-status">
            <span className="hero-underline">PORTFOLIO://JAMES_T</span>
            <span className="hero-underline">PERTH / AU</span>
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
            <span className="hero-underline resume-jump-label resume-jump-label-compact">v Resume v</span>
          </a>
        </header>

        <div className="hero-wave-panel" ref={wavePanelRef}>
          <WaveMeshHero introPhase={introPhase} />
        </div>

        <AsciiRail />
        <HeroIdentityBand />
        <AsciiRail />
      </section>

      <section className="about-section" id="about">
        <SectionHeader eyebrow="00_about" title="Signal, risk, interface." />
        <div className="about-copy">
          <p>
            I work on analytics-heavy systems where the interface has to stay calm while the data gets
            loud: trading controls, wallet analysis, market feeds, and audit-friendly automation.
          </p>
          <p>
            The site keeps that same shape: compact, terminal-adjacent, graph-forward, and intentionally
            editable as the underlying projects mature.
          </p>
        </div>
      </section>

      <section className="projects-section" id="projects">
        <SectionHeader eyebrow="01_projects" title="Click, drag, inspect." />
        <ProjectsBoard />
      </section>

      <section className="education-section" id="education">
        <SectionHeader eyebrow="02_education" title="Education queue." />
        <div className="education-list">
          {education.map((item) => (
            <article className="education-item" key={`${item.period}-${item.title}`}>
              <span>{item.period}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="resume-section" id="resume">
        <SectionHeader eyebrow="03_resume" title="Viewer panel." />
        <ResumeViewer />
      </section>

      <footer className="site-footer">
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
