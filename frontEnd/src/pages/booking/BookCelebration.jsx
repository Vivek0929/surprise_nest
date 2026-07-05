import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import { useAuth } from '../../context/AuthContext'
import './Booking.css'

export default function BookCelebration() {
  const navigate = useNavigate()
  const { updateBooking, resetBooking } = useBooking()
  const { user } = useAuth()

  const handleStart = () => {
    resetBooking()
    navigate('/book/occasion')
  }

  return (
    <main className="page-wrapper booking-page">
      <div className="container">
        <div className="book-start animate-scale">
          <div className="book-start__emoji animate-float">🎊</div>
          <h1 className="book-start__title">
            Book Your <span className="gradient-text">Celebration</span>
          </h1>
          <p className="book-start__sub">
            Hey {user?.name?.split(' ')[0]}! Let's create an unforgettable surprise.
            Choose an occasion to get started — takes less than 5 minutes!
          </p>

          <div className="book-start__steps">
            {[
              { icon: '🎭', label: 'Pick Occasion' },
              { icon: '🎨', label: 'Choose Theme' },
              { icon: '📅', label: 'Select Date' },
              { icon: '🏠', label: 'Hostel Details' },
              { icon: '🎁', label: 'Add Extras' },
              { icon: '✅', label: 'Pay & Confirm' },
            ].map((s, i) => (
              <div key={i} className="book-start__step">
                <div className="book-start__step-icon">{s.icon}</div>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <button onClick={handleStart} className="btn btn-primary btn-lg">
            🚀 Let's Start →
          </button>
        </div>
      </div>
    </main>
  )
}
