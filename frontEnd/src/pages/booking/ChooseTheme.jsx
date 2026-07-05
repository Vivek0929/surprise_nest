import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import { getThemes } from '../../api/theme.api'
import ThemeCard from '../../components/ThemeCard'
import Stepper from '../../components/Stepper'
import './Booking.css'

export default function ChooseTheme() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { booking } = useBooking()
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(searchParams.get('occasion') || booking.occasion || '')

  useEffect(() => {
    setLoading(true)
    getThemes(filter ? { occasion: filter } : {})
      .then(({ data }) => setThemes(data.themes || []))
      .catch(() => setThemes([]))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <main className="page-wrapper booking-page">
      <div className="container">
        <Stepper currentStep={2} />
        <div className="booking-header">
          <h2>Choose Your <span className="gradient-text">Theme</span></h2>
          <p>Pick the perfect decoration theme for your celebration</p>
        </div>

        {/* Filter */}
        <div className="theme-filters">
          {['', 'Birthday', 'Anniversary', 'Farewell', 'Proposal', 'Friendship Day', 'Other'].map((occ) => (
            <button key={occ} onClick={() => setFilter(occ)}
              className={`filter-chip ${filter === occ ? 'active' : ''}`}>
              {occ || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-center" style={{ minHeight: '300px' }}><div className="spinner" /></div>
        ) : themes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎨</div>
            <h3>No themes found</h3>
            <p>Try a different occasion filter</p>
          </div>
        ) : (
          <div className="grid grid-3 gap-lg animate-fade-in">
            {themes.map((theme) => (
              <ThemeCard key={theme._id} theme={theme} />
            ))}
          </div>
        )}

        <div className="booking-nav">
          <button className="btn btn-secondary" onClick={() => navigate('/book/occasion')}>← Back</button>
        </div>
      </div>
    </main>
  )
}
