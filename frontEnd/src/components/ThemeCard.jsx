import { Link } from 'react-router-dom'
import './ThemeCard.css'

export default function ThemeCard({ theme, onWishlist, isWishlisted }) {
  const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(theme.name)}&background=${theme.color?.replace('#','')}&color=fff&size=400&bold=true`

  return (
    <div className="theme-card animate-fade-in">
      <div className="theme-card__img-wrap">
        <img
          src={theme.images?.[0] || fallbackImg}
          alt={theme.name}
          className="theme-card__img"
          onError={(e) => { e.target.src = fallbackImg }}
        />
        <div className="theme-card__overlay" style={{ '--theme-color': theme.color || '#7C3AED' }} />
        {theme.isFeatured && <span className="theme-card__badge">⭐ Featured</span>}
        {onWishlist && (
          <button
            className={`theme-card__wishlist ${isWishlisted ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onWishlist(theme._id) }}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        )}
      </div>

      <div className="theme-card__body">
        <div className="theme-card__occasions">
          {theme.occasions?.slice(0, 2).map((o) => (
            <span key={o} className="badge badge-purple">{o}</span>
          ))}
        </div>
        <h3 className="theme-card__name">{theme.name}</h3>
        <p className="theme-card__desc">{theme.description}</p>

        <div className="theme-card__footer">
          <div>
            <div className="theme-card__price">₹{theme.price?.toLocaleString()}</div>
            {theme.rating > 0 && (
              <div className="theme-card__rating">
                ⭐ {Number(theme.rating).toFixed(1)} ({theme.reviewCount})
              </div>
            )}
          </div>
          <Link to={`/book/theme/${theme._id}`} className="btn btn-primary btn-sm">
            View →
          </Link>
        </div>
      </div>
    </div>
  )
}
