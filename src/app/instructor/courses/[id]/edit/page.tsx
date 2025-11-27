'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { toast } from 'react-hot-toast'
import { Trash2 } from 'lucide-react'

interface CourseForm {
  title: string
  description: string
  code: string
  semester: string
  year: string
  isActive: boolean
  prerequisites: string
  targetAudience: string
}

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<CourseForm | null>(null)
  const [learningObjectives, setLearningObjectives] = useState<string[]>([''])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/instructor/courses/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setCourse({
            title: data.title,
            description: data.description || '',
            code: data.code,
            semester: data.semester,
            year: data.year.toString(),
            isActive: data.isActive,
            prerequisites: data.prerequisites || '',
            targetAudience: data.targetAudience || '',
          })
          // Set learning objectives, ensuring at least one empty field
          const objectives = data.learningObjectives || []
          setLearningObjectives(objectives.length > 0 ? objectives : [''])
        } else {
          toast.error('Failed to load course data.')
        }
      } catch (error) {
        console.error('Error fetching course:', error)
        toast.error('An error occurred while fetching course data.')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCourse()
    }
  }, [params.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setCourse(prev => prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } : null)
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
    if (!course) return

    setSaving(true)
    try {
      // Filter out empty learning objectives
      const filteredObjectives = learningObjectives.filter(obj => obj.trim() !== '')

      const res = await fetch(`/api/instructor/courses/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...course,
          year: parseInt(course.year),
          learningObjectives: filteredObjectives,
          prerequisites: course.prerequisites || null,
          targetAudience: course.targetAudience || null
        }),
      })

      if (res.ok) {
        toast.success('Course updated successfully!')
        router.push(`/instructor/courses/${params.id}`)
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Failed to update course.')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error('An error occurred while updating the course.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/instructor/courses/${params.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Course deleted successfully!')
        router.push('/instructor/courses')
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Failed to delete course.')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('An error occurred while deleting the course.')
    } finally {
      setSaving(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!course) {
    return (
      <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h2 className="text-lg font-bold">Confirm Deletion</h2>
                <p className="text-sm text-gray-600 mt-2">Are you sure you want to delete this course? This will permanently delete the course and all its content, including assignments, enrollments, and discussions. This action cannot be undone.</p>
                <div className="mt-6 flex justify-end space-x-3">
                  <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={saving}>Cancel</button>
                  <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700" disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</button>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Course
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={course.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={course.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700">Course Code</label>
                  <input
                    type="text"
                    name="code"
                    id="code"
                    value={course.code}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700">Semester</label>
                  <select
                    name="semester"
                    id="semester"
                    value={course.semester}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  name="year"
                  id="year"
                  value={course.year}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={course.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active</label>
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="List any prerequisites students should have (e.g., prior courses, skills, knowledge)..."
                  value={course.prerequisites}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {course.prerequisites.length}/2000 characters
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe who should take this course (e.g., experience level, background, goals)..."
                  value={course.targetAudience}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {course.targetAudience.length}/1000 characters
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
