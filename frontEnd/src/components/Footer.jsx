import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__glow" />
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <span>🎊</span>
              <span className="footer__logo-text">Surprise<span className="gradient-text">Nest</span></span>
            </div>
            <p className="footer__tagline">
              Make every celebration unforgettable. We deliver joy, straight to your hostel door.
            </p>
            <div className="footer__social">
              <a href="#" className="footer__social-link" aria-label="Instagram">📸</a>
              <a href="#" className="footer__social-link" aria-label="Twitter">🐦</a>
              <a href="#" className="footer__social-link" aria-label="WhatsApp">💬</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__col">
            <h4 className="footer__heading">Quick Links</h4>
            <nav className="footer__nav">
              <Link to="/" className="footer__link">Home</Link>
              <Link to="/book" className="footer__link">Book Celebration</Link>
              <Link to="/profile" className="footer__link">My Orders</Link>
              <Link to="/register" className="footer__link">Sign Up</Link>
            </nav>
          </div>

          {/* Occasions */}
          <div className="footer__col">
            <h4 className="footer__heading">Occasions</h4>
            <nav className="footer__nav">
              <Link to="/book/themes?occasion=Birthday" className="footer__link">🎂 Birthday</Link>
              <Link to="/book/themes?occasion=Anniversary" className="footer__link">💍 Anniversary</Link>
              <Link to="/book/themes?occasion=Farewell" className="footer__link">👋 Farewell</Link>
              <Link to="/book/themes?occasion=Proposal" className="footer__link">💕 Proposal</Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4 className="footer__heading">Contact</h4>
            <div className="footer__contact">
              <p>📧 hello@surprisenest.com</p>
              <p>📞 +91 98765 43210</p>
              <p>🕐 Mon–Sat: 9am – 9pm</p>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} SurpriseNest. All rights reserved.</p>
          <p>Made with ❤️ for hostel celebrations</p>
        </div>
      </div>
    </footer>
  )
}
