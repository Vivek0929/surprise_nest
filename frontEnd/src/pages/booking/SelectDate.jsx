import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import Stepper from '../../components/Stepper'
import { addDays, format, isBefore, startOfToday } from 'date-fns'
import './Booking.css'

export default function SelectDate() {
  const navigate = useNavigate()
  const { booking, updateBooking } = useBooking()
  const [selected, setSelected] = useState(booking.deliveryDate || '')
  const [error, setError] = useState('')

  // Min date: today + 3 days (we deliver 3 days before chosen date means user picks celebration date)
  const minDate = format(addDays(new Date(), 3), 'yyyy-MM-dd')

  const onNext = () => {
    if (!selected) { setError('Please select a delivery date'); return }
    updateBooking({ deliveryDate: selected })
    navigate('/book/hostel')
  }

  return (
    <main className="page-wrapper booking-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Stepper currentStep={3} />
        <div className="booking-header">
          <h2>Select <span className="gradient-text">Delivery Date</span></h2>
          <p>We deliver 3 days before your selected celebration date</p>
        </div>

        <div className="date-picker-card card animate-scale">
          <div className="date-info">
            <span>📅</span>
            <div>
              <strong>Delivery Lead Time: 3 Days</strong>
              <p>Select your celebration date. We'll arrive 3 days before to set everything up as a surprise!</p>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-xl)' }}>
            <label className="form-label">Select Your Celebration Date</label>
            <input
              type="date"
              className="form-input date-input"
              min={minDate}
              value={selected}
              onChange={(e) => { setSelected(e.target.value); setError('') }}
            />
            {error && <p className="error-text">{error}</p>}
          </div>

          {selected && (
            <div className="date-summary animate-fade-in">
              <div className="date-summary__row">
                <span>🎉 Celebration Date</span>
                <strong>{format(new Date(selected + 'T00:00:00'), 'dd MMM yyyy')}</strong>
              </div>
              <div className="date-summary__row">
                <span>🚚 Estimated Delivery</span>
                <strong style={{ color: 'var(--color-success)' }}>
                  {format(addDays(new Date(selected + 'T00:00:00'), -3), 'dd MMM yyyy')}
                </strong>
              </div>
            </div>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}
        <div className="booking-nav">
          <button className="btn btn-secondary" onClick={() => navigate('/book/themes')}>← Back</button>
          <button className="btn btn-primary" onClick={onNext}>Next →</button>
        </div>
      </div>
    </main>
  )
}
