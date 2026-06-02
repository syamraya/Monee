"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatItem {
  value: string;
  label: string;
}

interface WhaleRow {
  name: string;
  time: string;
  amount: string;
}

interface FeatureCard {
  icon: string;
  title: string;
  desc: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS: StatItem[] = [
  { value: "2.4M+", label: "Users" },
  { value: "$18B+", label: "Volume" },
  { value: "99.9%", label: "Uptime" },
];

const WHALES: WhaleRow[] = [
  { name: "BlackRock", time: "03:46 PM", amount: "+300 BTC" },
  { name: "U.S. Government", time: "03:46 PM", amount: "+18.458 BTC" },
  { name: "Unknown Wallet", time: "03:46 PM", amount: "+6.99 CBBTC" },
];

const FEATURES: FeatureCard[] = [
  {
    icon: "📡",
    title: "Real-Time Market",
    desc: "Monitor crypto, gold, forex, and stocks with live market updates and streaming data.",
  },
  {
    icon: "🤖",
    title: "AI Analytics",
    desc: "Get AI-powered insights and smart money tracking instantly with precision forecasting.",
  },
  {
    icon: "📊",
    title: "Portfolio Tracking",
    desc: "Track all your investments and performance in one unified, elegant dashboard.",
  },
];

const LOGOS = [
  {
    name: "Apple",
    src: "https://cdn.simpleicons.org/apple/ffffff",
  },
  {
    name: "Binance",
    src: "https://cdn.simpleicons.org/binance/F3BA2F",
  },
  {
    name: "Coinbase",
    src: "https://cdn.simpleicons.org/coinbase/0052FF",
  },
  {
    name: "TradingView",
    src: "https://cdn.simpleicons.org/tradingview/2962FF",
  },
  {
    name: "Dior",
    src: "https://cdn.simpleicons.org/dior/FFFFFF",
  },
  {
    name: "Republic of Gamers",
    src: "https://cdn.simpleicons.org/republicofgamers/FF0029",
  },
  {
    name: "Adidas",
    src: "https://cdn.simpleicons.org/adidas/FFFFFF",
  },
  {
    name: "Nike",
    src: "https://cdn.simpleicons.org/nike/FFFFFF",
  },
  {
    name: "Porsche",
    src: "https://cdn.simpleicons.org/porsche/ffffff",
  },
  {
    name: "MicroStrategy",
    src: "https://cdn.simpleicons.org/microstrategy/D9232E",
  },
  {
    name: "Nvidia",
    src: "https://cdn.simpleicons.org/nvidia/76B900",
  },
  {
    name: "Meta",
    src: "https://cdn.simpleicons.org/meta/0467DF",
  },
  {
    name: "Tesla",
    src: "https://cdn.simpleicons.org/tesla/FFFFFF",
  },
  
];

const CHECKLIST = [
  "Real-time whale tracking",
  "Market sentiment indicators",
  "Advanced portfolio analytics",
  "Multi-asset monitoring",
];

export default function FinTrackPage() {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(100), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;700&display=swap');

      *{
        margin:0;
        padding:0;
        box-sizing:border-box;
      }

      :root{
        --green:#4ade80;
        --green2:#22c55e;
        --bg:#050816;
        --card:#0c1220;
        --card2:#12192b;
        --text:#f8fafc;
        --muted:#94a3b8;
      }

      html{
        scroll-behavior:smooth;
      }

      body{
        background:var(--bg);
        color:var(--text);
        font-family:'Inter',sans-serif;
        overflow-x:hidden;
        -webkit-font-smoothing:antialiased;
      }

      h1,h2,h3,h4{
        font-family:'Space Grotesk',sans-serif;
        letter-spacing:-0.04em;
      }

      /* ─── NAVBAR ───────────────────── */
      .nav{
        position:fixed;
        top:0;
        width:100%;
        z-index:999;
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:20px 50px;
        backdrop-filter:blur(18px);
        background:rgba(5,8,22,.55);
        border-bottom:1px solid rgba(255,255,255,.06);
      }

      .logo{
        display:flex;
        align-items:center;
        gap:12px;
        font-weight:700;
        font-size:1.1rem;
      }

      .logo-dot{
        width:38px;
        height:38px;
        border-radius:12px;
        background:linear-gradient(135deg,var(--green),var(--green2));
        display:flex;
        align-items:center;
        justify-content:center;
        color:#03110a;
        font-weight:800;
      }

      .nav-links{
        display:flex;
        gap:35px;
      }

      .nav-links a{
        color:var(--muted);
        text-decoration:none;
        font-size:.95rem;
        transition:.3s;
      }

      .nav-links a:hover{
        color:var(--green);
      }

      .btn{
        border:none;
        padding:12px 22px;
        border-radius:12px;
        background:linear-gradient(135deg,var(--green),var(--green2));
        color:#04130a;
        font-weight:700;
        cursor:pointer;
        transition:.3s;
        box-shadow:0 10px 30px rgba(74,222,128,.25);
      }

      .btn:hover{
        transform:translateY(-2px);
      }

      /* ─── HERO ───────────────────── */
      .hero{
        min-height:100vh;
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:60px;
        align-items:center;
        padding:140px 60px 80px;
        position:relative;
        overflow:hidden;
        isolation:isolate;
      }

      /* ─── Aurora ───────────────────── */
      .aurora{
        position:absolute;
        border-radius:999px;
        filter:blur(100px);
        opacity:.22;
        mix-blend-mode:screen;
        animation:auroraMove 18s ease-in-out infinite alternate;
        pointer-events:none;
      }

      .aurora-1{
        width:420px;
        height:420px;
        background:#4ade80;
        top:-120px;
        left:-100px;
      }

      .aurora-2{
        width:380px;
        height:380px;
        background:#22c55e;
        bottom:-100px;
        right:-60px;
        animation-delay:4s;
      }

      .aurora-3{
        width:300px;
        height:300px;
        background:#16a34a;
        top:40%;
        left:45%;
        animation-delay:8s;
      }

      @keyframes auroraMove{
        0%{
          transform:translate(0,0) scale(1);
        }
        25%{
          transform:translate(40px,-30px) scale(1.1);
        }
        50%{
          transform:translate(-30px,20px) scale(.95);
        }
        75%{
          transform:translate(20px,40px) scale(1.08);
        }
        100%{
          transform:translate(-40px,-20px) scale(1);
        }
      }

      .hero::after{
        content:'';
        position:absolute;
        inset:0;
        background-image:
        radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
        background-size:4px 4px;
        opacity:.1;
      }

      .badge{
        display:inline-flex;
        align-items:center;
        gap:10px;
        padding:7px 16px;
        border-radius:999px;
        background:rgba(74,222,128,.08);
        border:1px solid rgba(74,222,128,.15);
        color:var(--green);
        margin-bottom:26px;
      }

      .pulse{
        width:8px;
        height:8px;
        border-radius:50%;
        background:var(--green);
        animation:pulse 2s infinite;
      }

      @keyframes pulse{
        0%,100%{
          transform:scale(1);
          opacity:1;
        }
        50%{
          transform:scale(1.5);
          opacity:.5;
        }
      }

      .hero h1{
        font-size:clamp(4rem,6vw,6rem);
        line-height:1;
        margin-bottom:24px;
        font-weight:700;
      }

      .hero h1 em{
        color:var(--green);
        font-style:normal;
      }

      .hero-sub{
        max-width:540px;
        color:var(--muted);
        line-height:1.9;
        font-size:1.08rem;
        margin-bottom:34px;
      }

      .hero-actions{
        display:flex;
        gap:16px;
        margin-bottom:44px;
      }

      .btn-outline{
        background:transparent;
        border:1px solid rgba(255,255,255,.08);
        color:var(--text);
      }

      .btn-outline:hover{
        border-color:var(--green);
        color:var(--green);
      }

      .stats{
        display:flex;
        gap:40px;
      }

      .stat h3{
        font-size:2rem;
        margin-bottom:4px;
      }

      .stat p{
        color:var(--muted);
      }

      /* ─── CARD ───────────────────── */
      .card{
        background:rgba(12,18,32,.72);
        backdrop-filter:blur(18px);
        border:1px solid rgba(74,222,128,.12);
        border-radius:28px;
        padding:28px;
        box-shadow:
          0 20px 60px rgba(0,0,0,.5),
          inset 0 1px 0 rgba(255,255,255,.04);
        animation:float 7s ease-in-out infinite;
      }

      @keyframes float{
        0%,100%{
          transform:translateY(0);
        }
        50%{
          transform:translateY(-8px);
        }
      }

      .card-title{
        color:var(--muted);
        margin-bottom:10px;
      }

      .card-value{
        font-size:2.2rem;
        font-weight:700;
        color:var(--green);
      }

      .chart{
        width:100%;
        height:120px;
        margin:25px 0;
        border-radius:18px;
        background:
          linear-gradient(
            180deg,
            rgba(74,222,128,.18),
            transparent
          );
        position:relative;
        overflow:hidden;
      }

      .chart::before{
        content:'';
        position:absolute;
        width:120%;
        height:3px;
        background:linear-gradient(
          90deg,
          transparent,
          var(--green),
          transparent
        );
        top:50%;
        left:-10%;
        animation:lineMove 4s linear infinite;
      }

      @keyframes lineMove{
        from{
          transform:translateX(-100%);
        }
        to{
          transform:translateX(100%);
        }
      }

      .asset-grid{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:14px;
        margin-bottom:22px;
      }

      .asset{
        background:rgba(255,255,255,.03);
        border:1px solid rgba(255,255,255,.05);
        padding:16px;
        border-radius:18px;
      }

      .asset small{
        color:var(--muted);
      }

      .asset h4{
        margin:8px 0;
      }

      .green{
        color:var(--green);
      }

      .whale{
        display:flex;
        justify-content:space-between;
        padding:14px 0;
        border-bottom:1px solid rgba(255,255,255,.05);
      }

      /* ─── TRUSTED ───────────────────── */
      .trusted{
        padding:60px;
        text-align:center;
      }

      .trusted p{
        color:var(--muted);
        margin-bottom:30px;
      }

      .logos{
  display:flex;
  justify-content:center;
  align-items:center;
  flex-wrap:wrap;
  gap:50px;
}

.logo-item{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:12px;
}

.logo-company{
  width:60px;
  height:60px;
  object-fit:contain;
  opacity:.75;
  transition:all .3s ease;
}

.logo-company:hover{
  opacity:1;
  transform:translateY(-4px) scale(1.08);
}

.logo-item span{
  color:rgba(255,255,255,.55);
  font-size:.9rem;
  font-weight:600;
}

      /* ─── FEATURES ───────────────────── */
      .section{
        padding:120px 60px;
      }

      .section-tag{
        color:var(--green);
        text-transform:uppercase;
        letter-spacing:.15em;
        margin-bottom:16px;
      }

      .section-title{
        font-size:3rem;
        max-width:700px;
        margin-bottom:20px;
      }

      .section-desc{
        max-width:600px;
        color:var(--muted);
        line-height:1.9;
        margin-bottom:60px;
      }

      .feature-grid{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:22px;
      }

      .feature{
        background:rgba(255,255,255,.03);
        border:1px solid rgba(255,255,255,.05);
        border-radius:24px;
        padding:30px;
        transition:.4s;
      }

      .feature:hover{
        transform:translateY(-8px);
        border-color:rgba(74,222,128,.25);
        box-shadow:0 20px 60px rgba(74,222,128,.08);
      }

      .feature-icon{
        width:58px;
        height:58px;
        border-radius:18px;
        background:rgba(74,222,128,.08);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:1.5rem;
        margin-bottom:22px;
      }

      .feature p{
        color:var(--muted);
        line-height:1.8;
        margin-top:12px;
      }

      /* ─── ANALYTICS ───────────────────── */
      .analytics{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:60px;
        align-items:center;
      }

      .check{
        margin-top:30px;
        display:flex;
        flex-direction:column;
        gap:14px;
      }

      .check div{
        display:flex;
        align-items:center;
        gap:12px;
      }

      .check span{
        width:22px;
        height:22px;
        border-radius:50%;
        background:rgba(74,222,128,.12);
        color:var(--green);
        display:flex;
        align-items:center;
        justify-content:center;
      }

      .sentiment{
        background:rgba(255,255,255,.03);
        border:1px solid rgba(255,255,255,.05);
        padding:34px;
        border-radius:28px;
      }

      .meter{
        margin-top:24px;
      }

      .track{
        height:8px;
        background:#1e293b;
        border-radius:999px;
        overflow:hidden;
      }

      .fill{
        height:100%;
        background:linear-gradient(90deg,var(--green),#22c55e);
        transition:1.5s;
      }

      /* ─── RESPONSIVE ───────────────────── */
      @media(max-width:960px){

        .hero,
        .analytics{
          grid-template-columns:1fr;
        }

        .feature-grid{
          grid-template-columns:1fr;
        }

        .nav-links{
          display:none;
        }

        .hero,
        .section,
        .trusted{
          padding-left:24px;
          padding-right:24px;
        }

        .hero h1{
          font-size:3.5rem;
        }
      }
      `}</style>

      {/* ─── NAVBAR ───────────────────── */}
      <nav className="nav">
        <div className="logo">
          <div className="logo-dot">M</div>
          Monee
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#trusted">Partners</a>
          <a href="#analytics">Analytics</a>
        </div>



        <button className="btn" onClick={() => window.location.href = '/sign-up'}>
          Get Started
        </button>
      </nav>



      {/* ─── HERO ───────────────────── */}
      <section className="hero">
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>

        <div>
          <div className="badge">
            <span className="pulse"></span>
            Only For Smart Money
          </div>

          <h1>
            Track wealth
            <br />
            <em>with clarity.</em>
          </h1>

          <p className="hero-sub">
            Monitor your portfolio, analyze market trends, and manage
            digital assets from one modern dashboard with AI-powered
            financial intelligence.
          </p>



          <div className="stats">
            {STATS.map((s) => (
              <div className="stat" key={s.label}>
                <h3>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CARD */}
        <div className="card">
          <p className="card-title">Global Inflow</p>

          <h2 className="card-value">$137,699,060,476</h2>

          <div className="chart"></div>

          <div className="asset-grid">
            <div className="asset">
              <small>BTC ▲</small>
              <h4>$75,859</h4>
              <p className="green">+1.2%</p>
            </div>

            <div className="asset">
              <small>GOLD ▲</small>
              <h4>$4,492</h4>
              <p className="green">+0.8%</p>
            </div>
          </div>

          {WHALES.map((w) => (
            <div key={w.name} className="whale">
              <div>
                <h4>{w.name}</h4>
                <small>{w.time}</small>
              </div>

              <strong className="green">{w.amount}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* TRUSTED */}
      <section id="trusted" className="trusted">
        <p>Big Companies Come With Us</p>

        <div className="logos">
          {LOGOS.map((logo) => (
            <div className="logo-item" key={logo.name}>
              <img
                src={logo.src}
                alt={logo.name}
                className="logo-company"
              />
              <span>{logo.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section">
        <p className="section-tag">Features</p>

        <h2 className="section-title">
          Everything you need to track financial markets.
        </h2>

        <p className="section-desc">
          Built for traders, investors, and modern financial enthusiasts
          who need clarity, speed, and precision.
        </p>

        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature" key={f.title}>
              <div className="feature-icon">{f.icon}</div>

              <h3>{f.title}</h3>

              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ANALYTICS */}
      <section id="analytics" className="section">
        <div className="analytics">
          <div>
            <p className="section-tag">Smart Analytics</p>

            <h2 className="section-title">
              Institutional-grade insights for retail investors.
            </h2>

            <p className="section-desc">
              Analyze market momentum, whale activities, and portfolio
              performance with elegant visual dashboards.
            </p>

            <div className="check">
              {CHECKLIST.map((c) => (
                <div key={c}>
                  <span>✓</span>
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div className="sentiment">
            <p className="section-tag">Analytics Preview</p>

            <h2 style={{ marginBottom: 20 }}>
              Market Sentiment:
              <span className="green"> Bullish</span>
            </h2>

            <h1
              style={{
                fontSize: "5rem",
                marginBottom: 10,
              }}
            >
              100
            </h1>

            <p style={{ color: "var(--muted)" }}>
              Fear & Greed Index
            </p>

            <div className="meter">
              <div className="track">
                <div
                  className="fill"
                  style={{
                    width: `${barWidth}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}