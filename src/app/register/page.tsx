'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    cellNumber: '',
    company: '',
    position: '',
    workAddress: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT'
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          cellNumber: formData.cellNumber,
          company: formData.company,
          position: formData.position,
          workAddress: formData.workAddress,
          password: formData.password,
          role: formData.role,
        }),
      })

      if (response.ok) {
        router.push('/login?message=Registration successful')
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-black">
      {/* Left section - Video (1/3) */}
      <div className="w-1/3 relative overflow-hidden">
        <video 
          className="h-full w-full object-cover" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/Port%20sup.mov" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black opacity-40"></div>
        <div className="absolute bottom-8 left-8 text-white">
          <h2 className="text-2xl font-bold mb-2"><strong>Coming Soon</strong> - <em>Create AI videos for you ads, promos and stories</em></h2>
        </div>
      </div>
      
      {/* Right section - Registration form (2/3) */}
      <div className="w-2/3 py-12 px-4 sm:px-6 lg:px-8 overflow-auto flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-md w-full mb-8 flex items-center justify-center">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
            AI Fluency Program Registration
          </h2>
        </div>
        <div className="max-w-3xl w-full space-y-8 bg-card-bg p-8 rounded-lg shadow-xl border border-gray-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-pink-400">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm transition duration-300"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-pink-400">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm transition duration-300"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-pink-400">
                  Company
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm transition duration-300"
                  placeholder="Enter your company name"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="workAddress" className="block text-sm font-medium text-pink-400">
                  Work Address
                </label>
                <input
                  id="workAddress"
                  name="workAddress"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm transition duration-300"
                  placeholder="Enter your work address"
                  value={formData.workAddress}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-pink-400">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm transition duration-300"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="surname" className="block text-sm font-medium text-pink-400">
                  Surname
                </label>
                <input
                  id="surname"
                  name="surname"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm transition duration-300"
                  placeholder="Enter your surname"
                  value={formData.surname}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="cellNumber" className="block text-sm font-medium text-pink-400">
                  Cell Number
                </label>
                <input
                  id="cellNumber"
                  name="cellNumber"
                  type="tel"
                  required
                  className="mt-1 appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm transition duration-300"
                  placeholder="Enter your cell number"
                  value={formData.cellNumber}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-pink-400">
                  Position
                </label>
                <input
                  id="position"
                  name="position"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm transition duration-300"
                  placeholder="Enter your job position"
                  value={formData.position}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-pink-400">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="mt-1 block w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-white transition duration-300"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="STUDENT">Student</option>
                  <option value="INSTRUCTOR">Instructor</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-pink-400">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 appearance-none relative block w-full px-4 py-3 bg-gray-800 border border-gray-700 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm transition duration-300"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-blue-600 text-white rounded-md hover:from-pink-700 hover:to-blue-700 disabled:opacity-50 transition duration-300 font-medium text-base shadow-lg shadow-pink-500/20"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center pt-2">
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card-bg px-4 text-xs text-gray-500">OR</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Already have an account?{' '}
              <Link href="/login" className="text-pink-400 hover:text-pink-300 font-medium transition-colors duration-300">
                Sign in to your account &rarr;
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}