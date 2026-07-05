import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import { placeOrder } from '../../api/order.api'
import toast from 'react-hot-toast'
import Stepper from '../../components/Stepper'
import './Booking.css'

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI', icon: '📱', desc: 'GPay, PhonePe, Paytm' },
  { id: 'Credit/Debit Card', label: 'Credit / Debit Card', icon: '💳', desc: 'All major cards accepted' },
  { id: 'Net Banking', label: 'Net Banking', icon: '🏦', desc: 'All major banks' },
  { id: 'Wallet', label: 'Wallets', icon: '👛', desc: 'Paytm, Amazon Pay' },
  { id: 'Cash on Delivery', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when we deliver' },
]

export default function Payment() {
  const navigate = useNavigate()
  const { booking, getTotal, resetBooking } = useBooking()
  const [method, setMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const { total } = getTotal()

  const handlePay = async () => {
    if (!method) { toast.error('Please select a payment method'); return }
    setLoading(true)
    try {
      const payload = {
        occasion: booking.occasion,
        themeId: booking.theme._id,
        addOnIds: booking.addOns.map((a) => a._id),
        hostelDetails: booking.hostelDetails,
        deliveryDate: booking.deliveryDate,
        payment: { method },
      }
      const { data } = await placeOrder(payload)
      toast.success('🎉 Order placed successfully!')
      resetBooking()
      navigate(`/order/confirmation/${data.order._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrapper booking-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Stepper currentStep={7} />
        <div className="booking-header">
          <h2>Choose <span className="gradient-text">Payment Method</span></h2>
          <p>Select how you'd like to pay for your celebration</p>
        </div>

        <div className="payment-methods animate-scale">
          {PAYMENT_METHODS.map((pm) => (
            <div key={pm.id}
              className={`payment-option ${method === pm.id ? 'selected' : ''}`}
              onClick={() => setMethod(pm.id)}
            >
              <div className="payment-option__icon">{pm.icon}</div>
              <div className="payment-option__body">
                <div className="payment-option__label">{pm.label}</div>
                <div className="payment-option__desc">{pm.desc}</div>
              </div>
              <div className={`payment-option__radio ${method === pm.id ? 'active' : ''}`} />
            </div>
          ))}
        </div>

        <div className="payment-total card">
          <span>Total to Pay</span>
          <span className="price price-lg">₹{total?.toLocaleString()}</span>
        </div>

        <div className="booking-nav">
          <button className="btn btn-secondary" onClick={() => navigate('/book/summary')}>← Back</button>
          <button className="btn btn-primary btn-lg" onClick={handlePay} disabled={loading || !method}>
            {loading
              ? <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Processing...</>
              : `🎉 Pay ₹${total?.toLocaleString()}`}
          </button>
        </div>
      </div>
    </main>
  )
}
