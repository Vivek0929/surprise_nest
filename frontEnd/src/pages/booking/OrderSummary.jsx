import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import { format } from 'date-fns'
import Stepper from '../../components/Stepper'
import './Booking.css'

export default function OrderSummary() {
  const navigate = useNavigate()
  const { booking, getTotal } = useBooking()
  const { occasion, theme, addOns, hostelDetails, deliveryDate } = booking
  const { themePrice, addonsTotal, delivery, total } = getTotal()

  // Guard: redirect if missing data
  if (!theme) { navigate('/book'); return null }

  return (
    <main className="page-wrapper booking-page">
      <div className="container" style={{ maxWidth: 700 }}>
        <Stepper currentStep={6} />
        <div className="booking-header">
          <h2>Order <span className="gradient-text">Summary</span></h2>
          <p>Review your celebration details before payment</p>
        </div>

        <div className="summary-card card animate-scale">
          {/* Theme */}
          <div className="summary-section">
            <h4 className="summary-section__title">🎨 Theme</h4>
            <div className="summary-row">
              <div>
                <div className="summary-theme-name">{theme.name}</div>
                <div className="summary-occasion badge badge-purple">{occasion}</div>
              </div>
              <div className="summary-price">₹{themePrice?.toLocaleString()}</div>
            </div>
          </div>

          <div className="divider" />

          {/* Hostel Details */}
          <div className="summary-section">
            <h4 className="summary-section__title">🏠 Delivery Details</h4>
            <div className="summary-detail-grid">
              <div><span>Receiver</span><strong>{hostelDetails.receiverName}</strong></div>
              <div><span>Hostel</span><strong>{hostelDetails.hostelName}</strong></div>
              <div><span>Room</span><strong>{hostelDetails.roomNumber}</strong></div>
              <div><span>College</span><strong>{hostelDetails.collegeName}</strong></div>
              <div><span>Mobile</span><strong>{hostelDetails.mobileNumber}</strong></div>
              <div><span>Date</span><strong style={{ color: 'var(--color-success)' }}>
                {deliveryDate ? format(new Date(deliveryDate + 'T00:00:00'), 'dd MMM yyyy') : '-'}
              </strong></div>
            </div>
          </div>

          {/* Add-Ons */}
          {addOns.length > 0 && (
            <>
              <div className="divider" />
              <div className="summary-section">
                <h4 className="summary-section__title">🎁 Add-Ons ({addOns.length})</h4>
                {addOns.map((a) => (
                  <div key={a._id} className="summary-row summary-row--sm">
                    <span>{a.name}</span>
                    <span>₹{a.price}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="divider" />

          {/* Price Breakdown */}
          <div className="summary-section">
            <div className="summary-row summary-row--sm">
              <span>Theme Price</span><span>₹{themePrice?.toLocaleString()}</span>
            </div>
            {addOns.length > 0 && (
              <div className="summary-row summary-row--sm">
                <span>Add-Ons ({addOns.length})</span><span>₹{addonsTotal}</span>
              </div>
            )}
            <div className="summary-row summary-row--sm">
              <span>Delivery Charge</span><span>₹{delivery}</span>
            </div>
            <div className="divider" style={{ margin: 'var(--space-sm) 0' }} />
            <div className="summary-row summary-total">
              <span>Total Amount</span>
              <span className="price price-lg">₹{total?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="booking-nav">
          <button className="btn btn-secondary" onClick={() => navigate('/book/addons')}>← Back</button>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/book/payment')}>
            💳 Proceed to Payment
          </button>
        </div>
      </div>
    </main>
  )
}
