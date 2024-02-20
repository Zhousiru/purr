'use client'

import { registerEvents } from '@/lib/events'
import { useEffect } from 'react'

export function RegisterEvents() {
  useEffect(registerEvents, [])
  return null
}
