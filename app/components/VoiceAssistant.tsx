'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Reservation {
  name: string
  date: string
  time: string
  guests: number
  phone: string
  email?: string
}

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! Welcome to Bella Vista Restaurant. I\'m your AI assistant. How can I help you today? Would you like to make a reservation?',
      timestamp: new Date()
    }
  ])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [reservation, setReservation] = useState<Partial<Reservation>>({})
  const [conversationState, setConversationState] = useState<'greeting' | 'collecting' | 'confirming' | 'complete'>('greeting')

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setCurrentTranscript(transcript)
          handleUserInput(transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speak = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)

      synthRef.current.speak(utterance)
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setCurrentTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const extractInfo = (text: string, currentRes: Partial<Reservation>) => {
    const lowerText = text.toLowerCase()
    const newRes = { ...currentRes }

    // Extract name
    const namePatterns = [
      /(?:my name is|i'm|i am|this is|name's|for) ([a-z]+ [a-z]+)/i,
      /(?:under|reservation for) ([a-z]+ [a-z]+)/i
    ]
    for (const pattern of namePatterns) {
      const match = text.match(pattern)
      if (match && !newRes.name) {
        newRes.name = match[1]
      }
    }

    // Extract date
    const datePatterns = [
      /(?:on |for |)(january|february|march|april|may|june|july|august|september|october|november|december) (\d{1,2})(?:st|nd|rd|th)?/i,
      /(?:on |for |)(\d{1,2})(?:st|nd|rd|th)? (?:of )?(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(today|tomorrow|tonight)/i,
      /(\d{1,2})\/(\d{1,2})/
    ]
    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match && !newRes.date) {
        if (match[0].toLowerCase() === 'today' || match[0].toLowerCase() === 'tonight') {
          const today = new Date()
          newRes.date = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        } else if (match[0].toLowerCase() === 'tomorrow') {
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          newRes.date = tomorrow.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        } else {
          newRes.date = match[0]
        }
      }
    }

    // Extract time
    const timePatterns = [
      /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
      /(?:at |for |)(\d{1,2})\s*o'?clock/i
    ]
    for (const pattern of timePatterns) {
      const match = text.match(pattern)
      if (match && !newRes.time) {
        newRes.time = match[0]
      }
    }

    // Extract number of guests
    const guestPatterns = [
      /(\d+)\s*(?:people|persons|guests)/i,
      /(?:party of|table for|for)\s*(\d+)/i,
      /(?:^|\s)(two|three|four|five|six|seven|eight)(?:\s|$)/i
    ]
    const numberWords: { [key: string]: number } = {
      'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8
    }
    for (const pattern of guestPatterns) {
      const match = text.match(pattern)
      if (match && !newRes.guests) {
        const value = match[1]
        newRes.guests = numberWords[value.toLowerCase()] || parseInt(value)
      }
    }

    // Extract phone number
    const phonePatterns = [
      /(\d{3})[- ]?(\d{3})[- ]?(\d{4})/,
      /\((\d{3})\)\s*(\d{3})[- ]?(\d{4})/
    ]
    for (const pattern of phonePatterns) {
      const match = text.match(pattern)
      if (match && !newRes.phone) {
        newRes.phone = match[0]
      }
    }

    // Extract email
    const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
    const emailMatch = text.match(emailPattern)
    if (emailMatch && !newRes.email) {
      newRes.email = emailMatch[0]
    }

    return newRes
  }

  const handleUserInput = (text: string) => {
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    const lowerText = text.toLowerCase()
    let response = ''

    // Check for cancellation
    if (lowerText.includes('cancel') || lowerText.includes('nevermind') || lowerText.includes('never mind')) {
      setReservation({})
      setConversationState('greeting')
      response = 'No problem! Your reservation has been cancelled. Is there anything else I can help you with?'
    }
    // Check for confirmation
    else if (conversationState === 'confirming') {
      if (lowerText.includes('yes') || lowerText.includes('correct') || lowerText.includes('confirm')) {
        setConversationState('complete')
        response = `Perfect! Your reservation has been confirmed for ${reservation.guests} guests on ${reservation.date} at ${reservation.time} under the name ${reservation.name}. We'll send a confirmation to ${reservation.phone}. We look forward to seeing you at Bella Vista Restaurant! Is there anything else you'd like to know?`
      } else if (lowerText.includes('no') || lowerText.includes('change') || lowerText.includes('wrong')) {
        setConversationState('collecting')
        response = 'No problem! What would you like to change?'
      } else {
        response = 'I didn\'t catch that. Could you please confirm if the details are correct by saying "yes" or let me know what you\'d like to change?'
      }
    }
    // Process reservation information
    else {
      const updatedReservation = extractInfo(text, reservation)
      setReservation(updatedReservation)

      const missing = []
      if (!updatedReservation.name) missing.push('name')
      if (!updatedReservation.date) missing.push('date')
      if (!updatedReservation.time) missing.push('time')
      if (!updatedReservation.guests) missing.push('number of guests')
      if (!updatedReservation.phone) missing.push('phone number')

      if (missing.length === 0) {
        setConversationState('confirming')
        response = `Great! Let me confirm your reservation details: ${updatedReservation.guests} guests on ${updatedReservation.date} at ${updatedReservation.time} under the name ${updatedReservation.name}. Contact number: ${updatedReservation.phone}. Is this correct?`
      } else {
        setConversationState('collecting')
        if (missing.length === 5) {
          response = 'I\'d be happy to help you make a reservation! Could you please tell me the date and time you\'d like to dine with us?'
        } else if (missing.includes('date') && missing.includes('time')) {
          response = 'What date and time would you like to book?'
        } else if (missing.includes('date')) {
          response = 'What date would you like to make the reservation for?'
        } else if (missing.includes('time')) {
          response = 'What time would you prefer?'
        } else if (missing.includes('number of guests')) {
          response = 'How many guests will be joining you?'
        } else if (missing.includes('name')) {
          response = 'May I have the name for the reservation?'
        } else if (missing.includes('phone number')) {
          response = 'And what\'s the best phone number to reach you at?'
        }
      }
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, assistantMessage])
    speak(response)
  }

  const handleTextInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = e.currentTarget.elements.namedItem('textInput') as HTMLInputElement
    const text = input.value.trim()
    if (text) {
      handleUserInput(text)
      input.value = ''
    }
  }

  return (
    <div>
      <div style={{
        height: '400px',
        overflowY: 'auto',
        border: '2px solid #e0e0e0',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px',
        background: '#fafafa'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: '15px',
              background: msg.role === 'user' ? '#667eea' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#333',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              fontSize: '0.95rem',
              lineHeight: '1.4'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {currentTranscript && (
        <div style={{
          padding: '10px',
          background: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '15px',
          fontSize: '0.9rem',
          color: '#1976d2'
        }}>
          Listening: {currentTranscript}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px'
      }}>
        <button
          onClick={toggleListening}
          disabled={isSpeaking}
          style={{
            flex: 1,
            padding: '15px',
            fontSize: '1.1rem',
            fontWeight: '600',
            border: 'none',
            borderRadius: '10px',
            cursor: isSpeaking ? 'not-allowed' : 'pointer',
            background: isListening ? '#f44336' : '#4CAF50',
            color: 'white',
            transition: 'all 0.3s',
            opacity: isSpeaking ? 0.5 : 1
          }}
        >
          {isListening ? '🔴 Stop Listening' : '🎤 Start Voice Input'}
        </button>
      </div>

      <form onSubmit={handleTextInput} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          name="textInput"
          placeholder="Or type your message here..."
          disabled={isSpeaking || isListening}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '1rem',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={isSpeaking || isListening}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            cursor: (isSpeaking || isListening) ? 'not-allowed' : 'pointer',
            background: '#667eea',
            color: 'white',
            opacity: (isSpeaking || isListening) ? 0.5 : 1
          }}
        >
          Send
        </button>
      </form>

      {Object.keys(reservation).length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#e8f5e9',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          <strong>Current Reservation Details:</strong>
          <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
            {reservation.name && <li>Name: {reservation.name}</li>}
            {reservation.date && <li>Date: {reservation.date}</li>}
            {reservation.time && <li>Time: {reservation.time}</li>}
            {reservation.guests && <li>Guests: {reservation.guests}</li>}
            {reservation.phone && <li>Phone: {reservation.phone}</li>}
            {reservation.email && <li>Email: {reservation.email}</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
