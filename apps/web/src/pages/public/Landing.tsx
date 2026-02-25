import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  Radar,
  Brain,
  Shield,
  Activity,
  Lock,
  Bell,
  Plug,
  ArrowRight,
} from 'lucide-react';
import { GhostnetLogo } from '@/components/shared/GhostnetLogo';

/* ═══════════════════════════════════════════════════════════════════════════
   CSS-only animations — injected via <style> for self-contained landing page
   ═══════════════════════════════════════════════════════════════════════════ */
const LANDING_CSS = `
  html { scroll-behavior: smooth; }

  .landing-grid {
    background-image:
      linear-gradient(rgba(0, 212, 255, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.06) 1px, transparent 1px);
    background-size: 64px 64px;
    animation: gridPulse 8s ease-in-out infinite, gridDrift 30s ease-in-out infinite;
  }

  .landing-grid-fine {
    background-image:
      linear-gradient(rgba(0, 212, 255, 0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.025) 1px, transparent 1px);
    background-size: 16px 16px;
    animation: gridPulse 8s ease-in-out infinite reverse;
  }

  .landing-scanline {
    position: absolute;
    left: 0;
    right: 0;
    height: 300px;
    background: linear-gradient(to bottom, transparent, rgba(0,212,255,0.03), transparent);
    animation: scanLine 8s linear infinite;
    pointer-events: none;
  }

  @keyframes gridPulse {
    0%, 100% { opacity: 0.3; }
    50%      { opacity: 0.8; }
  }

  @keyframes gridDrift {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50%      { transform: scale(1.015) rotate(0.2deg); }
  }

  @keyframes scanLine {
    0%   { top: -300px; }
    100% { top: 100%; }
  }

  /* ── Network visualization (SVG + CSS animations) ── */

  .agent-dot, .agent-glow {
    transform-box: view-box;
  }

  .agent-dot {
    animation:
      agentPath 10s cubic-bezier(0.4, 0, 0.2, 1) infinite,
      agentDotColor 10s ease infinite,
      agentOpacity 10s ease infinite;
  }

  .agent-glow {
    animation:
      agentPath 10s cubic-bezier(0.4, 0, 0.2, 1) infinite,
      agentGlowColor 10s ease infinite,
      agentOpacity 10s ease infinite;
  }

  @keyframes agentPath {
    0%, 3%    { transform: translate(80px, 200px); }
    15%       { transform: translate(200px, 100px); }
    30%       { transform: translate(360px, 200px); }
    44%       { transform: translate(360px, 60px); }
    58%       { transform: translate(520px, 120px); }
    72%       { transform: translate(700px, 200px); }
    92%, 100% { transform: translate(700px, 200px); }
  }

  @keyframes agentDotColor {
    0%, 70%   { fill: #00D4FF; filter: drop-shadow(0 0 6px rgba(0,212,255,0.7)); }
    74%, 90%  { fill: #FF3B5C; filter: drop-shadow(0 0 14px rgba(255,59,92,0.9)); }
    96%, 100% { fill: #00D4FF; filter: drop-shadow(0 0 6px rgba(0,212,255,0.7)); }
  }

  @keyframes agentGlowColor {
    0%, 70%   { fill: rgba(0,212,255,0.12); }
    74%, 90%  { fill: rgba(255,59,92,0.18); }
    96%, 100% { fill: rgba(0,212,255,0.12); }
  }

  @keyframes agentOpacity {
    0%        { opacity: 0; }
    4%        { opacity: 1; }
    88%       { opacity: 1; }
    94%       { opacity: 0; }
    100%      { opacity: 0; }
  }

  .trap-ring {
    transform-box: fill-box;
    transform-origin: center;
    animation: trapPulse 10s ease-out infinite;
  }

  @keyframes trapPulse {
    0%, 70%  { transform: scale(1); opacity: 0; }
    74%      { transform: scale(1); opacity: 0.8; }
    90%      { transform: scale(4); opacity: 0; }
    100%     { transform: scale(1); opacity: 0; }
  }

  .node-ambient {
    animation: nodeAmbient 4s ease-in-out infinite;
  }

  @keyframes nodeAmbient {
    0%, 100% { opacity: 0.15; }
    50%      { opacity: 0.4; }
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   Intersection Observer hook — fires once when element enters viewport
   ═══════════════════════════════════════════════════════════════════════════ */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Navbar — transparent → frosted glass on scroll
   ═══════════════════════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-void/80 backdrop-blur-lg border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <GhostnetLogo size="md" />
        <div className="flex items-center gap-6">
          <Link
            to="/demo"
            className="hidden sm:block text-sm font-body text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Live Demo
          </Link>
          <Link
            to="/login"
            className="hidden sm:block text-sm font-body text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="text-sm font-body font-medium bg-cyan text-void px-5 py-2 rounded-card hover:brightness-110 transition-all duration-150"
          >
            Request Access
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Network Graph — animated SVG visualization
   ═══════════════════════════════════════════════════════════════════════════ */
const NODES = [
  { x: 80, y: 200, label: 'Entry' },
  { x: 200, y: 100, label: 'API' },
  { x: 200, y: 300, label: 'DNS' },
  { x: 360, y: 60, label: 'IAM' },
  { x: 360, y: 200, label: 'Core' },
  { x: 360, y: 340, label: 'Logs' },
  { x: 520, y: 120, label: 'Secrets' },
  { x: 520, y: 280, label: 'S3' },
  { x: 700, y: 200, label: '◉ TRAP' },
] as const;

const EDGES: readonly [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [3, 4],
  [3, 6],
  [4, 5],
  [4, 6],
  [4, 7],
  [5, 7],
  [6, 8],
  [7, 8],
];

function NetworkGraph() {
  return (
    <svg
      viewBox="0 0 780 400"
      className="w-full h-auto"
      role="img"
      aria-label="Animated network showing an AI agent traversing endpoints and getting caught in a honeypot trap"
    >
      <defs>
        <radialGradient id="trap-bg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF3B5C" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FF3B5C" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient trap glow */}
      <circle
        cx={700}
        cy={200}
        r={70}
        fill="url(#trap-bg-glow)"
        className="node-ambient"
      />

      {/* Edges */}
      {EDGES.map(([a, b], i) => {
        const nodeA = NODES[a];
        const nodeB = NODES[b];
        if (!nodeA || !nodeB) return null;
        return (
        <line
          key={i}
          x1={nodeA.x}
          y1={nodeA.y}
          x2={nodeB.x}
          y2={nodeB.y}
          stroke="#1E2733"
          strokeWidth="1"
        />
        );
      })}

      {/* Nodes */}
      {NODES.map((node, i) => {
        const isTrap = i === 8;
        return (
          <g key={i}>
            <circle
              cx={node.x}
              cy={node.y}
              r={isTrap ? 7 : 4}
              fill={isTrap ? 'rgba(255,59,92,0.25)' : 'rgba(0,212,255,0.12)'}
              stroke={isTrap ? '#FF3B5C' : 'rgba(0,212,255,0.35)'}
              strokeWidth={isTrap ? 1.5 : 0.75}
            />
            <text
              x={node.x}
              y={node.y + ([0, 4, 8].includes(i) ? 22 : -14)}
              textAnchor="middle"
              fill="#4A5568"
              fontSize="9"
              fontFamily="Inter, sans-serif"
              letterSpacing="0.5"
            >
              {node.label}
            </text>
          </g>
        );
      })}

      {/* Trap alert ring — expands when agent is caught */}
      <circle
        cx={700}
        cy={200}
        r={7}
        fill="none"
        stroke="#FF3B5C"
        strokeWidth="1.5"
        className="trap-ring"
      />

      {/* Agent glow halo */}
      <circle r="16" className="agent-glow" />

      {/* Agent dot */}
      <circle r="5" className="agent-dot" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero Section
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Animated grid layers */}
      <div className="landing-grid absolute inset-0" />
      <div className="landing-grid-fine absolute inset-0" />
      <div className="landing-scanline" />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#080B12_70%)]" />

      {/* Content */}
      <div className="relative z-20 max-w-4xl mx-auto text-center px-6 pt-24 md:pt-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface/50 backdrop-blur-sm mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-live-pulse" />
          <span className="text-xs font-body font-medium text-text-secondary tracking-wide">
            Enterprise Agentic Deception Platform
          </span>
        </div>

        <h1 className="font-heading font-semibold text-4xl sm:text-5xl md:text-[3.5rem] leading-[1.1] text-text-primary mb-6">
          Your attackers are using AI.
          <br />
          <span className="text-cyan">So is your defense.</span>
        </h1>

        <p className="font-body text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          GHOSTNET creates deceptive enterprise environments that trap, track,
          and analyze AI-powered attack agents — before they reach your real
          infrastructure.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 md:mb-20">
          <Link
            to="/demo"
            className="w-full sm:w-auto font-body font-medium bg-cyan text-void px-8 py-3.5 rounded-card text-base hover:brightness-110 transition-all duration-150 hover:shadow-glow-cyan"
          >
            Try Live Demo
          </Link>
          <Link
            to="/signup"
            className="w-full sm:w-auto font-body font-medium border border-cyan/50 text-cyan px-8 py-3.5 rounded-card text-base hover:bg-cyan/10 transition-all duration-150"
          >
            Request Access
          </Link>
        </div>
      </div>

      {/* Network visualization */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 pb-20 md:pb-28">
        <NetworkGraph />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Trusted By
   ═══════════════════════════════════════════════════════════════════════════ */
function TrustedBy() {
  return (
    <Reveal className="border-y border-border bg-surface/30 py-12">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-xs font-body font-medium text-text-muted uppercase tracking-[0.2em] mb-8">
          Trusted by security teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {[88, 104, 72, 96, 112, 80].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded bg-elevated/50 border border-border"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   How It Works
   ═══════════════════════════════════════════════════════════════════════════ */
const STEPS = [
  {
    num: '01',
    Icon: Server,
    title: 'Deploy',
    desc: 'Deploy fake enterprise services into your network perimeter. AWS IAM, Secrets Manager, S3, internal APIs — all running real protocols.',
  },
  {
    num: '02',
    Icon: Radar,
    title: 'Detect',
    desc: "Attacker agents discover and probe your deception environment, believing it's your real infrastructure.",
  },
  {
    num: '03',
    Icon: Brain,
    title: 'Decode',
    desc: 'GHOSTNET tracks every move and reveals what they believe is real — in real time.',
  },
];

function HowItWorks() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal className="text-center mb-16 md:mb-20">
          <p className="text-xs font-body font-medium text-cyan uppercase tracking-[0.2em] mb-3">
            How It Works
          </p>
          <h2 className="font-heading font-semibold text-3xl md:text-4xl text-text-primary">
            Three steps to agentic deception
          </h2>
        </Reveal>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6">
          {/* Connecting dashed line between icons (desktop only) */}
          <div className="hidden md:block absolute top-20 left-[20%] right-[20%] border-t border-dashed border-border" />

          {STEPS.map((step, i) => (
            <Reveal
              key={step.num}
              delay={i * 150}
              className="relative text-center"
            >
              <span className="block font-heading font-semibold text-5xl md:text-6xl text-cyan/15 mb-3 select-none">
                {step.num}
              </span>
              <div className="flex items-center justify-center mb-5">
                <div className="relative z-10 h-14 w-14 rounded-card bg-cyan/10 border border-cyan/20 flex items-center justify-center">
                  <step.Icon className="h-6 w-6 text-cyan" />
                </div>
              </div>
              <h3 className="font-heading font-semibold text-xl text-text-primary mb-3">
                {step.title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-text-secondary max-w-[280px] mx-auto">
                {step.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Features Grid
   ═══════════════════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    Icon: Brain,
    title: 'Agent Belief Mapping',
    desc: 'Real-time inference of what an attacker agent believes is true about your environment.',
  },
  {
    Icon: Shield,
    title: 'Real Protocol Fidelity',
    desc: 'Authentic AWS IAM, S3, Secrets Manager responses that fool even sophisticated AI agents.',
  },
  {
    Icon: Activity,
    title: 'Behavioral Session Analysis',
    desc: 'Automatic session stitching, behavioral tagging, and risk scoring.',
  },
  {
    Icon: Lock,
    title: 'Zero-Trust Architecture',
    desc: 'Every interaction is logged. Every credential is fake. Nothing connects to real infrastructure.',
  },
  {
    Icon: Bell,
    title: 'Real-Time Alerting',
    desc: 'Instant notifications when agents reach critical depth or attempt data exfiltration.',
  },
  {
    Icon: Plug,
    title: 'Enterprise Integrations',
    desc: 'Slack, webhooks, Splunk, Microsoft Sentinel — alert where your team already works.',
  },
];

function FeaturesGrid() {
  return (
    <section className="py-24 md:py-32 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal className="text-center mb-16">
          <p className="text-xs font-body font-medium text-cyan uppercase tracking-[0.2em] mb-3">
            Capabilities
          </p>
          <h2 className="font-heading font-semibold text-3xl md:text-4xl text-text-primary">
            Purpose-built for the agentic threat landscape
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => (
            <Reveal key={feat.title} delay={i * 80}>
              <div className="group h-full bg-surface border border-border rounded-card p-6 hover:border-cyan/25 hover:shadow-glow-cyan transition-all duration-300">
                <div className="h-10 w-10 rounded-card bg-cyan/10 border border-cyan/20 flex items-center justify-center mb-4 group-hover:bg-cyan/[0.15] transition-colors duration-300">
                  <feat.Icon className="h-[18px] w-[18px] text-cyan" />
                </div>
                <h3 className="font-heading font-semibold text-[15px] text-text-primary mb-2">
                  {feat.title}
                </h3>
                <p className="font-body text-sm leading-relaxed text-text-secondary">
                  {feat.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Demo CTA
   ═══════════════════════════════════════════════════════════════════════════ */
function DemoCTA() {
  return (
    <section className="py-24 md:py-32">
      <Reveal className="max-w-4xl mx-auto px-6">
        <div className="relative bg-elevated border border-border rounded-card overflow-hidden">
          {/* Decorative grid */}
          <div className="landing-grid absolute inset-0 opacity-20 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#161B24_80%)] pointer-events-none" />

          <div className="relative z-10 py-12 px-8 md:py-16 md:px-16 text-center">
            <h2 className="font-heading font-semibold text-2xl md:text-3xl text-text-primary mb-4">
              See a live attack session right now
            </h2>
            <p className="font-body text-base md:text-lg text-text-secondary max-w-xl mx-auto mb-8 leading-relaxed">
              Watch an AI agent probe a fake enterprise environment. See belief
              mapping, behavioral analysis, and IOCs — no signup required.
            </p>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 font-body font-medium bg-cyan text-void px-8 py-3.5 rounded-card text-base hover:brightness-110 transition-all duration-150 hover:shadow-glow-cyan"
            >
              Explore the Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════════════════════════════════ */
const FOOTER_LINKS = [
  'Privacy Policy',
  'Terms of Service',
  'Contact',
  'GitHub',
];

function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
          <div>
            <GhostnetLogo size="md" />
            <p className="font-body text-sm text-text-muted mt-2">
              Enterprise Agentic Deception Platform
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-6" aria-label="Footer">
            {FOOTER_LINKS.map((label) => (
              <a
                key={label}
                href="#"
                className="font-body text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="border-t border-border pt-6">
          <p className="font-body text-xs text-text-muted">
            © 2026 GHOSTNET. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Landing Page — assembled
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  return (
    <div className="bg-void min-h-screen">
      <style>{LANDING_CSS}</style>
      <Navbar />
      <HeroSection />
      <TrustedBy />
      <HowItWorks />
      <FeaturesGrid />
      <DemoCTA />
      <LandingFooter />
    </div>
  );
}
