'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect /admin/teams → /admin/teams/dashboard
export default function TeamsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/teams/dashboard') }, [router])
  return null
}
