import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import { useAuth } from '../../context/AuthContext'
import Stepper from '../../components/Stepper'
import './Booking.css'

export default function HostelDetails() {
  const navigate = useNavigate()
  const { booking, updateBooking } = useBooking()
  const { user } = useAuth()

  const [form, setForm] = useState(booking.hostelDetails || {
    receiverName: '', hostelName: '', roomNumber: '', collegeName: '', mobileNumber: ''
  })
  const [errors, setErrors] = useState({})

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validate = () => {
    const e = {}
    if (!form.receiverName) e.receiverName = 'Receiver name is required'
    if (!form.hostelName) e.hostelName = 'Hostel name is required'
    if (!form.roomNumber) e.roomNumber = 'Room number is required'
    if (!form.collegeName) e.collegeName = 'College name is required'
    if (!form.mobileNumber || form.mobileNumber.length < 10) e.mobileNumber = 'Valid 10-digit mobile number required'
    return e
  }

  const onNext = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    updateBooking({ hostelDetails: form })
    navigate('/book/addons')
  }

  const Field = ({ name, label, placeholder, type='text' }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className={`form-input ${errors[name]?'error':''}`} type={type}
        name={name} value={form[name]} onChange={onChange} placeholder={placeholder} />
      {errors[name] && <p className="error-text">{errors[name]}</p>}
    </div>
  )

  return (
    <main className="page-wrapper booking-page">
      <div className="container" style={{ maxWidth: 600 }}>
        <Stepper currentStep={4} />
        <div className="booking-header">
          <h2>Enter <span className="gradient-text">Hostel Details</span></h2>
          <p>Tell us where and to whom we should deliver</p>
        </div>

        <div className="card animate-scale">
          <div className="hostel-form">
            <Field name="receiverName" label="Receiver's Name" placeholder="John Doe" />
            <Field name="hostelName" label="Hostel Name" placeholder="Sunrise Boys Hostel" />
            <Field name="roomNumber" label="Room Number" placeholder="Block A, Room 204" />
            <Field name="collegeName" label="College / University Name" placeholder="ABC Engineering College" />
            <Field name="mobileNumber" label="Receiver's Mobile Number" placeholder="9876543210" type="tel" />
          </div>
        </div>

        <div className="booking-nav">
          <button className="btn btn-secondary" onClick={() => navigate('/book/date')}>← Back</button>
          <button className="btn btn-primary" onClick={onNext}>Next →</button>
        </div>
      </div>
    </main>
  )
}
