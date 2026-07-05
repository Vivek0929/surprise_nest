import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getThemes } from '../api/theme.api'
import ThemeCard from '../components/ThemeCard'
import './Home.css'

const OCCASIONS = ['Birthday', 'Anniversary', 'Farewell', 'Proposal', 'Friendship Day']
const HOW_STEPS = [
  { icon: '🎊', title: 'Choose Occasion', desc: 'Select what you\'re celebrating — birthday, farewell, proposal and more.' },
  { icon: '🎨', title: 'Pick a Theme', desc: 'Browse our stunning themed kits and customise to your taste.' },
  { icon: '📅', title: 'Set Date & Hostel', desc: 'We deliver 3 days before your chosen date — right to the room.' },
  { icon: '🚀', title: 'We Handle the Rest', desc: 'Sit back while we pack and deliver the perfect surprise.' },
]

export default function Home() {
  const [featuredThemes, setFeaturedThemes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getThemes({ featured: true })
      .then(({ data }) => setFeaturedThemes(data.themes?.slice(0, 4) || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="home page-wrapper">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__particles">
          {[...Array(12)].map((_, i) => (
            <span key={i} className="particle" style={{ '--delay': `${i * 0.4}s`, '--x': `${Math.random() * 100}%` }}>
              {['🎊', '🎉', '✨', '🎈', '🎁', '⭐'][i % 6]}
            </span>
          ))}
        </div>

        <div className="container hero__content">
          <div className="section-label">🏠 Hostel Celebrations Made Easy</div>
          <h1 className="hero__title">
            Make Every <br />
            <span className="gradient-text">Celebration</span> Special
          </h1>
          <p className="hero__subtitle">
            Surprise your loved ones with hassle-free themed decoration kits delivered straight to their hostel room. No stress, just magic. ✨
          </p>
          <div className="hero__actions">
            <Link to="/book" className="btn btn-primary btn-lg hero__cta">
              🎊 Book Your Celebration
            </Link>
            <Link to="/book/themes" className="btn btn-secondary btn-lg">
              Browse Themes →
            </Link>
          </div>

          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-number">500+</span>
              <span className="hero__stat-label">Celebrations Done</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-number">10+</span>
              <span className="hero__stat-label">Unique Themes</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-number">4.9⭐</span>
              <span className="hero__stat-label">Average Rating</span>
            </div>
          </div>
        </div>

        <div className="hero__scroll">
          <div className="hero__scroll-indicator" />
        </div>
      </section>

      {/* ── Occasions ── */}
      <section className="section occasions">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
            <div className="section-label">🎭 Occasions We Cover</div>
            <h2>What Are You <span className="gradient-text">Celebrating?</span></h2>
          </div>
          <div className="occasions__grid">
            {OCCASIONS.map((occ) => (
              <Link key={occ} to={`/book/themes?occasion=${occ}`} className="occasion-chip">
                <span className="occasion-chip__emoji">
                  {occ === 'Birthday' ? '🎂' : occ === 'Anniversary' ? '💍' : occ === 'Farewell' ? '👋' : occ === 'Proposal' ? '💕' : '🤝'}
                </span>
                <span>{occ}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Themes ── */}
      <section className="section featured">
        <div className="container">
          <div className="flex-between" style={{ marginBottom: 'var(--space-2xl)' }}>
            <div>
              <div className="section-label">🎨 Popular Picks</div>
              <h2>Featured <span className="gradient-text">Themes</span></h2>
            </div>
            <Link to="/book/themes" className="btn btn-secondary">View All →</Link>
          </div>

          {loading ? (
            <div className="flex-center" style={{ minHeight: '300px' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="grid grid-2 gap-lg">
              {featuredThemes.map((theme) => (
                <ThemeCard key={theme._id} theme={theme} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section how-it-works">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
            <div className="section-label">⚡ Simple Process</div>
            <h2>How It <span className="gradient-text">Works</span></h2>
          </div>
          <div className="hiw__grid">
            {HOW_STEPS.map((step, i) => (
              <div key={i} className="hiw__card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="hiw__number">{String(i + 1).padStart(2, '0')}</div>
                <div className="hiw__icon">{step.icon}</div>
                <h3 className="hiw__title">{step.title}</h3>
                <p className="hiw__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section cta-banner">
        <div className="container">
          <div className="cta-box">
            <div className="cta-box__glow" />
            <div className="cta-box__content">
              <h2>Ready to Create a <span className="gradient-text">Magical Moment?</span></h2>
              <p>Book your celebration kit today. We'll handle everything — you just show up and smile. 😊</p>
              <Link to="/book" className="btn btn-primary btn-lg">
                🎊 Start Booking Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
