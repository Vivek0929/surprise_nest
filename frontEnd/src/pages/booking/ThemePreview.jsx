import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBooking } from '../../context/BookingContext'
import { getTheme, getThemeReviews } from '../../api/theme.api'
import Stepper from '../../components/Stepper'
import './Booking.css'

export default function ThemePreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updateBooking } = useBooking()
  const [theme, setTheme] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    Promise.all([getTheme(id), getThemeReviews(id)])
      .then(([t, r]) => { setTheme(t.data.theme); setReviews(r.data.reviews) })
      .catch(() => navigate('/book/themes'))
      .finally(() => setLoading(false))
  }, [id])

  const selectTheme = () => {
    updateBooking({ theme })
    navigate('/book/date')
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>
  if (!theme) return null

  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(theme.name)}&background=${theme.color?.replace('#','')}&color=fff&size=600`

  return (
    <main className="page-wrapper booking-page">
      <div className="container">
        <Stepper currentStep={2} />
        <div className="theme-preview animate-fade-in">
          {/* Image */}
          <div className="theme-preview__img-col">
            <div className="theme-preview__main-img">
              <img src={theme.images?.[imgIdx] || fallback} alt={theme.name}
                onError={(e) => { e.target.src = fallback }} />
            </div>
            {theme.images?.length > 1 && (
              <div className="theme-preview__thumbs">
                {theme.images.map((img, i) => (
                  <img key={i} src={img} alt="" className={`theme-preview__thumb ${imgIdx===i?'active':''}`}
                    onClick={() => setImgIdx(i)} onError={(e) => { e.target.src = fallback }} />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="theme-preview__info">
            <div className="flex gap-sm" style={{flexWrap:'wrap'}}>
              {theme.occasions?.map((o) => <span key={o} className="badge badge-purple">{o}</span>)}
            </div>
            <h1 className="theme-preview__name">{theme.name}</h1>
            <p className="theme-preview__desc">{theme.description}</p>

            {/* Rating */}
            {theme.rating > 0 && (
              <div className="theme-preview__rating">
                {'⭐'.repeat(Math.round(theme.rating))}
                <span>{Number(theme.rating).toFixed(1)} ({theme.reviewCount} reviews)</span>
              </div>
            )}

            {/* Items Included */}
            <div className="theme-preview__items-card">
              <h4>🎁 Items Included ({theme.items?.length})</h4>
              <div className="theme-preview__items">
                {theme.items?.map((item, i) => (
                  <span key={i} className="theme-preview__item">✓ {item}</span>
                ))}
              </div>
            </div>

            {/* Price + CTA */}
            <div className="theme-preview__footer">
              <div>
                <div className="price price-lg">₹{theme.price?.toLocaleString()}</div>
                <div className="text-sm" style={{color:'var(--text-muted)'}}>+ ₹100 delivery</div>
              </div>
              <button onClick={selectTheme} className="btn btn-primary btn-lg">
                Select This Theme →
              </button>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/book/themes')}>← All Themes</button>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="theme-reviews">
            <h3>Customer Reviews</h3>
            <div className="reviews-grid">
              {reviews.map((r) => (
                <div key={r._id} className="review-card card">
                  <div className="review-header">
                    <div className="review-avatar">{r.user?.name?.charAt(0)}</div>
                    <div>
                      <div className="review-name">{r.user?.name}</div>
                      <div className="review-stars">{'⭐'.repeat(r.rating)}</div>
                    </div>
                  </div>
                  <p className="review-comment">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
