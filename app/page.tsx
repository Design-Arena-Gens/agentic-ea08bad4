'use client'

import { useState, useEffect, useRef } from 'react'
import VoiceAssistant from './components/VoiceAssistant'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#333',
            marginBottom: '10px',
            fontWeight: '700'
          }}>
            Bella Vista Restaurant
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#666',
            marginBottom: '5px'
          }}>
            Fine Italian Dining in Manhattan
          </p>
          <p style={{
            fontSize: '0.9rem',
            color: '#888'
          }}>
            AI Voice Assistant for Reservations
          </p>
        </div>

        <VoiceAssistant />

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '10px',
          fontSize: '0.9rem',
          color: '#555'
        }}>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>Restaurant Information:</h3>
          <p><strong>Location:</strong> 456 Park Avenue, Manhattan, NY 10022</p>
          <p><strong>Hours:</strong> Mon-Sun 5:00 PM - 11:00 PM</p>
          <p><strong>Cuisine:</strong> Contemporary Italian</p>
          <p><strong>Dress Code:</strong> Smart Casual</p>
        </div>
      </div>
    </main>
  )
}
