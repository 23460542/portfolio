import { ExternalLink, FileText, GitBranch, Maximize2, Minus, Move, Plus, RotateCcw } from 'lucide-react'
import { type CSSProperties, type PointerEvent, useMemo, useState } from 'react'
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

const binaryRows = [
  '10000111 01110110 01001101 11101001 00111100 10110111 01001001 1010',
  '01101001 11011010 00101111 10110100 01110001 01001111 11100110 0011',
  '11100010 01010111 10110010 00011101 01110101 10010010 01101101 1100',
]

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

function BinaryBand() {
  return (
    <div className="binary-band" aria-hidden="true">
      {binaryRows.map((row) => (
        <span key={row}>{row}</span>
      ))}
    </div>
  )
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
      <nav className="site-nav" aria-label="Primary navigation">
        <a href="#top" className="brand-mark">
          JT://PORTFOLIO
        </a>
        <div>
          <a href="#about">about</a>
          <a href="#projects">projects</a>
          <a href="#education">education</a>
          <a href="#resume">resume</a>
        </div>
      </nav>

      <section className="hero" id="top">
        <BinaryBand />
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">coding from australia / market systems / data tools</p>
            <h1>James builds compact dashboards for noisy market data.</h1>
            <p>
              A small green terminal garden for polym, AITrade, and the next set of decision tools.
              Fake signals today. Real feeds soon.
            </p>
          </div>

          <aside className="hero-terminal" aria-label="System status">
            <div className="terminal-top">
              <span>portfolio.boot</span>
              <span>v0.1</span>
            </div>
            <pre>{`> load /projects
OK 3 dashboard panels
> attach resume.pdf
PENDING placeholder
> deploy target
GITHUB_PAGES /portfolio/
> aws future
AMPLIFY or S3 + CLOUDFRONT`}</pre>
          </aside>
        </div>
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
