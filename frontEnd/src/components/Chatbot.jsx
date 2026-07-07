import { useState, useRef, useEffect } from 'react'
import { useBooking } from '../context/BookingContext'
import { sendChatRequest } from '../api/chatbot.api'
import { getThemes } from '../api/theme.api'
import { getAddons } from '../api/order.api'
import { toast } from 'react-hot-toast'
import './Chatbot.css'
import React from 'react'

const SliderPreview = ({ original, decorated, sliderPos, onChangeSliderPos }) => {
  const containerRef = React.useRef(null)
  
  const handleMove = (clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    onChangeSliderPos(pct)
  }

  const handleMouseMove = (e) => {
    if (e.buttons === 1) {
      handleMove(e.clientX)
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX)
    }
  }

  return (
    <div 
      ref={containerRef}
      className="slider-preview-container" 
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'ew-resize',
        userSelect: 'none',
        border: '1px solid rgba(124, 58, 237, 0.3)'
      }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onClick={(e) => handleMove(e.clientX)}
    >
      {/* Before Image (Original Room) */}
      <img 
        src={original} 
        alt="Original Room" 
        style={{
          width: '100%',
          display: 'block',
          pointerEvents: 'none'
        }} 
      />
      
      {/* After Image (Decorated Room) */}
      <img 
        src={decorated} 
        alt="Decorated Room Preview" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
        }} 
      />

      {/* Slider Split Line */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: `${sliderPos}%`,
        width: '2px',
        background: '#FFF',
        boxShadow: '0 0 8px rgba(0,0,0,0.8)',
        zIndex: 10,
        pointerEvents: 'none'
      }} />

      {/* Drag handle button */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: `${sliderPos}%`,
        transform: 'translate(-50%, -50%)',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#7C3AED',
        border: '2px solid #FFF',
        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        zIndex: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFF',
        fontSize: '12px',
        fontWeight: 'bold',
        pointerEvents: 'none'
      }}>
        ↔
      </div>
    </div>
  )
}

export default function Chatbot() {
  const { updateBooking, addAddon, isAddonSelected, booking } = useBooking()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi there! I am **SurpriseNest AI**, your personal celebration planning assistant. ✨\n\nHow can I help you today? You can:\n1. 🎨 **Recommend themes & gifts** within your budget.\n2. 📸 **Upload room photo** for a realistic AI decoration preview.\n3. ✍️ **Generate card messages** for birthdays, anniversaries, etc.\n4. 🚴 **Track your order** by typing your Order ID.',
    }
  ])
  const [loading, setLoading] = useState(false)
  const [decorating, setDecorating] = useState(false)
  const [decoratingStep, setDecoratingStep] = useState('')
  const [pendingImage, setPendingImage] = useState(null)
  const [pendingImagePreview, setPendingImagePreview] = useState('')
  const [activeCatalogThemes, setActiveCatalogThemes] = useState([])
  const [regenerateInputIdx, setRegenerateInputIdx] = useState(null)
  
  // Message generator state
  const [msgForm, setMsgForm] = useState({ active: false, step: 1, type: '', tone: '', recipient: '' })
  
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getThemes()
      .then(({ data }) => {
        if (data && data.success) {
          setActiveCatalogThemes(data.themes || [])
        }
      })
      .catch(err => console.error('[Themes Fetch Error]:', err))
  }, [])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, decorating])

  // Process text messages to convert **bold** and linebreaks
  const formatText = (text) => {
    if (!text) return ''
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    if ((!input.trim() && !pendingImage) || loading) return

    const userMessage = input.trim()
    setInput('')

    // If there is an uploaded pending image, we decorate it first
    if (pendingImage) {
      const fileToProcess = pendingImage
      const previewUrl = pendingImagePreview
      setPendingImage(null)
      setPendingImagePreview('')

      const displayMessage = userMessage || "Decorate this room photo"
      setMessages(prev => [...prev, { sender: 'user', text: displayMessage, imageUpload: previewUrl }])
      setDecorating(true)

      // Detect theme from prompt and context
      let detectedTheme = 'default'
      const promptLower = displayMessage.toLowerCase()
      const currentThemeName = booking.theme?.name?.toLowerCase() || ''

      if (promptLower.includes('bts') || promptLower.includes('purple') || currentThemeName.includes('bts')) {
        detectedTheme = 'bts'
      } else if (promptLower.includes('princess') || promptLower.includes('pink') || currentThemeName.includes('princess')) {
        detectedTheme = 'princess'
      } else if (promptLower.includes('galaxy') || promptLower.includes('blue') || currentThemeName.includes('galaxy') || currentThemeName.includes('space')) {
        detectedTheme = 'galaxy'
      } else if (promptLower.includes('black') || promptLower.includes('gold') || currentThemeName.includes('black')) {
        detectedTheme = 'blackgold'
      } else if (promptLower.includes('farewell') || promptLower.includes('goodbye') || currentThemeName.includes('farewell')) {
        detectedTheme = 'farewell'
      } else if (promptLower.includes('love') || promptLower.includes('proposal') || promptLower.includes('anniversary') || promptLower.includes('red') || currentThemeName.includes('proposal') || currentThemeName.includes('anniversary') || currentThemeName.includes('love')) {
        detectedTheme = 'love'
      } else if (promptLower.includes('barbie') || currentThemeName.includes('barbie')) {
        detectedTheme = 'barbie'
      } else if (promptLower.includes('anime') || currentThemeName.includes('anime')) {
        detectedTheme = 'anime'
      } else if (promptLower.includes('marvel') || currentThemeName.includes('superhero') || currentThemeName.includes('marvel')) {
        detectedTheme = 'marvel'
      }

      // Run decoration step simulation
      const steps = [
        'Scanning room boundaries and walls...',
        'Hanging realistic draped curtain backdrop...',
        'Arranging 3D metallic balloon arches...',
        'Hanging customized celebration banner...',
        'Placing cake table with realistic frosting cake...',
        'Polishing highlights and scattering confetti...'
      ]

      let currentStep = 0
      setDecoratingStep(steps[0])
      
      const interval = setInterval(() => {
        currentStep++
        if (currentStep < steps.length) {
          setDecoratingStep(steps[currentStep])
        } else {
          clearInterval(interval)
          processRoomDecoration(fileToProcess, detectedTheme)
        }
      }, 750)

      // Call API in parallel to output the Stable Diffusion / AI generated prompt description
      setLoading(true)
      sendChatRequest(`I uploaded my room photo. Please generate a decoration layout and realistic prompt for the theme: ${detectedTheme}.`, [])
        .then(response => {
          const data = response.data
          if (data.success) {
            setMessages(prev => [
              ...prev,
              {
                sender: 'bot',
                text: data.reply
              }
            ])
          }
        })
        .catch(err => {
          console.error('[Background Room Prompt Error]:', err)
        })
        .finally(() => {
          setLoading(false)
        })

      return
    }

    // Normal text message sending flow
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }])
    setLoading(true)

    try {
      // Map frontend history to standard {role, content}
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }))

      const response = await sendChatRequest(userMessage, history)
      const data = response.data

      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply,
            recommendations: data.recommendations,
            messageDetails: data.messageDetails
          }
        ])
      } else {
        throw new Error(data.message || 'Failed to get reply')
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: "Oops, I'm having trouble connecting right now. Please check your internet or try again in a bit!" }
      ])
    } finally {
      setLoading(false)
    }
  }

  // --- Add Product to Cart/Booking ---
  const handleAddToCart = async (product) => {
    try {
      if (product.type === 'theme') {
        // Fetch detailed theme object from DB
        const { data } = await getThemes()
        const matchedTheme = data.themes?.find(t => t._id === product.id)
        if (matchedTheme) {
          updateBooking({ theme: matchedTheme })
          toast.success(`Selected Theme: ${matchedTheme.name}!`)
        } else {
          // Fallback if theme list is not loaded
          updateBooking({
            theme: {
              _id: product.id,
              name: product.name,
              price: product.price,
              images: [product.image]
            }
          })
          toast.success(`Selected Theme: ${product.name}!`)
        }
      } else if (product.type === 'addon') {
        // Add to addons list
        addAddon({
          _id: product.id,
          name: product.name,
          price: product.price,
          image: product.image
        })
        toast.success(`Added Add-on: ${product.name}!`)
      }
    } catch (err) {
      toast.error('Failed to add product to booking.')
    }
  }

  // --- AI Message Generator Customizer Form Handling ---
  const startMessageGenerator = () => {
    setMessages(prev => [
      ...prev,
      {
        sender: 'bot',
        text: 'Let\'s create a custom celebration greeting! Adjust the details in the form below:',
        isMessageBuilderForm: true
      }
    ])
  }

  const handleMessageBuilderSubmit = async (params) => {
    setLoading(true)
    
    // Plain message representation for backend logs
    const plainMessage = `Generate a ${params.lengthMode} ${params.tone} ${params.occasion} card for a ${params.relationship} named ${params.recipient || 'Friend'}. ${params.customDetails ? `Memories: ${params.customDetails}` : ''}`;
    
    try {
      const response = await sendChatRequest(plainMessage, [], params)
      const data = response.data

      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `I have generated your custom message:`,
            messageDetails: {
              type: data.messageDetails?.type || params.occasion,
              tone: data.messageDetails?.tone || params.tone,
              recipient: data.messageDetails?.recipient || params.recipient,
              generatedText: data.messageDetails?.generatedText || data.reply
            }
          }
        ])
      } else {
        throw new Error()
      }
    } catch (err) {
      const fallbacks = {
        Birthday: `Happy Birthday, ${params.recipient || 'dear friend'}! May your smile brighten every moment of your beautiful life. Wishing you endless laughter and wonderful times! 🎂`,
        Anniversary: `Happy Anniversary! Wishing you many more beautiful years of love, respect, and mutual compatibility. 💖`
      }
      
      let text = fallbacks[params.occasion] || `Wishing you the absolute best on this special ${params.occasion || 'celebration'}!`;
      if (params.customDetails) {
        text += ` \n\n*Special detail added: We cherish our memories of "${params.customDetails}"!*`;
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Here is your generated message (offline fallback):`,
          messageDetails: {
            type: params.occasion,
            tone: params.tone,
            recipient: params.recipient,
            generatedText: text
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Action helpers for message cards
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const downloadTextFile = (text, type) => {
    const element = document.createElement("a")
    const file = new Blob([text], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = `${type || 'Celebration'}_Message.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('Downloaded message file!')
  }

  // --- Realistic Room Decoration Preview Logic ---
  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPendingImage(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setPendingImagePreview(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const themeParams = {
    bts: {
      name: 'BTS Army',
      mainColor: '#8B5CF6',
      secondaryColor: '#1E1B4B',
      balloonColors: ['#8B5CF6', '#7C3AED', '#A78BFA', '#D8B4FE', '#C084FC', '#FFFFFF'],
      defaultBanner: 'BTS ARMY FOREVER',
      backdropColors: ['#2E1065', '#170E30'],
      tableCloth: '#4C1D95',
      tableSkirt: '#2E1065',
      cakeColor: '#8B5CF6',
      graphic: 'bts'
    },
    princess: {
      name: 'Pink Princess',
      mainColor: '#EC4899',
      secondaryColor: '#F472B6',
      balloonColors: ['#EC4899', '#F472B6', '#FFFFFF', '#FDA4AF', '#FB7185'],
      defaultBanner: 'PINK PRINCESS',
      backdropColors: ['#EC4899', '#FBCFE8'],
      tableCloth: '#EC4899',
      tableSkirt: '#F472B6',
      cakeColor: '#F472B6',
      graphic: 'crown'
    },
    galaxy: {
      name: 'Blue Galaxy',
      mainColor: '#2563EB',
      secondaryColor: '#3B82F6',
      balloonColors: ['#1D4ED8', '#2563EB', '#60A5FA', '#1E293B', '#94A3B8'],
      defaultBanner: 'REACH FOR THE STARS',
      backdropColors: ['#0F172A', '#1E293B'],
      tableCloth: '#1D4ED8',
      tableSkirt: '#1E3A8A',
      cakeColor: '#3B82F6',
      graphic: 'stars'
    },
    blackgold: {
      name: 'Black & Gold',
      mainColor: '#F59E0B',
      secondaryColor: '#D97706',
      balloonColors: ['#1E293B', '#F59E0B', '#D97706', '#0F172A', '#FCD34D'],
      defaultBanner: 'HAPPY BIRTHDAY',
      backdropColors: ['#0F172A', '#1C1917'],
      tableCloth: '#1E293B',
      tableSkirt: '#D97706',
      cakeColor: '#F59E0B',
      graphic: 'crown'
    },
    love: {
      name: 'Red Love',
      mainColor: '#DC2626',
      secondaryColor: '#EF4444',
      balloonColors: ['#DC2626', '#EF4444', '#FCA5A5', '#7F1D1D', '#FFFFFF'],
      defaultBanner: 'I LOVE YOU',
      backdropColors: ['#7F1D1D', '#450A0A'],
      tableCloth: '#991B1B',
      tableSkirt: '#7F1D1D',
      cakeColor: '#DC2626',
      graphic: 'heart'
    },
    harrypotter: {
      name: 'Harry Potter',
      mainColor: '#7C3AED',
      secondaryColor: '#F59E0B',
      balloonColors: ['#7C3AED', '#F59E0B', '#1E293B', '#78350F'],
      defaultBanner: 'HOGWARTS',
      backdropColors: ['#1E1035', '#0F0822'],
      tableCloth: '#5B21B6',
      tableSkirt: '#1E1035',
      cakeColor: '#F59E0B',
      graphic: 'potter'
    },
    marvel: {
      name: 'Marvel Universe',
      mainColor: '#DC2626',
      secondaryColor: '#1D4ED8',
      balloonColors: ['#DC2626', '#1D4ED8', '#F59E0B', '#1E293B'],
      defaultBanner: 'AVENGERS ASSEMBLE',
      backdropColors: ['#1E293B', '#1E3A8A'],
      tableCloth: '#7F1D1D',
      tableSkirt: '#1D4ED8',
      cakeColor: '#F59E0B',
      graphic: 'shield'
    },
    barbie: {
      name: 'Barbie Dreamland',
      mainColor: '#DB2777',
      secondaryColor: '#EC4899',
      balloonColors: ['#DB2777', '#EC4899', '#F472B6', '#FFFFFF', '#FCE7F3'],
      defaultBanner: 'BARBIE DREAMWORLD',
      backdropColors: ['#EC4899', '#DB2777'],
      tableCloth: '#DB2777',
      tableSkirt: '#EC4899',
      cakeColor: '#F472B6',
      graphic: 'crown'
    },
    anime: {
      name: 'Anime Night',
      mainColor: '#A78BFA',
      secondaryColor: '#F472B6',
      balloonColors: ['#C084FC', '#FDA4AF', '#FEE2E2', '#FFFFFF'],
      defaultBanner: 'OTAKU WORLD',
      backdropColors: ['#A78BFA', '#FEE2E2'],
      tableCloth: '#6D28D9',
      tableSkirt: '#A78BFA',
      cakeColor: '#FDA4AF',
      graphic: 'sakura'
    },
    farewell: {
      name: 'Golden Farewell',
      mainColor: '#D97706',
      secondaryColor: '#F59E0B',
      balloonColors: ['#D97706', '#F59E0B', '#FEF3C7', '#FCD34D', '#1E293B'],
      defaultBanner: 'HAPPY FAREWELL',
      backdropColors: ['#451A03', '#1C1917'],
      tableCloth: '#78350F',
      tableSkirt: '#D97706',
      cakeColor: '#F59E0B',
      graphic: 'farewell'
    },
    default: {
      name: 'Surprise celebration',
      mainColor: '#7C3AED',
      secondaryColor: '#EC4899',
      balloonColors: ['#8B5CF6', '#7C3AED', '#A78BFA', '#D8B4FE', '#C084FC'],
      defaultBanner: 'CONGRATULATIONS',
      backdropColors: ['#1E1035', '#0F0822'],
      tableCloth: '#6D28D9',
      tableSkirt: '#5B21B6',
      cakeColor: '#EC4899',
      graphic: 'sparkle'
    }
  }

  const getThemeKeyByName = (name) => {
    if (!name) return 'default';
    const norm = name.toLowerCase();
    if (norm.includes('bts')) return 'bts';
    if (norm.includes('princess')) return 'princess';
    if (norm.includes('galaxy') || norm.includes('space')) return 'galaxy';
    if (norm.includes('black') || norm.includes('gold')) return 'blackgold';
    if (norm.includes('love') || norm.includes('romantic') || norm.includes('proposal')) return 'love';
    if (norm.includes('harry') || norm.includes('potter')) return 'harrypotter';
    if (norm.includes('marvel') || norm.includes('superhero')) return 'marvel';
    if (norm.includes('barbie')) return 'barbie';
    if (norm.includes('anime')) return 'anime';
    if (norm.includes('farewell')) return 'farewell';
    return 'default';
  }

  const drawDecorationOnCanvas = (originalDataUrl, themeKey, glowIntensity, customBannerText, variation = 'classic', callback) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      const maxW = 900
      const scale = Math.min(maxW / img.width, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      
      // Draw original room photo
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      const w = canvas.width
      const h = canvas.height
      const activeTheme = themeParams[themeKey] || themeParams.default
      
      const mainColor = activeTheme.mainColor
      const secondaryColor = activeTheme.secondaryColor
      const balloonColors = activeTheme.balloonColors
      const bannerText = (customBannerText || activeTheme.defaultBanner).toUpperCase()
      let backdropColors = activeTheme.backdropColors
      
      // Royal variation crimson-gold velvet drapes
      if (variation === 'royal') {
        backdropColors = ['#7F1D1D', '#450A0A']
      }
      
      // 1. Ambient lighting soft-glow blend overlay
      if (glowIntensity > 0) {
        ctx.save()
        ctx.globalCompositeOperation = 'soft-light'
        ctx.fillStyle = mainColor
        
        let glowFactor = 0.48
        if (variation === 'budget') glowFactor = 0.24
        if (variation === 'luxury' || variation === 'royal') glowFactor = 0.65
        
        ctx.globalAlpha = (glowIntensity / 100) * glowFactor
        ctx.fillRect(0, 0, w, h)
        ctx.restore()
      }
      
      // 2. Draped Curtain Backdrop
      ctx.save()
      let backW = w * 0.58
      let backH = h * 0.52
      
      if (variation === 'budget') {
        backH = h * 0.38
      } else if (variation === 'luxury' || variation === 'royal') {
        backH = h * 0.56
      }
      
      const bx = w * 0.5 - backW / 2
      const by = h * 0.16
      
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 18
      ctx.shadowOffsetY = 4
      
      const curtainGrad = ctx.createLinearGradient(bx, by, bx + backW, by)
      curtainGrad.addColorStop(0, backdropColors[1])
      curtainGrad.addColorStop(0.5, backdropColors[0])
      curtainGrad.addColorStop(1, backdropColors[1])
      ctx.fillStyle = curtainGrad
      ctx.fillRect(bx, by, backW, backH)
      
      // Gold trim for luxury & royal
      if (variation === 'luxury' || variation === 'royal') {
        ctx.fillStyle = '#F59E0B'
        ctx.fillRect(bx - 2, by - 2, backW + 4, 4)
      }
      
      // Realistic fabric drapery fold lines
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
      const folds = variation === 'budget' ? 8 : (variation === 'luxury' || variation === 'royal' ? 18 : 14)
      const foldW = backW / folds
      for (let i = 0; i < folds; i++) {
        const fx = bx + i * foldW
        const foldGrad = ctx.createLinearGradient(fx, by, fx + foldW, by)
        foldGrad.addColorStop(0, 'rgba(0,0,0,0.4)')
        foldGrad.addColorStop(0.3, 'rgba(255,255,255,0.07)')
        foldGrad.addColorStop(0.5, 'rgba(255,255,255,0.16)')
        foldGrad.addColorStop(0.7, 'rgba(255,255,255,0.07)')
        foldGrad.addColorStop(1, 'rgba(0,0,0,0.4)')
        ctx.fillStyle = foldGrad
        ctx.fillRect(fx, by, foldW, backH)
      }
      ctx.restore()
      
      // 3. Draw Theme-specific graphics / symbols on backdrop
      ctx.save()
      ctx.shadowColor = 'rgba(255,255,255,0.2)'
      ctx.shadowBlur = 6
      const gx = w * 0.5
      const gy = by + backH * 0.45
      
      if (activeTheme.graphic === 'bts') {
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.moveTo(gx - 22, gy - 32)
        ctx.lineTo(gx - 4, gy - 28)
        ctx.lineTo(gx - 4, gy + 22)
        ctx.lineTo(gx - 22, gy + 26)
        ctx.closePath()
        ctx.fill()
        
        ctx.beginPath()
        ctx.moveTo(gx + 22, gy - 32)
        ctx.lineTo(gx + 4, gy - 28)
        ctx.lineTo(gx + 4, gy + 22)
        ctx.lineTo(gx + 22, gy + 26)
        ctx.closePath()
        ctx.fill()
      } else if (activeTheme.graphic === 'crown') {
        ctx.fillStyle = '#F59E0B' // Golden Crown
        ctx.beginPath()
        ctx.moveTo(gx - 30, gy + 15)
        ctx.lineTo(gx - 35, gy - 15)
        ctx.lineTo(gx - 15, gy - 3)
        ctx.lineTo(gx, gy - 25)
        ctx.lineTo(gx + 15, gy - 3)
        ctx.lineTo(gx + 35, gy - 15)
        ctx.lineTo(gx + 30, gy + 15)
        ctx.closePath()
        ctx.fill()
        
        // Crown jewels
        ctx.fillStyle = '#EF4444'
        ctx.beginPath(); ctx.arc(gx, gy - 25, 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#3B82F6'
        ctx.beginPath(); ctx.arc(gx - 35, gy - 15, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(gx + 35, gy - 15, 3, 0, Math.PI * 2); ctx.fill()
      } else if (activeTheme.graphic === 'stars') {
        ctx.fillStyle = '#FCD34D'
        const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
          let rot = Math.PI / 2 * 3
          let x = cx
          let y = cy
          let step = Math.PI / spikes
          ctx.beginPath()
          ctx.moveTo(cx, cy - outerRadius)
          for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius
            y = cy + Math.sin(rot) * outerRadius
            ctx.lineTo(x, y)
            rot += step
            x = cx + Math.cos(rot) * innerRadius
            y = cy + Math.sin(rot) * innerRadius
            ctx.lineTo(x, y)
            rot += step
          }
          ctx.lineTo(cx, cy - outerRadius)
          ctx.closePath()
          ctx.fill()
        }
        drawStar(gx, gy, 5, 25, 10)
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        drawStar(gx - 55, gy - 20, 5, 14, 6)
        drawStar(gx + 55, gy + 10, 5, 14, 6)
      } else if (activeTheme.graphic === 'heart') {
        ctx.fillStyle = '#EF4444'
        ctx.beginPath()
        ctx.moveTo(gx, gy - 12)
        ctx.bezierCurveTo(gx - 18, gy - 28, gx - 32, gy - 14, gx - 22, gy + 6)
        ctx.lineTo(gx, gy + 24)
        ctx.lineTo(gx + 22, gy + 6)
        ctx.bezierCurveTo(gx + 32, gy - 14, gx + 18, gy - 28, gx, gy - 12)
        ctx.closePath()
        ctx.fill()
      } else if (activeTheme.graphic === 'potter') {
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(gx - 18, gy + 4, 12, 0, Math.PI * 2)
        ctx.arc(gx + 18, gy + 4, 12, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(gx - 6, gy + 4)
        ctx.lineTo(gx + 6, gy + 4)
        ctx.stroke()
        
        ctx.fillStyle = '#F59E0B'
        ctx.beginPath()
        ctx.moveTo(gx - 2, gy - 28)
        ctx.lineTo(gx + 6, gy - 16)
        ctx.lineTo(gx + 1, gy - 16)
        ctx.lineTo(gx + 4, gy - 5)
        ctx.lineTo(gx - 4, gy - 13)
        ctx.lineTo(gx + 1, gy - 13)
        ctx.closePath()
        ctx.fill()
      } else if (activeTheme.graphic === 'shield') {
        ctx.strokeStyle = '#DC2626'
        ctx.lineWidth = 6
        ctx.fillStyle = '#1D4ED8'
        ctx.beginPath(); ctx.arc(gx, gy, 26, 0, Math.PI * 2); ctx.stroke(); ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 4
        ctx.beginPath(); ctx.arc(gx, gy, 18, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = '#FFFFFF'
        const drawMiniStar = (cx, cy, r) => {
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(cx + Math.cos((18 + i * 72) * Math.PI / 180) * r, cy - Math.sin((18 + i * 72) * Math.PI / 180) * r)
            ctx.lineTo(cx + Math.cos((54 + i * 72) * Math.PI / 180) * (r*0.4), cy - Math.sin((54 + i * 72) * Math.PI / 180) * (r*0.4))
          }
          ctx.closePath()
          ctx.fill()
        }
        drawMiniStar(gx, gy, 8)
      } else if (activeTheme.graphic === 'sakura') {
        ctx.fillStyle = '#FDA4AF'
        const drawSakuraPetal = (px, py, angle) => {
          ctx.save()
          ctx.translate(px, py)
          ctx.rotate(angle)
          ctx.beginPath()
          ctx.ellipse(0, 0, 8, 14, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
        drawSakuraPetal(gx - 10, gy - 10, 0.4)
        drawSakuraPetal(gx + 15, gy - 5, -0.3)
        drawSakuraPetal(gx, gy + 16, 0.9)
        drawSakuraPetal(gx - 20, gy + 12, -0.7)
        drawSakuraPetal(gx + 20, gy + 15, 0.2)
      } else if (activeTheme.graphic === 'farewell') {
        ctx.fillStyle = '#FEF3C7'
        ctx.strokeStyle = '#D97706'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(gx - 24, gy - 16, 48, 32, 4)
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = '#D97706'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(gx - 16, gy - 8); ctx.lineTo(gx + 16, gy - 8)
        ctx.moveTo(gx - 16, gy); ctx.lineTo(gx + 10, gy)
        ctx.moveTo(gx - 16, gy + 8); ctx.lineTo(gx + 14, gy + 8)
        ctx.stroke()
      } else {
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.moveTo(gx, gy - 18)
        ctx.lineTo(gx + 4, gy - 4)
        ctx.lineTo(gx + 18, gy)
        ctx.lineTo(gx + 4, gy + 4)
        ctx.lineTo(gx, gy + 18)
        ctx.lineTo(gx - 4, gy + 4)
        ctx.lineTo(gx - 18, gy)
        ctx.lineTo(gx - 4, gy - 4)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
      
      // 4. Glossy 3D balloons grouped organically in arches on left & right
      const draw3DBalloon = (bx, by, r, color) => {
        ctx.save()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
        ctx.shadowBlur = 9
        ctx.shadowOffsetX = 3
        ctx.shadowOffsetY = 5
        
        ctx.beginPath()
        ctx.ellipse(bx, by, r * 0.9, r * 1.15, 0, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        const grad = ctx.createRadialGradient(bx - r/3, by - r/3, r/12, bx, by, r)
        grad.addColorStop(0, '#FFFFFF')
        grad.addColorStop(0.15, '#FFFFFF')
        grad.addColorStop(0.35, color)
        grad.addColorStop(0.85, color)
        grad.addColorStop(1, '#0C0415')
        
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(bx, by, r * 0.9, r * 1.15, 0, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(bx - 3, by + r * 1.15)
        ctx.lineTo(bx + 3, by + r * 1.15)
        ctx.lineTo(bx, by + r * 1.15 + 4)
        ctx.closePath()
        ctx.fill()
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(bx, by + r * 1.15 + 4)
        ctx.bezierCurveTo(bx - 5, by + r * 1.4, bx + 5, by + r * 1.7, bx, by + r * 2.2)
        ctx.stroke()
        ctx.restore()
      }
      
      // Balloon layouts based on Variation
      if (variation === 'budget') {
        draw3DBalloon(w * 0.08, h * 0.52, w * 0.040, balloonColors[1 % balloonColors.length])
        draw3DBalloon(w * 0.06, h * 0.62, w * 0.038, balloonColors[0])
        
        draw3DBalloon(w * 0.92, h * 0.52, w * 0.040, balloonColors[2 % balloonColors.length])
        draw3DBalloon(w * 0.94, h * 0.62, w * 0.038, balloonColors[0])
      } else {
        // Classic & Premium clusters
        draw3DBalloon(w * 0.08, h * 0.50, w * 0.042, balloonColors[1 % balloonColors.length])
        draw3DBalloon(w * 0.16, h * 0.52, w * 0.038, balloonColors[2 % balloonColors.length])
        draw3DBalloon(w * 0.11, h * 0.42, w * 0.045, balloonColors[0])
        draw3DBalloon(w * 0.06, h * 0.58, w * 0.042, balloonColors[3 % balloonColors.length])
        draw3DBalloon(w * 0.14, h * 0.60, w * 0.048, balloonColors[4 % balloonColors.length])
        draw3DBalloon(w * 0.09, h * 0.68, w * 0.042, balloonColors[0])
        
        draw3DBalloon(w * 0.92, h * 0.50, w * 0.042, balloonColors[2 % balloonColors.length])
        draw3DBalloon(w * 0.84, h * 0.52, w * 0.038, balloonColors[0])
        draw3DBalloon(w * 0.89, h * 0.42, w * 0.045, balloonColors[1 % balloonColors.length])
        draw3DBalloon(w * 0.94, h * 0.58, w * 0.042, balloonColors[4 % balloonColors.length])
        draw3DBalloon(w * 0.86, h * 0.60, w * 0.048, balloonColors[3 % balloonColors.length])
        draw3DBalloon(w * 0.91, h * 0.68, w * 0.042, balloonColors[0])

        if (variation === 'premium') {
          draw3DBalloon(w * 0.04, h * 0.46, w * 0.036, balloonColors[0])
          draw3DBalloon(w * 0.12, h * 0.48, w * 0.034, balloonColors[1 % balloonColors.length])
          draw3DBalloon(w * 0.96, h * 0.46, w * 0.036, balloonColors[0])
          draw3DBalloon(w * 0.88, h * 0.48, w * 0.034, balloonColors[2 % balloonColors.length])
        }
      }

      // Luxury & Royal arches over the top
      if (variation === 'luxury' || variation === 'royal') {
        for (let t = 0.02; t <= 0.98; t += 0.065) {
          const ax = (1 - t) * (1 - t) * (w * 0.08) + 2 * (1 - t) * t * (w * 0.5) + t * t * (w * 0.92)
          const ay = (1 - t) * (1 - t) * (h * 0.68) + 2 * (1 - t) * t * (h * 0.03) + t * t * (h * 0.68)
          draw3DBalloon(ax, ay, w * 0.034, balloonColors[Math.floor(t * 12) % balloonColors.length])
        }
      }

      // Royal Columns / Pillars
      if (variation === 'royal') {
        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.45)'
        ctx.shadowBlur = 10
        
        ctx.fillStyle = '#D97706'
        ctx.fillRect(w * 0.12, h * 0.45, w * 0.032, h * 0.35)
        ctx.fillStyle = '#FEF3C7'
        ctx.fillRect(w * 0.115, h * 0.44, w * 0.042, 6)
        
        ctx.fillStyle = '#D97706'
        ctx.fillRect(w * 0.85, h * 0.45, w * 0.032, h * 0.35)
        ctx.fillStyle = '#FEF3C7'
        ctx.fillRect(w * 0.845, h * 0.44, w * 0.042, 6)
        
        ctx.restore()
      }

      // 5. Hanging warm fairy lights with glowing cores (Screen Blended)
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      let lightPositions = [w * 0.28, w * 0.38, w * 0.48, w * 0.58, w * 0.68, w * 0.72]
      if (variation === 'budget') {
        lightPositions = [w * 0.38, w * 0.50, w * 0.62]
      } else if (variation === 'premium' || variation === 'luxury' || variation === 'royal') {
        lightPositions = [w * 0.24, w * 0.31, w * 0.38, w * 0.45, w * 0.52, w * 0.59, w * 0.66, w * 0.73, w * 0.78]
      }
      
      lightPositions.forEach(sx => {
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(sx, by)
        ctx.lineTo(sx, by + backH)
        ctx.stroke()
        
        const bulbs = variation === 'budget' ? 5 : 8
        for (let k = 0; k < bulbs; k++) {
          const ly = by + (backH / (bulbs + 1)) * (k + 1)
          
          const halo = ctx.createRadialGradient(sx, ly, 1, sx, ly, 15)
          halo.addColorStop(0, 'rgba(255, 235, 170, 0.95)')
          halo.addColorStop(0.2, 'rgba(255, 190, 80, 0.45)')
          halo.addColorStop(1, 'rgba(255, 190, 80, 0)')
          ctx.fillStyle = halo
          ctx.beginPath(); ctx.arc(sx, ly, 15, 0, Math.PI * 2); ctx.fill()
          
          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath(); ctx.arc(sx, ly, 2.5, 0, Math.PI * 2); ctx.fill()
        }
      })
      ctx.restore()
      
      // 6. Theme banner string hanging in center
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur = 8
      const bannerY = h * 0.24
      const chars = bannerText.length
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(bx - 10, bannerY - 10)
      ctx.quadraticCurveTo(w * 0.5, bannerY + 20, bx + backW + 10, bannerY - 10)
      ctx.stroke()
      
      for (let i = 0; i < chars; i++) {
        const t = i / (chars - 1)
        const fx = (bx - 5) + t * (backW + 10)
        const fy = (1 - t) * (1 - t) * (bannerY - 10) + 2 * (1 - t) * t * (bannerY + 20) + t * t * (bannerY - 10)
        
        ctx.fillStyle = i % 2 === 0 ? mainColor : secondaryColor
        ctx.beginPath()
        ctx.moveTo(fx - 10, fy)
        ctx.lineTo(fx + 10, fy)
        ctx.lineTo(fx + 10, fy + 25)
        ctx.lineTo(fx, fy + 18)
        ctx.lineTo(fx - 10, fy + 25)
        ctx.closePath()
        ctx.fill()
        
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 12px Outfit, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(bannerText[i], fx, fy + 14)
      }
      ctx.restore()
      
      // 7. Cake table at bottom center
      ctx.save()
      const tableW = w * 0.34
      const tableH = h * 0.19
      const tx = w * 0.5 - tableW / 2
      const ty = h * 0.75
      
      ctx.shadowColor = 'rgba(0,0,0,0.55)'
      ctx.shadowBlur = 15
      
      ctx.fillStyle = activeTheme.tableCloth || '#6D28D9'
      ctx.beginPath()
      ctx.ellipse(w * 0.5, ty, tableW / 2, 12, 0, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = activeTheme.tableSkirt || '#5B21B6'
      ctx.fillRect(tx, ty, tableW, tableH)
      
      ctx.shadowBlur = 0
      const foldsCount = variation === 'budget' ? 6 : 12
      const foldWidth = tableW / foldsCount
      for (let i = 0; i < foldsCount; i++) {
        const sx = tx + i * foldWidth
        const skirtGrad = ctx.createLinearGradient(sx, ty, sx + foldWidth, ty)
        skirtGrad.addColorStop(0, 'rgba(0,0,0,0.28)')
        skirtGrad.addColorStop(0.5, 'rgba(255,255,255,0.06)')
        skirtGrad.addColorStop(1, 'rgba(0,0,0,0.28)')
        ctx.fillStyle = skirtGrad
        ctx.fillRect(sx, ty, foldWidth, tableH)
      }
      ctx.restore()
      
      // 8. 3D frosted cake on table
      ctx.save()
      const cakeX = w * 0.5
      const cakeY = ty - 8
      
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = 6
      ctx.fillStyle = '#F1F5F9'
      ctx.fillRect(cakeX - 26, cakeY, 52, 4)
      
      const cakeGrad = ctx.createLinearGradient(cakeX - 22, cakeY - 20, cakeX + 22, cakeY - 20)
      cakeGrad.addColorStop(0, '#581C87')
      cakeGrad.addColorStop(0.4, activeTheme.cakeColor || '#EC4899')
      cakeGrad.addColorStop(1, '#581C87')
      ctx.fillStyle = cakeGrad
      
      if (variation === 'luxury' || variation === 'royal') {
        ctx.fillRect(cakeX - 22, cakeY - 14, 44, 10)
        ctx.fillRect(cakeX - 16, cakeY - 24, 32, 10)
        ctx.fillRect(cakeX - 10, cakeY - 34, 20, 10)
        
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(cakeX - 22, cakeY - 16, 44, 2)
        ctx.fillRect(cakeX - 16, cakeY - 26, 32, 2)
        ctx.fillRect(cakeX - 10, cakeY - 36, 20, 2)
      } else {
        ctx.fillRect(cakeX - 22, cakeY - 20, 44, 16)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(cakeX - 22, cakeY - 22, 44, 3)
      }
      
      ctx.fillStyle = '#F59E0B'
      const candleOffset = variation === 'luxury' || variation === 'royal' ? 34 : 20
      ctx.fillRect(cakeX - 6, cakeY - candleOffset - 12, 2.5, 10)
      ctx.fillRect(cakeX + 6, cakeY - candleOffset - 12, 2.5, 10)
      
      ctx.shadowColor = 'rgba(255, 180, 50, 0.9)'
      ctx.shadowBlur = 10
      ctx.fillStyle = '#F59E0B'
      ctx.beginPath()
      ctx.ellipse(cakeX - 5, cakeY - candleOffset - 15, 3.5, 5, 0, 0, Math.PI * 2)
      ctx.ellipse(cakeX + 7, cakeY - candleOffset - 15, 3.5, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      
      // 9. Scatter background sparkles
      if (variation !== 'budget') {
        ctx.save()
        ctx.shadowColor = 'rgba(255,230,120,0.85)'
        ctx.shadowBlur = 12
        ctx.fillStyle = 'rgba(255,240,160,0.95)'
        const sparkleCount = variation === 'classic' ? 22 : (variation === 'premium' ? 35 : 55)
        for (let i = 0; i < sparkleCount; i++) {
          const sx = bx + Math.random() * backW
          const sy = by + Math.random() * backH
          ctx.beginPath()
          ctx.moveTo(sx, sy - 8)
          ctx.lineTo(sx + 3, sy - 2)
          ctx.lineTo(sx + 8, sy)
          ctx.lineTo(sx + 3, sy + 2)
          ctx.lineTo(sx, sy + 8)
          ctx.lineTo(sx - 3, sy + 2)
          ctx.lineTo(sx - 8, sy)
          ctx.lineTo(sx - 3, sy - 2)
          ctx.closePath()
          ctx.fill()
        }
        ctx.restore()
      }
      
      // 10. Floating party confetti
      if (variation !== 'budget') {
        ctx.save()
        const colors = ['#EC4899', '#3B82F6', '#F59E0B', '#10B981', '#A78BFA', '#F43F5E']
        const confettiCount = variation === 'classic' ? 65 : (variation === 'premium' ? 100 : 150)
        for (let i = 0; i < confettiCount; i++) {
          const cx = Math.random() * w
          const cy = Math.random() * h * 0.74
          const cw = Math.random() * 9 + 4
          const ch = Math.random() * 4 + 2
          
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate(Math.random() * Math.PI)
          ctx.fillRect(-cw/2, -ch/2, cw, ch)
          ctx.restore()
        }
        ctx.restore()
      }
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      callback(dataUrl)
    }
    img.src = originalDataUrl
  }

  const processRoomDecoration = (file, themeKey) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const originalDataUrl = event.target.result
      
      drawDecorationOnCanvas(originalDataUrl, themeKey, 45, '', 'classic', (decoratedDataUrl) => {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: 'I have finished setting up your room preview! Drag the before/after slider to compare, and customize parameters below:',
            originalRoomImage: originalDataUrl,
            decoratedImage: decoratedDataUrl,
            themeKey: themeKey,
            glowIntensity: 45,
            bannerText: '',
            variation: 'classic',
            sliderPos: 50
          }
        ])
        setDecorating(false)
      })
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateDecorationParam = (idx, paramName, paramValue) => {
    setMessages(prev => {
      const updated = [...prev]
      const target = { ...updated[idx] }
      target[paramName] = paramValue
      updated[idx] = target
      
      drawDecorationOnCanvas(
        target.originalRoomImage,
        target.themeKey,
        target.glowIntensity,
        target.bannerText,
        target.variation || 'classic',
        (newDataUrl) => {
          setMessages(current => {
            const currentUpdated = [...current]
            currentUpdated[idx] = {
              ...currentUpdated[idx],
              decoratedImage: newDataUrl,
              themeKey: target.themeKey,
              glowIntensity: target.glowIntensity,
              bannerText: target.bannerText,
              variation: target.variation || 'classic'
            }
            return currentUpdated
          })
        }
      )
      
      return updated
    })
  }

  const handleUpdateSliderPos = (idx, pos) => {
    setMessages(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], sliderPos: pos }
      return updated
    })
  }

  const handleApplyDecoration = (msg) => {
    const targetTheme = activeCatalogThemes.find(t => t.slug === msg.themeKey || t.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(msg.themeKey));
    
    // Scale price based on variation
    let basePrice = targetTheme?.price || 1500
    if (msg.variation === 'budget') basePrice = Math.floor(basePrice * 0.75)
    if (msg.variation === 'premium') basePrice = Math.floor(basePrice * 1.25)
    if (msg.variation === 'luxury') basePrice = Math.floor(basePrice * 1.6)
    if (msg.variation === 'royal') basePrice = Math.floor(basePrice * 2.0)

    const finalTheme = {
      ...(targetTheme || {}),
      name: `${targetTheme?.name || themeParams[msg.themeKey]?.name || 'Custom Theme'} (${msg.variation?.toUpperCase() || 'CLASSIC'})`,
      price: basePrice,
      images: [msg.decoratedImage]
    }

    updateBooking({
      theme: finalTheme,
      customBannerText: msg.bannerText || '',
      customGlowIntensity: msg.glowIntensity || 45,
      variation: msg.variation || 'classic',
      roomPreviewImage: msg.decoratedImage
    })

    toast.success('Decoration setup saved for your booking!')
    setMessages(prev => [...prev, { sender: 'bot', text: `Awesome! Your customized decoration preferences (**Theme**: ${msg.themeKey.toUpperCase()} - ${msg.variation?.toUpperCase() || 'CLASSIC'}, **Banner**: "${msg.bannerText || 'Default'}", **Ambient Glow**: ${msg.glowIntensity}%) have been linked to your booking context. Let's continue checking dates and checkout details whenever you are ready!` }])
  }
  return (
    <>
      {/* Floating Chat Button */}
      <button className={`chatbot-btn ${isOpen ? 'active animate-pulse' : ''}`} onClick={() => setIsOpen(!isOpen)} aria-label="Open AI Assistant">
        <span className="chatbot-btn__icon">🤖</span>
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className={`chatbot-window ${isMinimized ? 'minimized' : ''} animate-fade-in`}>
          {/* Header */}
          <header className="chatbot-header">
            <div className="chatbot-header__info">
              <span className="chatbot-header__avatar">🤖</span>
              <div>
                <h4>SurpriseNest AI</h4>
                <p>Celebration Planner</p>
              </div>
            </div>
            <div className="chatbot-header__actions">
              <button className="chatbot-header__btn" onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? "Restore" : "Minimize"}>
                {isMinimized ? '🗖' : '🗕'}
              </button>
              <button className="chatbot-header__btn" onClick={() => setIsOpen(false)} title="Close">
                ✕
              </button>
            </div>
          </header>

          {/* Chat Body */}
          {!isMinimized && (
            <>
              <div className="chatbot-body">
                {messages.map((m, idx) => (
                  <div key={idx} className={`chat-bubble-wrapper ${m.sender === 'user' ? 'user' : 'bot'}`}>
                    {m.sender === 'bot' && <span className="chat-avatar">🤖</span>}
                    <div className="chat-bubble animate-scale-up">
                      {/* Standard text messages */}
                      {m.text && <p dangerouslySetInnerHTML={{ __html: formatText(m.text) }} />}

                      {/* Display user uploaded preview inside user bubble */}
                      {m.imageUpload && (
                        <div className="user-uploaded-preview" style={{marginTop:'8px', borderRadius:'8px', overflow:'hidden', maxWidth:'180px'}}>
                          <img src={m.imageUpload} alt="Uploaded room preview" style={{width:'100%', display:'block', height:'auto'}} />
                        </div>
                      )}

                      {/* Display Product Recommendations */}
                      {m.recommendations && m.recommendations.length > 0 && (
                        <div className="bot-recommendations flex gap-sm">
                          {m.recommendations.map((prod, pIdx) => (
                            <div key={pIdx} className="recommendation-card card">
                              <img
                                src={prod.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(prod.name)}&background=7C3AED&color=fff`}
                                alt={prod.name}
                                className="recommendation-card__img"
                              />
                              <div className="recommendation-card__body">
                                <h5>{prod.name}</h5>
                                <div className="recommendation-card__price">₹{prod.price}</div>
                                <p className="recommendation-card__reason">{prod.reason}</p>
                                <button className="btn btn-primary btn-sm w-full" onClick={() => handleAddToCart(prod)}>
                                  + Add to Cart
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Display Card/Greeting details */}
                      {m.messageDetails && (
                        <div className="bot-message-generator-card card">
                          <div className="card-header-badge">
                            🏷️ {m.messageDetails.tone} • {m.messageDetails.type}
                          </div>
                          <div className="message-content-text">
                            "{m.messageDetails.generatedText}"
                          </div>
                          {regenerateInputIdx === idx ? (
                            <form className="flex gap-xs w-full" style={{marginTop:'8px'}} onSubmit={async (e) => {
                              e.preventDefault()
                              const feedback = e.target.feedbackText.value.trim()
                              if (!feedback) return
                              setRegenerateInputIdx(null)
                              
                              setMessages(prev => [...prev, { sender: 'user', text: `Regenerate with adjustments: ${feedback}` }])
                              setLoading(true)
                              
                              try {
                                const history = messages.slice(0, idx + 1).map(m => ({
                                  role: m.sender === 'user' ? 'user' : 'model',
                                  content: m.text || (m.messageDetails?.generatedText || '')
                                }))
                                
                                const response = await sendChatRequest(`Regenerate with adjustments: ${feedback}`, history)
                                const data = response.data
                                if (data.success) {
                                  setMessages(prev => [
                                    ...prev,
                                    {
                                      sender: 'bot',
                                      text: data.reply,
                                      recommendations: data.recommendations,
                                      messageDetails: data.messageDetails
                                    }
                                  ])
                                } else {
                                  throw new Error()
                                }
                              } catch (err) {
                                toast.error('Failed to regenerate.')
                              } finally {
                                setLoading(false)
                              }
                            }}>
                              <input type="text" name="feedbackText" placeholder="e.g. Make it shorter, in Hindi, more emotional..." className="form-input flex-1" style={{padding:'4px 8px', fontSize:'12px'}} autoFocus />
                              <button type="submit" className="btn btn-primary btn-sm">Submit</button>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRegenerateInputIdx(null)}>Cancel</button>
                            </form>
                          ) : (
                            <div className="message-actions flex gap-xs">
                              <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(m.messageDetails.generatedText)}>
                                📋 Copy
                              </button>
                              <button className="btn btn-secondary btn-sm" onClick={() => downloadTextFile(m.messageDetails.generatedText, m.messageDetails.type)}>
                                💾 Download
                              </button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setRegenerateInputIdx(idx)}>
                                🔄 Adjust / Regenerate
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Display Realistic Room Decoration Customizer */}
                      {m.decoratedImage && (
                        <div className="bot-decoration-preview card animate-scale-up">
                          <div className="preview-container" style={{ position: 'relative' }}>
                            <SliderPreview 
                              original={m.originalRoomImage} 
                              decorated={m.decoratedImage} 
                              sliderPos={m.sliderPos || 50} 
                              onChangeSliderPos={(pos) => handleUpdateSliderPos(idx, pos)} 
                            />
                            <div className="preview-badge" style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(124, 58, 237, 0.85)',
                              color: '#FFF',
                              fontSize: '10px',
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: '20px',
                              backdropFilter: 'blur(4px)',
                              pointerEvents: 'none'
                            }}>
                              ✨ Slide to Compare Before/After
                            </div>
                          </div>
                          
                          {/* Controls Panel */}
                          <div className="customizer-panel" style={{
                            marginTop: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(124, 58, 237, 0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            {/* Theme Selector */}
                            <div className="control-group flex items-center justify-between" style={{ gap: '10px' }}>
                              <label style={{ fontSize: '11px', color: '#A78BFA', fontWeight: '500' }}>Theme Style:</label>
                              <select 
                                value={m.themeKey || 'default'} 
                                onChange={(e) => handleUpdateDecorationParam(idx, 'themeKey', e.target.value)}
                                style={{
                                  background: '#0F0A20',
                                  border: '1px solid rgba(124, 58, 237, 0.4)',
                                  color: '#E2E8F0',
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  outline: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="princess">Pink Princess</option>
                                <option value="blackgold">Black & Gold</option>
                                <option value="galaxy">Blue Galaxy</option>
                                <option value="love">Red Love</option>
                                <option value="harrypotter">Harry Potter</option>
                                <option value="marvel">Marvel Universe</option>
                                <option value="barbie">Barbie Dreamland</option>
                                <option value="bts">BTS Army</option>
                                <option value="anime">Anime Night</option>
                                <option value="farewell">Golden Farewell</option>
                                <option value="default">Standard Rainbow</option>
                              </select>
                            </div>

                            {/* Variation Selector */}
                            <div className="control-group flex items-center justify-between" style={{ gap: '10px' }}>
                              <label style={{ fontSize: '11px', color: '#A78BFA', fontWeight: '500' }}>Package Variation:</label>
                              <select 
                                value={m.variation || 'classic'} 
                                onChange={(e) => handleUpdateDecorationParam(idx, 'variation', e.target.value)}
                                style={{
                                  background: '#0F0A20',
                                  border: '1px solid rgba(124, 58, 237, 0.4)',
                                  color: '#E2E8F0',
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  outline: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="budget">Budget-Friendly (75% cost)</option>
                                <option value="classic">Classic (100% cost)</option>
                                <option value="premium">Premium (125% cost)</option>
                                <option value="luxury">Luxury (160% cost)</option>
                                <option value="royal">Royal Edition (200% cost)</option>
                              </select>
                            </div>

                            {/* Banner Text Input */}
                            <div className="control-group flex flex-col" style={{ gap: '4px' }}>
                              <label style={{ fontSize: '11px', color: '#A78BFA', fontWeight: '500' }}>Custom Banner Text:</label>
                              <input 
                                type="text"
                                placeholder={m.themeKey ? `Default: ${themeParams[m.themeKey]?.defaultBanner}` : 'CONGRATULATIONS'}
                                value={m.bannerText || ''}
                                onChange={(e) => handleUpdateDecorationParam(idx, 'bannerText', e.target.value)}
                                style={{
                                  background: '#0F0A20',
                                  border: '1px solid rgba(124, 58, 237, 0.4)',
                                  color: '#E2E8F0',
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  width: '100%',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            {/* Glow Intensity Slider */}
                            <div className="control-group flex flex-col" style={{ gap: '2px' }}>
                              <div className="flex justify-between" style={{ fontSize: '11px' }}>
                                <span style={{ color: '#A78BFA', fontWeight: '500' }}>Ambient Glow:</span>
                                <span style={{ color: '#EC4899', fontWeight: '700' }}>{m.glowIntensity || 45}%</span>
                              </div>
                              <input 
                                type="range"
                                min="0"
                                max="100"
                                value={m.glowIntensity || 45}
                                onChange={(e) => handleUpdateDecorationParam(idx, 'glowIntensity', parseInt(e.target.value))}
                                style={{
                                  width: '100%',
                                  height: '4px',
                                  borderRadius: '2px',
                                  background: 'rgba(124, 58, 237, 0.3)',
                                  outline: 'none',
                                  cursor: 'pointer',
                                  accentColor: '#EC4899'
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-sm w-full" style={{marginTop:'12px'}}>
                            <button className="btn btn-primary btn-sm flex-1" onClick={() => handleApplyDecoration(m)}>
                              👍 Confirm & Save Setup
                            </button>
                            <button className="btn btn-secondary btn-sm flex-1" onClick={() => {
                              toast.error('Setup cancelled');
                              setMessages(prev => prev.filter((_, i) => i !== idx));
                            }}>
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      )
                    }

                      {/* Unified Message Customizer Builder Form */}
                      {m.isMessageBuilderForm && (
                        <form className="message-builder-form card animate-scale-up" style={{
                          marginTop: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          padding: '12px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(124, 58, 237, 0.25)',
                          borderRadius: '8px',
                          maxWidth: '310px',
                          width: '100%'
                        }} onSubmit={(e) => {
                          e.preventDefault()
                          const params = {
                            occasion: e.target.occasion.value,
                            tone: e.target.tone.value,
                            lengthMode: e.target.lengthMode.value,
                            relationship: e.target.relationship.value,
                            recipient: e.target.recipient.value.trim(),
                            customDetails: e.target.customDetails.value.trim()
                          }
                          setMessages(prev => prev.filter((_, i) => i !== idx))
                          handleMessageBuilderSubmit(params)
                        }}>
                          <div className="flex justify-between items-center" style={{borderBottom:'1px solid rgba(124, 58, 237, 0.2)', paddingBottom:'6px'}}>
                            <h5 style={{margin:0, color:'#A78BFA', fontSize:'13px', fontWeight:'600'}}>✍️ Message Writer AI</h5>
                            <span style={{fontSize:'10px', color:'#EC4899', fontWeight:'700'}}>Customizer</span>
                          </div>

                          <div className="form-group flex flex-col" style={{gap:'2px'}}>
                            <label style={{fontSize:'10px', color:'#94A3B8'}}>Occasion:</label>
                            <select name="occasion" className="form-input" style={{padding:'4px 6px', fontSize:'11px', background:'#0F0A20', border:'1px solid rgba(124, 58, 237, 0.4)', color:'#FFF', borderRadius:'4px'}}>
                              {['Birthday', 'Anniversary', 'Wedding', 'Engagement', 'Baby Shower', 'Naming Ceremony', 'Housewarming', 'Graduation', 'Farewell', 'Corporate Events', 'Valentine\'s Day', 'Mother\'s Day', 'Father\'s Day', 'Friendship Day', 'Teacher\'s Day', 'Congratulations', 'Thank You', 'Apology', 'Invitation', 'Welcome'].map(o => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex gap-xs w-full">
                            <div className="form-group flex-1 flex flex-col" style={{gap:'2px'}}>
                              <label style={{fontSize:'10px', color:'#94A3B8'}}>Tone:</label>
                              <select name="tone" className="form-input" style={{padding:'4px 6px', fontSize:'11px', background:'#0F0A20', border:'1px solid rgba(124, 58, 237, 0.4)', color:'#FFF', borderRadius:'4px'}}>
                                {['Heartfelt', 'Emotional', 'Funny', 'Romantic', 'Poetic', 'Luxury', 'Cute', 'Formal', 'Friendly', 'Inspirational'].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>

                            <div className="form-group flex-1 flex flex-col" style={{gap:'2px'}}>
                              <label style={{fontSize:'10px', color:'#94A3B8'}}>Length:</label>
                              <select name="lengthMode" className="form-input" style={{padding:'4px 6px', fontSize:'11px', background:'#0F0A20', border:'1px solid rgba(124, 58, 237, 0.4)', color:'#FFF', borderRadius:'4px'}}>
                                <option value="Tiny">Tiny (5-10 words)</option>
                                <option value="Short">Short (2-4 lines)</option>
                                <option value="Medium">Medium (5-8 lines)</option>
                                <option value="Long">Long (Heartfelt Letter)</option>
                                <option value="Speech">Speech (30-60s)</option>
                                <option value="Premium Letter">Premium Full Letter</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-xs w-full">
                            <div className="form-group flex-1 flex flex-col" style={{gap:'2px'}}>
                              <label style={{fontSize:'10px', color:'#94A3B8'}}>Relationship:</label>
                              <select name="relationship" className="form-input" style={{padding:'4px 6px', fontSize:'11px', background:'#0F0A20', border:'1px solid rgba(124, 58, 237, 0.4)', color:'#FFF', borderRadius:'4px'}}>
                                {['Friend', 'Partner/Spouse', 'Mother', 'Father', 'Colleague', 'Boss', 'Teacher', 'Kids', 'Grandparents', 'Other'].map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </div>

                            <div className="form-group flex-1 flex flex-col" style={{gap:'2px'}}>
                              <label style={{fontSize:'10px', color:'#94A3B8'}}>Recipient Name:</label>
                              <input type="text" name="recipient" placeholder="e.g. Varsh" className="form-input" style={{padding:'3px 6px', fontSize:'11px', background:'#0F0A20', border:'1px solid rgba(124, 58, 237, 0.4)', color:'#FFF', borderRadius:'4px'}} />
                            </div>
                          </div>

                          <div className="form-group flex flex-col" style={{gap:'2px'}}>
                            <label style={{fontSize:'10px', color:'#94A3B8'}}>Personal details / Memories:</label>
                            <textarea name="customDetails" placeholder="e.g. 'our late night hostel tea sessions', 'age 21'..." rows="2" className="form-input" style={{padding:'4px 6px', fontSize:'11px', background:'#0F0A20', border:'1px solid rgba(124, 58, 237, 0.4)', color:'#FFF', borderRadius:'4px', resize:'none'}} />
                          </div>

                          <div className="flex gap-xs w-full" style={{marginTop:'4px'}}>
                            <button type="submit" className="btn btn-primary btn-sm flex-1">✨ Write Message</button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMessages(prev => prev.filter((_, i) => i !== idx))}>Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                ))}

                {/* Decorating preview loader */}
                {decorating && (
                  <div className="chat-bubble-wrapper bot">
                    <span className="chat-avatar">🤖</span>
                    <div className="chat-bubble card flex flex-col items-center justify-center" style={{padding:'20px', minWidth:'220px'}}>
                      <div className="spinner" />
                      <p style={{marginTop:'10px', fontSize:'13px', color:'var(--text-muted)', textAlign:'center'}}>
                        {decoratingStep}
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading response dots */}
                {loading && (
                  <div className="chat-bubble-wrapper bot">
                    <span className="chat-avatar">🤖</span>
                    <div className="chat-bubble-loader animate-pulse">
                      <span>•</span><span>•</span><span>•</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Footer */}
              <footer className="chatbot-footer">
                {/* Pending Image Upload Thumbnail Preview */}
                {pendingImagePreview && (
                  <div className="chatbot-image-preview-thumbnail" style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    gap: '10px'
                  }}>
                    <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden' }}>
                      <img src={pendingImagePreview} alt="Pending upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Room image ready to decorate</p>
                      <p style={{ fontSize: '12px', fontWeight: '500', margin: 0 }}>{pendingImage ? pendingImage.name : 'image.jpg'}</p>
                    </div>
                    <button type="button" onClick={() => { setPendingImage(null); setPendingImagePreview(''); }} style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: '#FFF',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px'
                    }}>✕</button>
                  </div>
                )}

                {/* Floating quick actions */}
                <div className="chatbot-quick-actions flex gap-xs">
                  <button className="btn btn-secondary btn-xs" onClick={startMessageGenerator}>
                    ✍️ Greeting Card
                  </button>
                  <button className="btn btn-secondary btn-xs" onClick={triggerImageUpload}>
                    📸 Room Preview
                  </button>
                  <button className="btn btn-secondary btn-xs" onClick={() => setInput('Track my latest order')}>
                    🚴 Track Order
                  </button>
                </div>

                <form className="chatbot-input-wrap flex gap-xs" onSubmit={handleSend}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  
                  <button type="button" className="chatbot-input-btn upload" onClick={triggerImageUpload} title="Upload Room Photo">
                    📸
                  </button>
                  
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={pendingImage ? "Type a decoration theme (e.g. BTS, Princess) or hit send..." : "Type a message or ask something..."}
                    className="chatbot-input"
                  />
                  
                  <button type="submit" className="chatbot-input-btn send" disabled={(!input.trim() && !pendingImage) || loading}>
                    ➔
                  </button>
                </form>
              </footer>
            </>
          )}
        </div>
      )}
    </>
  )
}
