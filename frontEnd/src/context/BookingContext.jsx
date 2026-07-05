import { createContext, useContext, useState } from 'react'

const BookingContext = createContext(null)

const INITIAL_STATE = {
  step: 1,
  occasion: '',
  theme: null,      // full theme object
  deliveryDate: '',
  hostelDetails: { receiverName: '', hostelName: '', roomNumber: '', collegeName: '', mobileNumber: '' },
  addOns: [],       // array of addOn objects selected
  paymentMethod: '',
}

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(INITIAL_STATE)

  const updateBooking = (updates) => setBooking((prev) => ({ ...prev, ...updates }))

  const resetBooking = () => setBooking(INITIAL_STATE)

  const addAddon = (addon) => {
    setBooking((prev) => {
      const exists = prev.addOns.find((a) => a._id === addon._id)
      if (exists) return prev
      return { ...prev, addOns: [...prev.addOns, addon] }
    })
  }

  const removeAddon = (addonId) => {
    setBooking((prev) => ({ ...prev, addOns: prev.addOns.filter((a) => a._id !== addonId) }))
  }

  const isAddonSelected = (addonId) => booking.addOns.some((a) => a._id === addonId)

  const getTotal = () => {
    const themePrice = booking.theme?.price || 0
    const addonsTotal = booking.addOns.reduce((sum, a) => sum + a.price, 0)
    const delivery = 100
    return { themePrice, addonsTotal, delivery, total: themePrice + addonsTotal + delivery }
  }

  return (
    <BookingContext.Provider value={{
      booking, updateBooking, resetBooking,
      addAddon, removeAddon, isAddonSelected, getTotal,
    }}>
      {children}
    </BookingContext.Provider>
  )
}

export const useBooking = () => {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider')
  return ctx
}
