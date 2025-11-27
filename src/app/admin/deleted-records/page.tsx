'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Archive, RefreshCw, User, BookOpen, FileText, GraduationCap, MessageSquare, File, Megaphone } from 'lucide-react'

type ModelType = 'users' | 'courses' | 'assignments' | 'grades' | 'discussions' | 'courseContent' | 'announcements'

interface DeletedRecord {
  id: string
  deletedAt: string
  [key: string]: unknown
}

interface DeletedRecordsData {
  users: DeletedRecord[]
  courses: DeletedRecord[]
  assignments: DeletedRecord[]
  grades: DeletedRecord[]
  discussions: DeletedRecord[]
  courseContent: DeletedRecord[]
  announcements: DeletedRecord[]
}

const MODEL_CONFIG: Record<ModelType, { label: string; icon: React.ReactNode; apiModel: string }> = {
  users: { label: 'Users', icon: <User size={18} />, apiModel: 'user' },
  courses: { label: 'Courses', icon: <BookOpen size={18} />, apiModel: 'course' },
  assignments: { label: 'Assignments', icon: <FileText size={18} />, apiModel: 'assignment' },
  grades: { label: 'Grades', icon: <GraduationCap size={18} />, apiModel: 'grade' },
  discussions: { label: 'Discussions', icon: <MessageSquare size={18} />, apiModel: 'discussion' },
  courseContent: { label: 'Content', icon: <File size={18} />, apiModel: 'courseContent' },
  announcements: { label: 'Announcements', icon: <Megaphone size={18} />, apiModel: 'announcement' },
}

export default function AdminDeletedRecordsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<DeletedRecordsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ModelType>('users')
  const [restoring, setRestoring] = useState<string | null>(null)

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/deleted-records')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to fetch deleted records')
      }
      const data = await response.json()
      setRecords(data.data)
      setError(null)
    } catch (err: unknown) {
      console.error('Error fetching deleted records:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchRecords()
    }
  }, [session, fetchRecords])

  const handleRestore = async (id: string, model: ModelType) => {
    const confirmMessage = model === 'courses'
      ? 'Restore this course and all related content (assignments, discussions, content, announcements)?'
      : `Restore this ${MODEL_CONFIG[model].label.slice(0, -1)}? This will make it visible again.`

    if (!confirm(confirmMessage)) return

    try {
      setRestoring(id)
      const response = await fetch(`/api/admin/deleted-records/${id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL_CONFIG[model].apiModel }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to restore record')
      }

      // Refresh the records list
      await fetchRecords()
    } catch (err: unknown) {
      console.error('Error restoring record:', err)
      alert(err instanceof Error ? err.message : 'Failed to restore record')
    } finally {
      setRestoring(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRecordName = (record: DeletedRecord, model: ModelType): string => {
    switch (model) {
      case 'users':
        return `${record.name || ''} ${record.surname || ''}`.trim() || record.email as string || 'Unknown'
      case 'courses':
        return `${record.title || 'Unknown'} (${record.code || 'N/A'})`
      case 'assignments':
        return record.title as string || 'Unknown Assignment'
      case 'grades':
        const student = record.student as { name?: string; surname?: string } | undefined
        const assignment = record.assignment as { title?: string } | undefined
        return `${student?.name || ''} ${student?.surname || ''} - ${assignment?.title || 'Unknown'}`
      case 'discussions':
        return record.title as string || 'Unknown Discussion'
      case 'courseContent':
        return `${record.title || 'Unknown'} (${record.type || 'Unknown'})`
      case 'announcements':
        return record.title as string || 'Unknown Announcement'
      default:
        return 'Unknown'
    }
  }

  const getRecordContext = (record: DeletedRecord, model: ModelType): string | null => {
    switch (model) {
      case 'users':
        return record.role as string || null
      case 'courses':
        const instructor = record.instructor as { name?: string; surname?: string } | undefined
        return instructor ? `Instructor: ${instructor.name || ''} ${instructor.surname || ''}`.trim() : null
      case 'assignments':
      case 'discussions':
      case 'courseContent':
      case 'announcements':
        const course = record.course as { title?: string; code?: string } | undefined
        return course ? `Course: ${course.title || ''} (${course.code || ''})` : null
      case 'grades':
        return `Points: ${record.points}`
      default:
        return null
    }
  }

  // Check session loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  if (session.user.role !== 'ADMIN') {
    router.push('/dashboard')
    return null
  }

  const activeRecords = records?.[activeTab] || []
  const totalDeleted = records
    ? Object.values(records).reduce((sum, arr) => sum + arr.length, 0)
    : 0

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Archive className="text-gray-600" />
              Deleted Records
            </h1>
            <p className="text-gray-600 mt-1">
              Audit trail of soft-deleted records. {totalDeleted} total archived records.
            </p>
          </div>
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150"
          >
            <RefreshCw size={20} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-6" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-md border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {(Object.keys(MODEL_CONFIG) as ModelType[]).map((model) => {
              const config = MODEL_CONFIG[model]
              const count = records?.[model]?.length || 0
              return (
                <button
                  key={model}
                  onClick={() => setActiveTab(model)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === model
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {config.icon}
                  {config.label}
                  {count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === model ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-b-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            </div>
          ) : activeRecords.length === 0 ? (
            <div className="text-center py-12">
              <Archive size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 mb-2">No deleted {MODEL_CONFIG[activeTab].label.toLowerCase()} found.</p>
              <p className="text-gray-500">Records that are soft-deleted will appear here.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name / Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Context
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deleted At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getRecordName(record, activeTab)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {record.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {getRecordContext(record, activeTab) || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(record.deletedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRestore(record.id, activeTab)}
                        disabled={restoring === record.id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        {restoring === record.id ? (
                          <>
                            <RefreshCw size={14} className="mr-1 animate-spin" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={14} className="mr-1" />
                            Restore
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Data Retention Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800">Data Retention Policy</h3>
          <p className="mt-1 text-sm text-yellow-700">
            Soft-deleted records are retained for 1 year from the deletion date before becoming eligible for permanent deletion.
            Contact your system administrator for permanent deletion requests.
          </p>
        </div>
      </div>
    </div>
  )
}
