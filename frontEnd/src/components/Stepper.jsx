import './Stepper.css'

const STEPS = [
  { num: 1, label: 'Occasion' },
  { num: 2, label: 'Theme' },
  { num: 3, label: 'Date' },
  { num: 4, label: 'Hostel' },
  { num: 5, label: 'Add-Ons' },
  { num: 6, label: 'Summary' },
  { num: 7, label: 'Payment' },
]

export default function Stepper({ currentStep }) {
  return (
    <div className="stepper">
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.num
        const isActive = currentStep === step.num
        return (
          <div key={step.num} className="stepper__item">
            <div className={`stepper__circle ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
              {isCompleted ? '✓' : step.num}
            </div>
            <span className={`stepper__label ${isActive ? 'active' : ''}`}>{step.label}</span>
            {idx < STEPS.length - 1 && (
              <div className={`stepper__line ${isCompleted ? 'completed' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
