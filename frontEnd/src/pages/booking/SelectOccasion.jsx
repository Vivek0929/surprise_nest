import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import Stepper from '../../components/Stepper'
import './Booking.css'

const OCCASIONS = [
  { name: 'Birthday', emoji: '🎂', desc: 'Make their birthday unforgettable' },
  { name: 'Anniversary', emoji: '💍', desc: 'Celebrate your special milestone' },
  { name: 'Farewell', emoji: '👋', desc: 'A heartfelt goodbye party' },
  { name: 'Proposal', emoji: '💕', desc: 'Pop the question in style' },
  { name: 'Friendship Day', emoji: '🤝', desc: 'Celebrate your best friends' },
  { name: 'Other', emoji: '🎉', desc: 'Any reason to celebrate!' },
]

export default function SelectOccasion() {
  const navigate = useNavigate()
  const { booking, updateBooking } = useBooking()

  const select = (occasion) => {
    updateBooking({ occasion })
    navigate('/book/themes')
  }

  return (
    <main className="page-wrapper booking-page">
      <div className="container">
        <Stepper currentStep={1} />
        <div className="booking-header">
          <h2>Select the <span className="gradient-text">Occasion</span></h2>
          <p>What are you celebrating today?</p>
        </div>
        <div className="occasions-grid animate-fade-in">
          {OCCASIONS.map((occ) => (
            <button
              key={occ.name}
              className={`occasion-btn ${booking.occasion === occ.name ? 'selected' : ''}`}
              onClick={() => select(occ.name)}
            >
              <span className="occasion-btn__emoji">{occ.emoji}</span>
              <span className="occasion-btn__name">{occ.name}</span>
              <span className="occasion-btn__desc">{occ.desc}</span>
              {booking.occasion === occ.name && <span className="occasion-btn__check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
