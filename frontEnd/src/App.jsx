import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

// Public Pages
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Booking Flow
import BookCelebration from './pages/booking/BookCelebration'
import SelectOccasion from './pages/booking/SelectOccasion'
import ChooseTheme from './pages/booking/ChooseTheme'
import ThemePreview from './pages/booking/ThemePreview'
import SelectDate from './pages/booking/SelectDate'
import HostelDetails from './pages/booking/HostelDetails'
import AddOns from './pages/booking/AddOns'
import OrderSummary from './pages/booking/OrderSummary'
import Payment from './pages/booking/Payment'

// Post-booking Pages
import OrderConfirmation from './pages/OrderConfirmation'
import OrderTracking from './pages/OrderTracking'
import Profile from './pages/Profile'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminThemes from './pages/admin/AdminThemes'
import AdminAddOns from './pages/admin/AdminAddOns'
import AdminInventory from './pages/admin/AdminInventory'

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard'
import DeliveryOrders from './pages/delivery/DeliveryOrders'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          {/* Background glow orbs */}
          <div className="glow-orb glow-orb-1" />
          <div className="glow-orb glow-orb-2" />

          <Navbar />

          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Booking Flow (protected) */}
            <Route path="/book" element={<ProtectedRoute><BookCelebration /></ProtectedRoute>} />
            <Route path="/book/occasion" element={<ProtectedRoute><SelectOccasion /></ProtectedRoute>} />
            <Route path="/book/themes" element={<ProtectedRoute><ChooseTheme /></ProtectedRoute>} />
            <Route path="/book/theme/:id" element={<ProtectedRoute><ThemePreview /></ProtectedRoute>} />
            <Route path="/book/date" element={<ProtectedRoute><SelectDate /></ProtectedRoute>} />
            <Route path="/book/hostel" element={<ProtectedRoute><HostelDetails /></ProtectedRoute>} />
            <Route path="/book/addons" element={<ProtectedRoute><AddOns /></ProtectedRoute>} />
            <Route path="/book/summary" element={<ProtectedRoute><OrderSummary /></ProtectedRoute>} />
            <Route path="/book/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />

            {/* Post-booking */}
            <Route path="/order/confirmation/:id" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
            <Route path="/order/track/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/themes" element={<ProtectedRoute role="admin"><AdminThemes /></ProtectedRoute>} />
            <Route path="/admin/addons" element={<ProtectedRoute role="admin"><AdminAddOns /></ProtectedRoute>} />
            <Route path="/admin/inventory" element={<ProtectedRoute role="admin"><AdminInventory /></ProtectedRoute>} />

            {/* Delivery */}
            <Route path="/delivery" element={<ProtectedRoute role="delivery"><DeliveryDashboard /></ProtectedRoute>} />
            <Route path="/delivery/orders" element={<ProtectedRoute role="delivery"><DeliveryOrders /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Footer />

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1A1030',
                color: '#F8FAFC',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: '12px',
                fontFamily: "'Outfit', sans-serif",
              },
              success: { iconTheme: { primary: '#10B981', secondary: '#0A0612' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#0A0612' } },
            }}
          />
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
