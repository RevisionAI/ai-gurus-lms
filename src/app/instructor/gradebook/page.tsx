'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BookOpen, Download } from 'lucide-react'

interface Course {
  id: string
  title: string
  code: string
}

interface Student {
  id: string
  name: string
  email: string
}

interface Assignment {
  id: string
  title: string
  maxPoints: number
}

interface Grade {
  id: string
  points: number
  feedback: string | null
  createdAt: string
  updatedAt: string
}

interface StudentGrade {
  student: Student
  grades: Record<string, Grade | null>
  averageGrade: number | null
  totalPoints: number
  maxPossiblePoints: number
}

export default function GradebookPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/instructor/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
          // Select first course by default if available
          if (data.length > 0) {
            setSelectedCourse(data[0].id)
          }
        } else {
          setError('Failed to fetch courses')
        }
      } catch (err) {
        console.error('Error fetching courses:', err)
        setError('An error occurred while fetching courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    if (!selectedCourse) return

    const fetchCourseData = async () => {
      setLoading(true)
      try {
        // Fetch assignments for the selected course
        const assignmentsResponse = await fetch(
          `/api/instructor/courses/${selectedCourse}/assignments`
        )
        
        if (!assignmentsResponse.ok) {
          throw new Error('Failed to fetch assignments')
        }
        
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData)
        
        // Create a map to collect student data and grades
        const studentsMap = new Map<string, {
          student: Student;
          grades: Record<string, Grade | null>;
          totalPoints: number;
          maxPossiblePoints: number;
        }>()
        
        // Fetch submissions with grades for each assignment
        const assignmentPromises = assignmentsData.map(async (assignment: Assignment) => {
          const submissionsResponse = await fetch(
            `/api/instructor/assignments/${assignment.id}/submissions`
          )
          
          if (!submissionsResponse.ok) return null
          
          const submissions = await submissionsResponse.json()
          
          // Process each submission
          submissions.forEach((submission: any) => {
            const { student, grade } = submission
            
            if (!studentsMap.has(student.id)) {
              studentsMap.set(student.id, {
                student,
                grades: {},
                totalPoints: 0,
                maxPossiblePoints: 0
              })
            }
            
            const studentData = studentsMap.get(student.id)!
            studentData.grades[assignment.id] = grade
            
            if (grade) {
              studentData.totalPoints += grade.points
            }
            studentData.maxPossiblePoints += assignment.maxPoints
          })
        })
        
        await Promise.all(assignmentPromises.filter(Boolean))
        
        // Convert the map to an array and calculate average grades
        const studentGradesArray = Array.from(studentsMap.values()).map(data => ({
          ...data,
          averageGrade: data.maxPossiblePoints > 0
            ? (data.totalPoints / data.maxPossiblePoints) * 100
            : null
        }))
        
        setStudentGrades(studentGradesArray)
      } catch (err) {
        console.error('Error fetching course data:', err)
        setError('An error occurred while loading the gradebook')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCourseData()
  }, [selectedCourse])
  
  // Helper function to get grade display
  const getGradeDisplay = (grade: Grade | null, maxPoints: number) => {
    if (!grade) return 'Not graded'
    return `${grade.points}/${maxPoints} (${Math.round((grade.points / maxPoints) * 100)}%)`
  }
  
  // Helper function to get grade color class
  const getGradeColorClass = (grade: Grade | null, maxPoints: number) => {
    if (!grade) return 'text-gray-500'
    const percentage = (grade.points / maxPoints) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }
  
  const handleExportGrades = () => {
    if (!assignments.length || !studentGrades.length) return
    
    // Create CSV content
    let csvContent = 'Student Name,Email'
    
    // Add assignment headers
    assignments.forEach(assignment => {
      csvContent += `,${assignment.title} (${assignment.maxPoints})`
    })
    
    // Add average column
    csvContent += ',Average (%)\n'
    
    // Add student data
    studentGrades.forEach(({ student, grades, averageGrade }) => {
      csvContent += `${student.name},${student.email}`
      
      // Add grades for each assignment
      assignments.forEach(assignment => {
        const grade = grades[assignment.id]
        csvContent += `,${grade ? grade.points : 'Not graded'}`
      })
      
      // Add average
      csvContent += `,${averageGrade ? averageGrade.toFixed(2) : 'N/A'}\n`
    })
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `gradebook_${selectedCourse}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-bg-primary">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-text-primary">Gradebook</h1>
              <button
                onClick={handleExportGrades}
                disabled={!selectedCourse || !studentGrades.length}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
            
            {error ? (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            ) : loading && !courses.length ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-card-bg rounded-lg shadow p-6">
                <div className="text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-text-primary">No courses found</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    You haven't created any courses yet.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label htmlFor="course-select" className="block text-sm font-medium text-text-secondary mb-1">
                    Select Course
                  </label>
                  <select
                    id="course-select"
                    value={selectedCourse || ''}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="max-w-md mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-bg-content text-text-primary"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="bg-card-bg rounded-lg shadow p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-text-primary">No assignments found</h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        This course doesn't have any assignments yet.
                      </p>
                    </div>
                  </div>
                ) : studentGrades.length === 0 ? (
                  <div className="bg-card-bg rounded-lg shadow p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-text-primary">No students found</h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        There are no students enrolled in this course.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden shadow border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                              </th>
                              {assignments.map((assignment) => (
                                <th key={assignment.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {assignment.title}
                                  <span className="block text-gray-400 font-normal">
                                    ({assignment.maxPoints} pts)
                                  </span>
                                </th>
                              ))}
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Average
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {studentGrades.map(({ student, grades, averageGrade, totalPoints, maxPossiblePoints }) => (
                              <tr key={student.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                      <div className="text-sm text-gray-500">{student.email}</div>
                                    </div>
                                  </div>
                                </td>
                                
                                {assignments.map((assignment) => {
                                  const grade = grades[assignment.id]
                                  return (
                                    <td key={assignment.id} className="px-6 py-4 whitespace-nowrap">
                                      <span className={`${getGradeColorClass(grade, assignment.maxPoints)}`}>
                                        {getGradeDisplay(grade, assignment.maxPoints)}
                                      </span>
                                    </td>
                                  )
                                })}
                                
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {averageGrade !== null ? (
                                    <div>
                                      <span className={`font-medium ${averageGrade >= 90 ? 'text-green-600' : 
                                        averageGrade >= 80 ? 'text-blue-600' : 
                                        averageGrade >= 70 ? 'text-yellow-600' : 
                                        averageGrade >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                                        {averageGrade.toFixed(1)}%
                                      </span>
                                      <span className="text-gray-500 text-xs block">
                                        {totalPoints}/{maxPossiblePoints} pts
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">N/A</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
