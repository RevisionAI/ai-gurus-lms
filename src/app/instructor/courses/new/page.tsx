'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function NewCoursePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    semester: '',
    year: new Date().getFullYear(),
    prerequisites: '',
    targetAudience: ''
  })
  const [learningObjectives, setLearningObjectives] = useState<string[]>([''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const addObjective = () => {
    if (learningObjectives.length < 20) {
      setLearningObjectives([...learningObjectives, ''])
    }
  }

  const removeObjective = (index: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index))
  }

  const updateObjective = (index: number, value: string) => {
    const updated = [...learningObjectives]
    updated[index] = value
    setLearningObjectives(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Filter out empty learning objectives
      const filteredObjectives = learningObjectives.filter(obj => obj.trim() !== '')

      const response = await fetch('/api/instructor/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          learningObjectives: filteredObjectives,
          prerequisites: formData.prerequisites || null,
          targetAudience: formData.targetAudience || null
        }),
      })

      if (response.ok) {
        const course = await response.json()
        router.push(`/instructor/courses/${course.id}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create course')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Introduction to Computer Science"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    id="code"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., CS-101"
                    value={formData.code}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                      Semester *
                    </label>
                    <select
                      name="semester"
                      id="semester"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.semester}
                      onChange={handleChange}
                    >
                      <option value="">Select Semester</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                      <option value="Fall">Fall</option>
                      <option value="Winter">Winter</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                      Year *
                    </label>
                    <input
                      type="number"
                      name="year"
                      id="year"
                      required
                      min="2020"
                      max="2030"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.year}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Course Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Describe the course objectives, topics covered, and learning outcomes..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                {/* Prerequisites Section */}
                <div>
                  <label htmlFor="prerequisites" className="block text-sm font-medium text-gray-700">
                    Prerequisites (Optional)
                  </label>
                  <textarea
                    name="prerequisites"
                    id="prerequisites"
                    rows={3}
                    maxLength={2000}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="List any prerequisites students should have (e.g., prior courses, skills, knowledge)..."
                    value={formData.prerequisites}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.prerequisites.length}/2000 characters
                  </p>
                </div>

                {/* Learning Objectives Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Objectives
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    What will students be able to do after completing this course?
                  </p>
                  {learningObjectives.map((objective, index) => (
                    <div key={index} className="flex items-start space-x-2 mb-2">
                      <span className="mt-2 text-sm text-gray-500 w-6">{index + 1}.</span>
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        maxLength={500}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={`Learning objective ${index + 1}`}
                      />
                      {learningObjectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeObjective(index)}
                          className="px-2 py-2 text-red-600 hover:text-red-800 focus:outline-none"
                          title="Remove objective"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {learningObjectives.length < 20 && (
                    <button
                      type="button"
                      onClick={addObjective}
                      className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Objective
                    </button>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {learningObjectives.length}/20 objectives (max 500 characters each)
                  </p>
                </div>

                {/* Target Audience Section */}
                <div>
                  <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700">
                    Target Audience (Optional)
                  </label>
                  <textarea
                    name="targetAudience"
                    id="targetAudience"
                    rows={3}
                    maxLength={1000}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Describe who should take this course (e.g., experience level, background, goals)..."
                    value={formData.targetAudience}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.targetAudience.length}/1000 characters
                  </p>
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
