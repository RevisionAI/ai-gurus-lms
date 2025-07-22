'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  if (!session) return null

  return (
    <div className="w-full" style={{backgroundColor: '#000000'}}>
      <nav className="shadow-lg" style={{backgroundColor: '#000000'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <img src="/Logo.png" alt="Revision AI Learning Port Logo" className="h-8 w-auto" />
                <span style={{color: '#FFFFFF', fontWeight: 700, fontSize: '1.25rem', textShadow: '1px 1px 3px rgba(0,0,0,0.9)'}}>Revision AI Learning Port</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <div style={{color: '#FFFFFF', fontWeight: 600, backgroundColor: '#333333', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', margin: '0 0.25rem'}} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555555'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333333'}>
                  Dashboard
                </div>
              </Link>
              <Link href="/courses">
                <div style={{color: '#FFFFFF', fontWeight: 600, backgroundColor: '#333333', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', margin: '0 0.25rem'}} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555555'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333333'}>
                  Courses
                </div>
              </Link>
              {session.user.role === 'INSTRUCTOR' && (
                <Link href="/instructor">
                  <div style={{color: '#FFFFFF', fontWeight: 600, backgroundColor: '#333333', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', margin: '0 0.25rem'}} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555555'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333333'}>
                    Instructor
                  </div>
                </Link>
              )}
              {session.user.role === 'ADMIN' && (
                <Link href="/admin">
                  <div style={{color: '#FFFFFF', fontWeight: 600, backgroundColor: '#333333', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', margin: '0 0.25rem'}} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555555'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333333'}>
                    Admin
                  </div>
                </Link>
              )}
              
              <div className="flex items-center space-x-2">
                <span style={{color: '#FFFFFF', fontWeight: 600, backgroundColor: '#2563eb', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', fontSize: '0.875rem'}}>
                  {session.user.name} ({session.user.role})
                </span>
                <button
                  onClick={handleSignOut}
                  style={{color: '#FFFFFF', fontWeight: 600, backgroundColor: '#dc2626', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', fontSize: '0.875rem'}}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}