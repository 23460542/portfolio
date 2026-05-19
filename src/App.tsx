import { ExternalLink, FileText, GitBranch, Maximize2, Minus, Move, Plus, RotateCcw } from 'lucide-react'
import { type CSSProperties, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
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

const terminalTranscript: TerminalLine[] = [
  { text: '$ boot portfolio --ascii', tone: 'command' },
  { text: 'ok   renderer: vertical mesh strands / reduced cursor gain / ambient wave online', tone: 'output' },
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
    period: '2026 -> TBD',
    title: 'Education entry placeholder',
    detail: 'Add university, certification, cohort, or self-directed study details here.',
  },
  {
    period: '2025 -> TBD',
    title: 'Systems, data, and markets',
    detail: 'A future note for coursework, independent research, or project-based learning.',
  },
  {
    period: '2024 -> TBD',
    title: 'Machine learning and cloud foundations',
    detail: 'A compact slot for AWS, AI, analytics, or engineering credentials.',
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

function AsciiRail() {
  return (
    <div className="ascii-rail" aria-hidden="true">
      <span className="slash-run">////////////////////////////////////////////////</span>
      <BinaryTicker />
      <span className="slash-run">////////////////////////////////////////////////</span>
    </div>
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

function WaveMeshHero() {
  const containerRef = useRef<HTMLDivElement | null>(null)

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

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, -0.12, 4.55)
    camera.lookAt(0, 0, 0)

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uHover: { value: 0.08 },
    }

    const geometry = createVerticalWaveGeometry(16.8, 7.4, 86, 38)
    const material = new THREE.ShaderMaterial({
      fragmentShader: `
        varying float vElevation;

        void main() {
          float pulse = clamp(vElevation * 1.4 + 0.55, 0.0, 1.0);
          vec3 deep = vec3(0.25, 0.95, 0.48);
          vec3 hot = vec3(0.9, 1.0, 0.72);
          vec3 color = mix(deep, hot, pulse);
          gl_FragColor = vec4(color, 0.82);
        }
      `,
      transparent: true,
      uniforms,
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uHover;
        varying float vElevation;

        void main() {
          vec3 pos = position;
          vec2 normalized = vec2(position.x / 8.4, position.y / 3.7);
          float baseWave = sin(position.x * 1.18 + uTime * 0.34) * 0.13;
          baseWave += sin(position.y * 2.0 - uTime * 0.42) * 0.055;
          baseWave += sin((position.x + position.y) * 0.9 + uTime * 0.29) * 0.07;

          float dist = distance(normalized, uMouse);
          float cursorRipple = sin(dist * 16.0 - uTime * 1.2) * exp(-dist * 4.2) * 0.18 * uHover;
          vec2 push = normalize(normalized - uMouse + 0.0001) * exp(-dist * 5.0) * 0.035 * uHover;

          pos.xy += push;
          pos.z = baseWave + cursorRipple;
          vElevation = pos.z;

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
    let targetHover = 0.08
    const targetMouse = new THREE.Vector2(0, 0)
    const clock = new THREE.Clock()

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
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)

      targetMouse.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1))
      targetHover = 0.42
    }

    function onPointerLeave() {
      targetMouse.set(0, 0)
      targetHover = 0.08
    }

    function animate() {
      uniforms.uTime.value = clock.getElapsedTime()
      uniforms.uMouse.value.lerp(targetMouse, 0.045)
      uniforms.uHover.value = THREE.MathUtils.lerp(uniforms.uHover.value, targetHover, 0.045)
      waveLines.rotation.z = Math.sin(uniforms.uTime.value * 0.11) * 0.014 - 0.045
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerleave', onPointerLeave)
    resize()
    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
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
  return (
    <main className="site-shell">
      <section className="hero" id="top">
        <header className="hero-grid-header">
          <a href="#top" className="hero-logo" aria-label="Back to top">
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
            <a href={linkedInUrl} target="_blank" rel="noreferrer">
              <span className="hero-underline">LINKEDIN</span>
            </a>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <span className="hero-underline">GITHUB</span>
            </a>
          </div>

          <a className="resume-jump" href="#resume">
            <span className="hero-underline">↓ I'm just here for the resume ↓</span>
          </a>
        </header>

        <div className="hero-wave-panel">
          <WaveMeshHero />
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
