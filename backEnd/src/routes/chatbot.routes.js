const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Theme = require('../models/Theme');
const AddOn = require('../models/AddOn');
const Order = require('../models/Order');
const User = require('../models/User');

// Optional auth middleware
const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};

router.post('/chat', optionalProtect, async (req, res) => {
  try {
    const { message, history, messageDetails: clientMessageDetails } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    // Fetch available products for context
    const [themes, addons] = await Promise.all([
      Theme.find({ isActive: true }),
      AddOn.find({ isActive: true })
    ]);

    const themesContext = themes.map(t => `- [Theme] Name: "${t.name}", ID: "${t._id}", Price: ₹${t.price}, Occasions: [${t.occasions?.join(', ')}], Color: "${t.color || '#7C3AED'}"`).join('\n');
    const addonsContext = addons.map(a => `- [Add-On] Name: "${a.name}", ID: "${a._id}", Price: ₹${a.price}`).join('\n');

    let orderContext = null;
    const orderIdMatch = message.match(/SN[A-Z0-9]+/i);
    
    if (orderIdMatch) {
      const matchedId = orderIdMatch[0].toUpperCase();
      const order = await Order.findOne({ orderId: matchedId })
        .populate('theme')
        .populate('deliveryPartner', 'name phone');
      if (order) {
        orderContext = order;
      }
    } else if (req.user && (message.toLowerCase().includes('track') || message.toLowerCase().includes('status'))) {
      const latestOrder = await Order.findOne({ user: req.user._id })
        .populate('theme')
        .populate('deliveryPartner', 'name phone')
        .sort({ createdAt: -1 });
      if (latestOrder) {
        orderContext = latestOrder;
      }
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

        // Determine which specialized agent prompt to load
        let agentPrompt = "";
        const lowerMsg = message.toLowerCase();

        // 1. Message Writer AI Agent
        if (clientMessageDetails || lowerMsg.includes('message') || lowerMsg.includes('wish') || lowerMsg.includes('letter') || lowerMsg.includes('speech') || lowerMsg.includes('caption') || lowerMsg.includes('generator') || lowerMsg.includes('regenerate with adjustments')) {
          const detail = clientMessageDetails || {};
          agentPrompt = `You are "Message Writer AI", the specialized Agent of Celebration AI. You write wishes, invitations, speeches, captions, and premium letters.
You connect deeply, write with emotional storytelling, and sound like a handwritten letter.

USER REQUIREMENT DETAILS:
- Occasion: ${detail.occasion || 'Birthday'}
- Tone: ${detail.tone || 'Heartfelt'}
- Length Mode: ${detail.lengthMode || 'Short'}
- Relationship: ${detail.relationship || 'Friend'}
- Recipient Name: ${detail.recipient || 'N/A'}
- Personal Details/Memories: ${detail.customDetails || 'N/A'}

LENGTH MODES GUIDELINES:
- Tiny Message: 5-10 words. Concise and impactful.
- Short Message: 2-4 lines. Perfect for tags, WhatsApp, or Instagram.
- Medium Message: 5-8 lines. Natural, emotional flow.
- Long Message: 10-15 lines. Storytelling, feels like a handwritten letter.
- Speech: 30-60 seconds. Elegant, suited for a stage announcement or speech.
- Premium Letter: A full-page beautiful letter with high-end, touchy vocabulary.

TONES & EMOTIONS:
- Formal, Friendly, Emotional, Romantic, Poetic, Luxury, Funny, Cute, Inspirational.
- Never write robotic templates. Do not say "Oops", "Sorry", or "I can't".
- If the user regenerates or adjust, look at history and rewrite a COMPLETELY unique wish with a different opening, middle, and vocabulary. Zero repeated sentences.

JSON Output Schema:
{
  "reply": "Here is your generated message:",
  "intent": "message_generator",
  "messageDetails": {
    "type": "${detail.occasion || 'Birthday'}",
    "tone": "${detail.tone || 'Heartfelt'}",
    "recipient": "${detail.recipient || ''}",
    "generatedText": "personalized message text goes here"
  }
}`;
        }
        // 2. Room Preview AI Agent
        else if (lowerMsg.includes('uploaded my room') || lowerMsg.includes('decorate my room') || lowerMsg.includes('room photo') || lowerMsg.includes('room image')) {
          agentPrompt = `You are "Room Preview AI", the specialized Agent of Celebration AI. You generate stable diffusion room transformation prompts.
Rule: Preserves the room's walls, windows, floor, doors, furniture, and TV unit completely, only adding realistic theme decorations.
Create a prompt like: "Keep the uploaded room exactly the same. Do not change walls, windows, furniture, flooring or ceiling. Transform it into a [theme variation] setup using [theme specific decorations]... Everything should look professionally decorated with realistic shadows, natural lighting, accurate perspective and photo-realistic quality."

JSON Output Schema:
{
  "reply": "Here is the realistic room transformation prompt: [insert prompt]",
  "intent": "chat"
}`;
        }
        // 3. Decoration Planner AI Agent
        else {
          let trackingContext = 'No specific order context available. Ask the user for their Order ID (starting with "SN") if they want to track an order.';
          if (orderContext) {
            trackingContext = `Order ID: "${orderContext.orderId}", Occasion: "${orderContext.occasion}", Status: "${orderContext.status}", Theme: "${orderContext.themeName || orderContext.theme?.name || 'N/A'}"`;
          }

          agentPrompt = `You are "Decoration Planner AI", the specialized Agent of Celebration AI. You recommend themes, colors, layouts, packages (Classic, Premium, Luxury, Royal, Budget-friendly), and add-ons.
Never reply with "Oops", "Sorry", or "I can't". If something is wrong, suggest alternatives.

Available Themes:
${themesContext}

Available Add-ons:
${addonsContext}

${trackingContext}

POLICIES:
- Refund/Cancellation: 100% refund if cancelled 24+ hours before delivery slot. Non-refundable within 24 hours.
- Delivery Slot: Background-verified partners complete the setup in under 30 minutes inside/outside the hostel room.

JSON Output Schema:
{
  "reply": "conversational markdown message text",
  "intent": "chat" | "recommend" | "track_order",
  "recommendations": [
    {
      "type": "theme" | "addon",
      "id": "mongo-id-here",
      "name": "name-here",
      "price": 123,
      "reason": "explanation why this is recommended"
    }
  ]
}`;
        }

        const contents = [];
        if (history && history.length > 0) {
          history.slice(-10).forEach(h => {
            contents.push({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }]
            });
          });
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: agentPrompt }]
            },
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          let jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            let cleanedText = jsonText.trim();
            if (cleanedText.startsWith('```json')) {
              cleanedText = cleanedText.substring(7);
            } else if (cleanedText.startsWith('```')) {
              cleanedText = cleanedText.substring(3);
            }
            if (cleanedText.endsWith('```')) {
              cleanedText = cleanedText.substring(0, cleanedText.length - 3);
            }
            cleanedText = cleanedText.trim();

            const parsed = JSON.parse(cleanedText);
            return res.json({ success: true, ...parsed });
          }
        }
      } catch (geminiErr) {
        console.error('[Gemini Agents Pipeline Exception]:', geminiErr.message);
      }
    }

    // --- Rule-based Fallback Pipeline ---
    const lower = message.toLowerCase();
    let reply = "I am Celebration AI! Tell me about the theme, budget, occasion (Birthday, Baby Shower, Wedding, etc.) you want to organize, and I will recommend decorations or write greeting cards.";
    let intent = "chat";
    const recommendations = [];
    let messageDetails = null;

    if (orderContext) {
      intent = "track_order";
      const statusLabels = {
        placed: 'Placed & Pending Confirmation ⏳',
        confirmed: 'Confirmed & Preparing 🎈',
        packed: 'Packed 📦',
        out_for_delivery: 'Out for Delivery 🚴',
        delivered: 'Delivered Successfully! 🥳✨',
        cancelled: 'Cancelled ❌',
      };
      
      const partnerStr = orderContext.deliveryPartner 
        ? `assigned to partner *${orderContext.deliveryPartner.name}* (Contact: ${orderContext.deliveryPartner.phone})`
        : 'being prepared at our depot';

      reply = `I located your order **${orderContext.orderId}**! Here is the tracking report:
- **Occasion:** ${orderContext.occasion}
- **Theme:** ${orderContext.themeName || 'Standard Decoration'}
- **Status:** ${statusLabels[orderContext.status] || orderContext.status}
- **Delivery Date:** ${new Date(orderContext.deliveryDate).toLocaleDateString('en-IN')}
- **Delivery Partner:** ${partnerStr}
- **Total Paid/Amount:** ₹${orderContext.amounts?.total || 0}`;
    } else if (lower.includes('track') || lower.includes('order id') || (lower.includes('sn') && lower.match(/sn[a-z0-9]+/i))) {
      intent = "track_order";
      reply = "I couldn't identify that order ID in your profile context. Let's make sure you are logged in. Could you verify your Order ID format? It should start with 'SN'.";
    }
    else if (lower.includes('cancel') || lower.includes('refund') || lower.includes('return')) {
      reply = `**SurpriseNest Booking & Cancellation Policies:**
- **Flexible Cancellations:** We offer a full 100% refund if you cancel **24 hours or more** before your scheduled setup slot.
- **Short-Notice Policy:** Inside 24 hours, bookings are non-refundable since fresh customized cakes, custom banners, and roses are prepared.
- If you need to make changes, we can easily help you reschedule to another day! Feel free to request a slot change in your dashboard.`;
    }
    else if (lower.includes('deliver') || lower.includes('setup') || lower.includes('how long') || lower.includes('time slot') || lower.includes('partner')) {
      reply = `**Our Professional Setup Process:**
- **Under 30 Minutes:** Our background-verified delivery stylists arrive at your chosen time slot and complete the entire setup inside or outside the room in under 30 minutes.
- **Coordination:** We coordinate directly with the hostel desk or security to ensure a smooth, surprise entry.
- **Fee:** Flat rate of **₹100** covers all local campus hostel deliveries.`;
    }
    else if (lower.includes('small') || lower.includes('large') || lower.includes('fan') || lower.includes('tv') || lower.includes('sofa') || lower.includes('ceiling')) {
      if (lower.includes('fan')) {
        reply = "For rooms with ceiling fans, we automatically arrange decorations safely along the walls and corners. We avoid floating ceiling balloons that could block the fan blades, maintaining absolute safety and a gorgeous look!";
      } else if (lower.includes('tv')) {
        reply = "For setups around TV units, we design a customized wrap-around balloon arch that frames the screen elegantly without blocking the view. This makes your TV perfect for showing memories or slideshows during the party!";
      } else if (lower.includes('sofa')) {
        reply = "A sofa makes an excellent central photo zone! We will arrange a cascading balloon arch that curves beautifully over the sofa, creating a comfortable and gorgeous backdrop for photography.";
      } else if (lower.includes('small') || lower.includes('ceiling')) {
        reply = "For smaller rooms or low ceilings, we avoid oversized high arches. Instead, we use elegant vertical balloon pillars and wall-draped backdrops. This maximizes floor space while giving a premium, cozy feel!";
      } else {
        reply = "For large venues, we expand the layout with double balloon clusters, secondary columns, and scattering party confetti to fill empty areas naturally for a grand impression.";
      }
    }
    else if (lower.includes('price') || lower.includes('cost') || lower.includes('cheap') || lower.includes('how much') || lower.includes('addon') || lower.includes('add-on') || lower.includes('budget') || lower.includes('₹') || lower.includes('rs')) {
      const budgetMatch = lower.match(/(\d+)/);
      const budget = budgetMatch ? parseInt(budgetMatch[0]) : null;

      if (budget) {
        intent = "recommend";
        let filteredThemes = themes.filter(t => t.price <= budget);
        const selectThemes = filteredThemes.slice(0, 2);
        
        selectThemes.forEach(t => {
          recommendations.push({
            type: 'theme',
            id: t._id,
            name: t.name,
            price: t.price,
            reason: `Fits perfectly in your budget of ₹${budget}.`,
            image: t.images?.[0] || ''
          });
        });

        reply = `For your budget of **₹${budget}**, I recommend choosing a ${selectThemes.map(t => `**${t.name}**`).join(' or ')} theme. We can adapt it into a budget-friendly variation to keep within your cost limit.`;
      } else {
        reply = `**SurpriseNest Pricing & Customization Guide:**
- **Decoration Themes:** Range from **₹1,299** (Blue Galaxy) to **₹1,999** (Harry Potter).
- **Theme Variations:** Every package is customizable into **Budget-friendly**, **Classic**, **Premium**, **Luxury**, and **Royal** variants.
- **Add-ons:** Custom Cakes (₹599), Flowers (₹349), Gift box (₹149), Handmade Cards (₹99), Bluetooth speaker (₹699).
What occasion and theme are you looking to plan? I can customize the package for you.`;
      }
    }
    else if (lower.includes('uploaded my room') || lower.includes('decorate my room') || lower.includes('room photo') || lower.includes('room image')) {
      let promptText = "Keep the uploaded room exactly the same. Do not change walls, windows, furniture, flooring or ceiling. Transform it into a luxury setup using metallic balloons, drapes, fairy lights, cake table, and premium props. Everything should look professionally decorated with realistic shadows, natural lighting, accurate perspective and photo-realistic quality.";
      
      if (lower.includes('bts') || lower.includes('purple')) {
        promptText = "Keep the uploaded room exactly the same. Do not change walls, windows, furniture, flooring or ceiling. Transform it into a premium BTS Army theme setup using purple metallic balloons, ARMY badges, fairy lights, purple drape backdrop, cake table, and sparkles. Everything should look professionally decorated with realistic shadows, natural lighting, accurate perspective and photo-realistic quality.";
      } else if (lower.includes('princess') || lower.includes('pink')) {
        promptText = "Keep the uploaded room exactly the same. Do not change walls, windows, furniture, flooring or ceiling. Transform it into a luxurious Pink Princess birthday setup using pastel pink balloons, rose gold balloon arch, teddy bear corner, princess backdrop, fresh roses, fairy lights, elegant cake table, crown decorations, balloon ceiling and premium entrance setup. Everything should look professionally decorated with realistic shadows, natural lighting, accurate perspective and photo-realistic quality.";
      } else if (lower.includes('galaxy') || lower.includes('space') || lower.includes('blue')) {
        promptText = "Keep the uploaded room exactly the same. Do not change walls, windows, furniture, flooring or ceiling. Transform it into a cosmic Space theme setup using galaxy backdrop, blue balloons, astronaut props, planets, stars, moon balloons, blue LED lighting, rocket decorations and premium cake table. Everything should look professionally decorated with realistic shadows, natural lighting, accurate perspective and photo-realistic quality.";
      } else if (lower.includes('black') || lower.includes('gold') || lower.includes('birthday')) {
        promptText = "Keep the uploaded room exactly the same. Do not change walls, windows, furniture, flooring or ceiling. Transform it into a luxury Black & Gold birthday setup using black chrome balloons, gold balloons, shimmer wall backdrop, warm fairy lights, golden foil curtains, premium cake table, luxury stage and elegant entrance. Everything should look professionally decorated with realistic shadows, natural lighting, accurate perspective and photo-realistic quality.";
      }

      reply = `Here is the realistic prompt I generated to transform your room photo while keeping its structure intact:

*"${promptText}"*`;
    }
    // Greeting Card Generation and RegenerationFallback
    else {
      const isRegenerate = lower.includes('regenerate') || lower.includes('try again') || lower.includes('rewrite') || lower.includes('change') || lower.includes('adjust') || lower.includes('different') || lower.includes('correct');
      const hasOccasion = lower.includes('birthday') || lower.includes('anniversary') || lower.includes('friendship') || lower.includes('farewell') || lower.includes('proposal') || lower.includes('wedding') || lower.includes('engagement') || lower.includes('baby shower') || lower.includes('housewarming') || lower.includes('graduation') || lower.includes('corporate') || lower.includes('valentine') || lower.includes('naming');
      const isMessageRequest = lower.includes('message') || lower.includes('wish') || lower.includes('write') || lower.includes('generator') || lower.includes('card') || lower.includes('greet') || lower.includes('caption') || clientMessageDetails;
      
      if (isMessageRequest || hasOccasion || isRegenerate) {
        intent = "message_generator";
        
        let occasion = clientMessageDetails?.occasion || 'Birthday';
        let tone = clientMessageDetails?.tone || 'Heartfelt';
        let lang = 'english';
        let recipient = clientMessageDetails?.recipient || '';
        let lineLimit = 0;
        let lengthMode = clientMessageDetails?.lengthMode || 'Short';
        let relationship = clientMessageDetails?.relationship || 'Friend';
        let customDetails = clientMessageDetails?.customDetails || '';

        // Inherit history values
        let lastOccasion = 'Birthday';
        let lastTone = 'Heartfelt';
        let lastRecipient = '';
        let lastLang = 'english';
        let lastLength = 'Short';
        let lastRel = 'Friend';

        if (history && history.length > 0) {
          for (let i = history.length - 1; i >= 0; i--) {
            const histText = history[i].content.toLowerCase();
            if (histText.includes('birthday')) lastOccasion = 'Birthday';
            else if (histText.includes('anniversary')) lastOccasion = 'Anniversary';
            else if (histText.includes('friendship')) lastOccasion = 'Friendship';
            else if (histText.includes('farewell')) lastOccasion = 'Farewell';
            else if (histText.includes('proposal')) lastOccasion = 'Proposal';
            else if (histText.includes('wedding')) lastOccasion = 'Wedding';
            else if (histText.includes('engagement')) lastOccasion = 'Engagement';
            else if (histText.includes('baby shower')) lastOccasion = 'Baby Shower';
            else if (histText.includes('housewarming')) lastOccasion = 'Housewarming';
            else if (histText.includes('graduation')) lastOccasion = 'Graduation';
            else if (histText.includes('corporate')) lastOccasion = 'Corporate Event';
            else if (histText.includes('valentine')) lastOccasion = 'Valentine\'s Day';
            else if (histText.includes('naming')) lastOccasion = 'Naming Ceremony';

            if (histText.includes('funny')) lastTone = 'Funny';
            else if (histText.includes('romantic')) lastTone = 'Romantic';
            else if (histText.includes('emotional')) lastTone = 'Emotional';
            else if (histText.includes('professional')) lastTone = 'Professional';
            else if (histText.includes('cute')) lastTone = 'Cute';
            else if (histText.includes('poetic')) lastTone = 'Poetic';
            else if (histText.includes('luxury')) lastTone = 'Luxury';
            else if (histText.includes('inspirational')) lastTone = 'Inspirational';

            if (histText.includes('hindi') || histText.includes('हिंदी')) lastLang = 'hindi';
            else if (histText.includes('telugu') || histText.includes('తెలుగు')) lastLang = 'telugu';

            if (histText.includes('tiny')) lastLength = 'Tiny';
            else if (histText.includes('medium')) lastLength = 'Medium';
            else if (histText.includes('long')) lastLength = 'Long';
            else if (histText.includes('speech')) lastLength = 'Speech';
            else if (histText.includes('letter')) lastLength = 'Premium Letter';

            const nameMatch = history[i].content.match(/(?:recipient name|recipient|for|to|name)\s*[:\s]\s*([A-Za-z]+)/i);
            if (nameMatch) {
              lastRecipient = nameMatch[1];
            }
          }
        }

        if (!clientMessageDetails) {
          if (hasOccasion) {
            if (lower.includes('anniversary')) occasion = 'Anniversary';
            else if (lower.includes('baby')) occasion = 'Baby Shower';
            else if (lower.includes('wedding')) occasion = 'Wedding';
            else if (lower.includes('engagement')) occasion = 'Engagement';
            else if (lower.includes('housewarming')) occasion = 'Housewarming';
            else if (lower.includes('graduation')) occasion = 'Graduation';
            else if (lower.includes('farewell')) occasion = 'Farewell';
            else if (lower.includes('corporate')) occasion = 'Corporate Event';
            else if (lower.includes('valentine')) occasion = 'Valentine\'s Day';
            else if (lower.includes('naming')) occasion = 'Naming Ceremony';
            else occasion = 'Birthday';
          } else {
            occasion = lastOccasion;
          }
          tone = lower.includes('emotional') ? 'Emotional' : (lower.includes('funny') ? 'Funny' : (lower.includes('romantic') ? 'Romantic' : (lower.includes('poetic') ? 'Poetic' : (lower.includes('luxury') ? 'Luxury' : (lower.includes('cute') ? 'Cute' : (lower.includes('inspirational') ? 'Inspirational' : (lower.includes('formal') ? 'Formal' : (lower.includes('heartfelt') ? 'Heartfelt' : lastTone))))))));
          lengthMode = lower.includes('tiny') ? 'Tiny' : (lower.includes('medium') ? 'Medium' : (lower.includes('long') ? 'Long' : (lower.includes('speech') ? 'Speech' : (lower.includes('letter') ? 'Premium Letter' : lastLength))));
          recipient = lastRecipient;
        }

        const fallbacks = {
          Birthday: {
            Tiny: `Wishing you a day filled with laughter, unforgettable memories, and countless reasons to smile.`,
            Short: `Happy Birthday, ${recipient || 'dear friend'}! May your day be as spectacular and warm as your soul. Sending you massive hugs and cake!`,
            Medium: `Happy Birthday! Through every season of life, your warmth and kindness have been my anchor. Today, I celebrate the beautiful soul you are and the light you bring into my world. May you always be wrapped in endless love and joy. 💖`,
            Long: `Happy Birthday to an extraordinary soul! Each passing year is a reminder of how lucky I am to have you in my life. You are a source of endless inspiration, laughter, and support. As you celebrate this milestone, I hope you look back with pride and look forward with hope. May this year ahead be filled with achievements, beautiful discoveries, and love that never fades. 🎂✨`,
            Speech: `Good evening everyone! Today is a special day as we gather to celebrate ${recipient || 'our dear guest'}. Your presence in our lives brings so much positivity, wisdom, and light. We wish you an amazing birthday and a wonderful year ahead. Let's raise a toast to a fantastic person!`,
            'Premium Letter': `Dearest ${recipient || 'Friend'},\n\nI am writing this letter to convey my deepest affection and respect on the milestone of your birth. May this day unfold as a magnificent celebration of your life, adorned with the finest moments, surrounded by grandeur, laughter, and timeless memories. You have been a guiding light in my life, and I am profoundly grateful for our bond.\n\nWarmest regards.`
          },
          Anniversary: {
            Tiny: `To another beautiful year of love, compatibility, and shared joy!`,
            Short: `Happy Anniversary! Wishing you many more beautiful years of love and compatibility. Cheers to your bond! ❤️`,
            Medium: `Happy Anniversary, ${recipient || 'both'}! Seeing the deep love, respect, and support you share brings tears to my eyes. May your beautiful bond grow stronger and more resilient with each passing day.`,
            Long: `Happy Anniversary to a wonderful couple! Your journey together is a beautiful testament to what true love and understanding look like. Through ups and downs, you've stood strong, hand in hand. May your home always be a sanctuary of peace, laughter, and affection. Cheers to forever! 💍`,
            Speech: `Ladies and gentlemen, we are gathered here to toast a love story that inspires us all. Happy Anniversary! Your bond is built on respect, trust, and mutual support. Wishing you a lifetime of joy and happiness together.`,
            'Premium Letter': `Dear ${recipient || 'Couple'},\n\nCongratulations on celebrating another milestone in your journey together. May this anniversary become the first chapter of many extraordinary milestones awaiting you. Your enduring dedication is a true inspiration.\n\nBest wishes.`
          }
        };

        const occasionTemplates = fallbacks[occasion] || fallbacks.Birthday;
        let generatedText = occasionTemplates[lengthMode] || occasionTemplates.Short || Object.values(occasionTemplates)[0];

        // Format name & custom memories if provided
        if (recipient && !generatedText.includes(recipient)) {
          generatedText = generatedText.replace('dear friend', recipient).replace('Friend', recipient);
        }
        if (customDetails) {
          generatedText += ` \n\n*Special detail added: We cherish our memories of "${customDetails}"!*`;
        }

        reply = isRegenerate 
          ? `I have updated your message with unique phrasing (Occasion: ${occasion}, Tone: ${tone}, Length: ${lengthMode}):`
          : `Here is your customized generated message:`;

        messageDetails = {
          type: occasion,
          tone,
          recipient,
          generatedText
        };
      }
    }

    res.json({
      success: true,
      reply,
      intent,
      recommendations,
      messageDetails
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
