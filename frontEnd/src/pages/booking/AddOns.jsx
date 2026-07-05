import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import { getAddons } from '../../api/order.api'
import AddOnCard from '../../components/AddOnCard'
import Stepper from '../../components/Stepper'
import './Booking.css'

export default function AddOns() {
  const navigate = useNavigate()
  const { booking, addAddon, removeAddon, isAddonSelected, getTotal } = useBooking()
  const [addons, setAddons] = useState([])
  const [loading, setLoading] = useState(true)
  const { addOns } = booking
  const { addonsTotal } = getTotal()

  useEffect(() => {
    getAddons()
      .then(({ data }) => setAddons(data.addons || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = (addon) => {
    if (isAddonSelected(addon._id)) removeAddon(addon._id)
    else addAddon(addon)
  }

  return (
    <main className="page-wrapper booking-page">
      <div className="container">
        <Stepper currentStep={5} />
        <div className="booking-header">
          <h2>Add <span className="gradient-text">Extra Surprises</span></h2>
          <p>Optional add-ons to make it even more special</p>
        </div>

        {addOns.length > 0 && (
          <div className="addons-selected animate-fade-in">
            <span>🛒 {addOns.length} add-on{addOns.length > 1 ? 's' : ''} selected</span>
            <strong>+₹{addonsTotal}</strong>
          </div>
        )}

        {loading ? (
          <div className="flex-center" style={{ minHeight: '300px' }}><div className="spinner" /></div>
        ) : (
          <div className="grid grid-2 gap-md animate-fade-in">
            {addons.map((addon) => (
              <AddOnCard key={addon._id} addon={addon} selected={isAddonSelected(addon._id)} onToggle={toggle} />
            ))}
          </div>
        )}

        <div className="booking-nav">
          <button className="btn btn-secondary" onClick={() => navigate('/book/hostel')}>← Back</button>
          <button className="btn btn-primary" onClick={() => navigate('/book/summary')}>
            Next → {addOns.length > 0 ? `(${addOns.length} selected)` : '(Skip)'}
          </button>
        </div>
      </div>
    </main>
  )
}
