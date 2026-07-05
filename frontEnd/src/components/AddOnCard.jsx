import './AddOnCard.css'

const CATEGORY_ICONS = {
  Food: '🎂',
  Flowers: '🌸',
  Photo: '📷',
  Gift: '🎁',
  Entertainment: '🎵',
  Other: '✨',
}

export default function AddOnCard({ addon, selected, onToggle }) {
  return (
    <div
      className={`addon-card ${selected ? 'addon-card--selected' : ''}`}
      onClick={() => onToggle(addon)}
    >
      <div className="addon-card__icon">
        {CATEGORY_ICONS[addon.category] || '✨'}
      </div>
      <div className="addon-card__body">
        <h4 className="addon-card__name">{addon.name}</h4>
        <p className="addon-card__desc">{addon.description}</p>
        <div className="addon-card__price">+₹{addon.price}</div>
      </div>
      <div className={`addon-card__check ${selected ? 'visible' : ''}`}>✓</div>
    </div>
  )
}
