'use client'

export default function Home() {
  // redirect to dashboard
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard'
  }
  return null
}
