'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  FileText,
  Video,
  File,
  Link as LinkIcon,
  BookOpen,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  ArrowLeft,
  Upload,
  X,
  Save,
  Cloud
} from 'lucide-react'
import { uploadToS3 } from '@/hooks/useS3Upload'

interface CourseContent {
  id: string
  title: string
  type: 'TEXT' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'SCORM' | 'YOUTUBE'
  content: string | null
  fileUrl: string | null
  thumbnailUrl: string | null
  orderIndex: number
  isPublished: boolean
  createdAt: string
}

interface Course {
  id: string
  title: string
  code: string
}

// Sortable Item Component
function SortableItem({ 
  id, 
  index,
  item, 
  getContentIcon, 
  getContentIconColor, 
  handleEdit, 
  togglePublished, 
  handleDelete 
}: { 
  id: string
  index: number
  item: CourseContent
  getContentIcon: (type: CourseContent['type']) => React.ComponentType<{ className?: string }>
  getContentIconColor: (type: CourseContent['type']) => string
  handleEdit: (item: CourseContent) => void
  togglePublished: (item: CourseContent) => void
  handleDelete: (contentId: string) => void
}) {
  const Icon = getContentIcon(item.type);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg ${isDragging ? 'bg-blue-50' : 'bg-white'}`}
    >
      <div className="flex items-center space-x-3">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        
        {/* Thumbnail or Icon */}
        {item.thumbnailUrl ? (
          <img 
            src={item.thumbnailUrl} 
            alt={item.title}
            className="h-12 w-12 object-cover rounded-md border border-gray-200"
          />
        ) : (
          <div className={`h-12 w-12 flex items-center justify-center rounded-md border border-gray-200 ${getContentIconColor(item.type)}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
        
        <div>
          <h4 className="font-medium text-gray-900">{item.title}</h4>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-sm text-gray-500 capitalize">
              {item.type.toLowerCase()}
            </span>
            <span className={`text-sm ${item.isPublished ? 'text-green-600' : 'text-yellow-600'}`}>
              {item.isPublished ? 'Published' : 'Draft'}
            </span>
            {item.fileUrl && item.fileUrl.startsWith('/uploads/') && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                <Upload className="h-3 w-3 mr-1" />
                Local
              </span>
            )}
            {item.fileUrl && item.fileUrl.includes('r2.dev') && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                <Cloud className="h-3 w-3 mr-1" />
                Cloud
              </span>
            )}
            {item.fileUrl && !item.fileUrl.startsWith('/uploads/') && !item.fileUrl.includes('r2.dev') && item.type !== 'TEXT' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                External URL
              </span>
            )}
            {item.type === 'YOUTUBE' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                YouTube
              </span>
            )}
            {item.thumbnailUrl && item.type !== 'YOUTUBE' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                Has thumbnail
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => togglePublished(item)}
          className={`p-2 rounded-md ${
            item.isPublished 
              ? 'text-green-600 hover:bg-green-50' 
              : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          {item.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          onClick={() => handleEdit(item)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(item.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function CourseContentPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get module context from URL query params
  const moduleIdFromUrl = searchParams.get('module')
  const shouldShowForm = searchParams.get('new') === 'true'

  const [course, setCourse] = useState<Course | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(moduleIdFromUrl)
  const [content, setContent] = useState<CourseContent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContent, setEditingContent] = useState<CourseContent | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fetchingYouTube, setFetchingYouTube] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [hasOrderChanged, setHasOrderChanged] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    url: string
    filename: string
    size: number
    type: string
  } | null>(null)
  const [uploadedThumbnail, setUploadedThumbnail] = useState<{
    url: string
    filename: string
    size: number
    type: string
  } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    type: 'TEXT' as CourseContent['type'],
    content: '',
    fileUrl: '',
    thumbnailUrl: '',
    isPublished: false
  })

  // Auto-open form if navigating from module with ?new=true
  useEffect(() => {
    if (shouldShowForm && !loading) {
      setShowForm(true)
      setSelectedModuleId(moduleIdFromUrl)
    }
  }, [shouldShowForm, loading, moduleIdFromUrl])

  // Initialize sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, contentRes] = await Promise.all([
          fetch(`/api/instructor/courses/${params.id}`),
          fetch(`/api/instructor/courses/${params.id}/content`)
        ])

        if (courseRes.ok) {
          const courseData = await courseRes.json()
          setCourse(courseData)
        }

        if (contentRes.ok) {
          const contentData = await contentRes.json()
          setContent(contentData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id])

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    try {
      // Use S3/R2 upload via signed URL
      const result = await uploadToS3(file, {
        directory: 'courses',
        isPublic: true,
      })

      setUploadedFile({
        url: result.cdnUrl,
        filename: result.filename,
        size: result.size,
        type: result.mimeType
      })
      setFormData(prev => ({
        ...prev,
        fileUrl: result.cdnUrl,
        title: prev.title || result.filename.replace(/\.[^/.]+$/, "")
      }))
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleThumbnailUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    try {
      // Use S3/R2 upload via signed URL for thumbnails
      const result = await uploadToS3(file, {
        directory: 'thumbnails',
        isPublic: true,
      })

      setUploadedThumbnail({
        url: result.cdnUrl,
        filename: result.filename,
        size: result.size,
        type: result.mimeType
      })
      setFormData(prev => ({
        ...prev,
        thumbnailUrl: result.cdnUrl
      }))
    } catch (error) {
      console.error('Thumbnail upload error:', error)
      alert(error instanceof Error ? error.message : 'Thumbnail upload failed')
    } finally {
      setUploading(false)
    }
  }

  const clearUploadedFile = () => {
    setUploadedFile(null)
    setFormData(prev => ({
      ...prev,
      fileUrl: ''
    }))
  }

  const clearUploadedThumbnail = () => {
    setUploadedThumbnail(null)
    setFormData(prev => ({
      ...prev,
      thumbnailUrl: ''
    }))
  }

  const handleYouTubeUrl = async (url: string) => {
    if (!url) return

    setFetchingYouTube(true)
    try {
      const response = await fetch(`/api/instructor/courses/${params.id}/youtube-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      })

      if (response.ok) {
        const videoInfo = await response.json()
        setFormData(prev => ({
          ...prev,
          title: prev.title || videoInfo.title,
          fileUrl: videoInfo.watchUrl,
          thumbnailUrl: videoInfo.thumbnail
        }))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to fetch YouTube video information')
      }
    } catch (error) {
      console.error('YouTube fetch error:', error)
      alert('Failed to fetch YouTube video information')
    } finally {
      setFetchingYouTube(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting form data:', formData)
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter a title for the content.')
      return
    }

    // Validate content type specific requirements
    if (formData.type === 'YOUTUBE' && !formData.fileUrl.trim()) {
      alert('Please enter a YouTube URL.')
      return
    }

    if (formData.type === 'LINK' && !formData.fileUrl.trim()) {
      alert('Please enter a URL.')
      return
    }

    if ((formData.type === 'VIDEO' || formData.type === 'DOCUMENT' || formData.type === 'SCORM') && 
        !formData.fileUrl.trim()) {
      alert('Please upload a file or provide an external URL.')
      return
    }
    
    setSubmitting(true)
    
    try {
      const url = editingContent 
        ? `/api/instructor/courses/${params.id}/content/${editingContent.id}`
        : `/api/instructor/courses/${params.id}/content`
      
      const method = editingContent ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          moduleId: selectedModuleId // Include module context when creating content
        })
      })

      if (response.ok) {
        const newContent = await response.json()

        if (editingContent) {
          setContent(prev => prev.map(item =>
            item.id === editingContent.id ? newContent : item
          ))
        } else {
          setContent(prev => [...prev, newContent])
        }

        setShowForm(false)
        setEditingContent(null)
        setUploadedFile(null)
        setUploadedThumbnail(null)
        // Keep selectedModuleId so user can continue adding content to same module
        setFormData({
          title: '',
          type: 'TEXT',
          content: '',
          fileUrl: '',
          thumbnailUrl: '',
          isPublished: false
        })
        // Don't clear URL params - keep module context for adding more content
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        alert(`Failed to save content: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving content:', error)
      alert('Failed to save content. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: CourseContent) => {
    setEditingContent(item)
    setFormData({
      title: item.title,
      type: item.type,
      content: item.content || '',
      fileUrl: item.fileUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      isPublished: item.isPublished
    })
    
    // If there's a file URL that looks like an uploaded file, show it as uploaded
    if (item.fileUrl && item.fileUrl.startsWith('/uploads/')) {
      const filename = item.fileUrl.split('/').pop() || ''
      const originalFilename = filename.split('_').slice(1).join('_') || filename
      setUploadedFile({
        url: item.fileUrl,
        filename: originalFilename,
        size: 0, // We don't store file size, so default to 0
        type: 'application/octet-stream' // Generic type
      })
    } else {
      setUploadedFile(null)
    }

    // If there's a thumbnail URL that looks like an uploaded file, show it as uploaded
    if (item.thumbnailUrl && item.thumbnailUrl.startsWith('/uploads/')) {
      const filename = item.thumbnailUrl.split('/').pop() || ''
      const originalFilename = filename.split('_').slice(2).join('_') || filename // Skip 'thumb' and timestamp
      setUploadedThumbnail({
        url: item.thumbnailUrl,
        filename: originalFilename,
        size: 0,
        type: 'image/jpeg' // Default to jpeg for thumbnails
      })
    } else {
      setUploadedThumbnail(null)
    }
    
    setShowForm(true)
  }

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const response = await fetch(`/api/instructor/courses/${params.id}/content/${contentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setContent(prev => prev.filter(item => item.id !== contentId))
      }
    } catch (error) {
      console.error('Error deleting content:', error)
    }
  }

  const togglePublished = async (item: CourseContent) => {
    try {
      const response = await fetch(`/api/instructor/courses/${params.id}/content/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublished: !item.isPublished
        })
      })

      if (response.ok) {
        const updatedContent = await response.json()
        setContent(prev => prev.map(c => 
          c.id === item.id ? updatedContent : c
        ))
      }
    } catch (error) {
      console.error('Error updating content:', error)
    }
  }

  const getContentIcon = (type: CourseContent['type']) => {
    switch (type) {
      case 'TEXT': return FileText
      case 'VIDEO': return Video
      case 'YOUTUBE': return Video
      case 'DOCUMENT': return File
      case 'LINK': return LinkIcon
      case 'SCORM': return BookOpen
      default: return FileText
    }
  }

  const getContentIconColor = (type: CourseContent['type']) => {
    switch (type) {
      case 'TEXT': return 'text-white bg-gray-500'
      case 'VIDEO': return 'text-white bg-red-500'
      case 'YOUTUBE': return 'text-white bg-red-600'
      case 'DOCUMENT': return 'text-white bg-green-500'
      case 'LINK': return 'text-white bg-purple-500'
      case 'SCORM': return 'text-white bg-blue-500'
      default: return 'text-white bg-gray-500'
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

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link 
              href={`/instructor/courses/${params.id}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Course
            </Link>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Course Content</h1>
                {course && (
                  <p className="text-gray-600">{course.title} ({course.code})</p>
                )}
              </div>
              <button
                onClick={() => {
                  setEditingContent(null)
                  setUploadedFile(null)
                  setUploadedThumbnail(null)
                  setFormData({
                    title: '',
                    type: 'TEXT',
                    content: '',
                    fileUrl: '',
                    thumbnailUrl: '',
                    isPublished: false
                  })
                  setShowForm(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Content
              </button>
            </div>
          </div>

          {/* Content Form */}
          {showForm && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingContent ? 'Edit Content' : 'Add New Content'}
                </h3>
                {selectedModuleId && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      This content will be added to the selected module.
                    </p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as CourseContent['type']})}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="TEXT">Text Content</option>
                      <option value="YOUTUBE">YouTube Video</option>
                      <option value="VIDEO">Video File</option>
                      <option value="DOCUMENT">Document</option>
                      <option value="LINK">External Link</option>
                      <option value="SCORM">SCORM Package</option>
                    </select>
                  </div>

                  {(formData.type === 'TEXT') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Content</label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        rows={6}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your content here..."
                      />
                    </div>
                  )}

                  {formData.type === 'YOUTUBE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">YouTube URL</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="url"
                          value={formData.fileUrl}
                          onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                          onBlur={(e) => {
                            if (e.target.value && e.target.value !== formData.fileUrl) {
                              handleYouTubeUrl(e.target.value)
                            }
                          }}
                          className="flex-1 block w-full border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                        <button
                          type="button"
                          onClick={() => handleYouTubeUrl(formData.fileUrl)}
                          disabled={fetchingYouTube || !formData.fileUrl}
                          className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm disabled:opacity-50"
                        >
                          {fetchingYouTube ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            'Fetch Info'
                          )}
                        </button>
                      </div>
                      {formData.thumbnailUrl && formData.type === 'YOUTUBE' && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={formData.thumbnailUrl} 
                              alt="YouTube thumbnail" 
                              className="h-16 w-28 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-900">
                                YouTube video information fetched successfully!
                              </p>
                              <p className="text-sm text-green-700">
                                Title and thumbnail will be automatically set.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.type === 'LINK' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL</label>
                      <input
                        type="url"
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://example.com"
                      />
                    </div>
                  )}

                  {(formData.type === 'VIDEO' || formData.type === 'DOCUMENT' || formData.type === 'SCORM') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {formData.type === 'VIDEO' ? 'Video File' : formData.type === 'DOCUMENT' ? 'Document File' : 'SCORM Package'}
                      </label>
                      
                      {uploadedFile ? (
                        <div className="border border-green-200 bg-green-50 rounded-md p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <File className="h-8 w-8 text-green-600" />
                              <div>
                                <p className="font-medium text-green-900">{uploadedFile.filename}</p>
                                <p className="text-sm text-green-700">
                                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={clearUploadedFile}
                              className="text-green-600 hover:text-green-800"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                            onDrop={(e) => {
                              e.preventDefault()
                              const files = Array.from(e.dataTransfer.files)
                              if (files[0]) handleFileUpload(files[0])
                            }}
                            onDragOver={(e) => e.preventDefault()}
                          >
                            {uploading ? (
                              <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="mt-2 text-sm text-gray-600">Uploading...</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <Upload className="h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">
                                  Drop your file here, or{' '}
                                  <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                                    browse
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept={
                                        formData.type === 'VIDEO' 
                                          ? 'video/*'
                                          : formData.type === 'DOCUMENT'
                                          ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt'
                                          : '.zip'
                                      }
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFileUpload(file)
                                      }}
                                    />
                                  </label>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Maximum file size: 200MB
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-center text-sm text-gray-500">
                            OR
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">External URL</label>
                            <input
                              type="url"
                              value={formData.fileUrl}
                              onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="https://example.com/file.pdf"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Thumbnail Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thumbnail Image (Optional)
                    </label>
                    
                    {uploadedThumbnail ? (
                      <div className="border border-green-200 bg-green-50 rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={uploadedThumbnail.url} 
                              alt="Thumbnail" 
                              className="h-16 w-16 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium text-green-900">{uploadedThumbnail.filename}</p>
                              <p className="text-sm text-green-700">
                                {(uploadedThumbnail.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearUploadedThumbnail}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                        onDrop={(e) => {
                          e.preventDefault()
                          const files = Array.from(e.dataTransfer.files)
                          if (files[0]) handleThumbnailUpload(files[0])
                        }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">
                            Drop thumbnail here, or{' '}
                            <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                              browse
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleThumbnailUpload(file)
                                }}
                              />
                            </label>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 2MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                      Publish immediately
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        setEditingContent(null)
                        setUploadedFile(null)
                        setUploadedThumbnail(null)
                        setSelectedModuleId(null)
                        // Clear URL params when cancelling
                        if (moduleIdFromUrl) {
                          router.replace(`/instructor/courses/${params.id}/content`)
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingContent ? 'Updating...' : 'Creating...'}
                        </div>
                      ) : (
                        `${editingContent ? 'Update' : 'Create'} Content`
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Content List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Content Items ({content.length})
                </h3>
                {hasOrderChanged && (
                  <button
                    onClick={async () => {
                      const contentIds = content.map(item => item.id)
                      console.log('Content IDs to reorder:', contentIds)
                      setReordering(true)
                      try {
                        console.log('Sending request to reorder endpoint:', `/api/instructor/courses/${params.id}/content/reorder`)
                        console.log('Request payload:', { contentOrder: contentIds })
                        
                        const response = await fetch(
                          `/api/instructor/courses/${params.id}/content/reorder`, 
                          {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contentOrder: contentIds })
                          }
                        )
                        
                        console.log('Response status:', response.status)
                        
                        if (response.ok) {
                          const updatedContent = await response.json()
                          console.log('Received updated content:', updatedContent)
                          setContent(updatedContent)
                          setHasOrderChanged(false)
                        } else {
                          const errorText = await response.text()
                          console.error('Error response:', errorText)
                          let errorJson = { error: 'Unknown error' }
                          try {
                            errorJson = JSON.parse(errorText)
                          } catch (e) {
                            console.error('Failed to parse error as JSON')
                          }
                          alert(`Failed to save order: ${errorJson.error || 'Unknown error'}`)
                        }
                      } catch (error) {
                        console.error('Error saving content order:', error)
                        alert('Failed to save content order. Please try again.')
                      } finally {
                        setReordering(false)
                      }
                    }}
                    disabled={reordering}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reordering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save Order
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {content.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No content yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first piece of content.
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => {
                    const { active, over } = event;
                    
                    if (!over) return;
                    
                    if (active.id !== over.id) {
                      setContent((items) => {
                        const oldIndex = items.findIndex(item => item.id === active.id);
                        const newIndex = items.findIndex(item => item.id === over.id);
                        
                        const newItems = arrayMove(items, oldIndex, newIndex);
                        setHasOrderChanged(true);
                        return newItems;
                      });
                    }
                  }}
                >
                  <SortableContext
                    items={content.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {content.map((item, index) => (
                        <SortableItem 
                          key={item.id} 
                          id={item.id}
                          index={index}
                          item={item}
                          getContentIcon={getContentIcon}
                          getContentIconColor={getContentIconColor}
                          handleEdit={handleEdit}
                          togglePublished={togglePublished}
                          handleDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}