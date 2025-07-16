"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreateProjectForm } from "@/components/projects/create-project-form"
import { 
  FolderOpen, 
  Users, 
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  CheckSquare,
  Clock,
  Trash2,
  Edit
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import toast from "react-hot-toast"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  startDate: string | null
  endDate: string | null
  color: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  members: Array<{
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  }>
  tasks: Array<{
    id: string
    status: string
    priority: string
  }>
  _count: {
    tasks: number
    members: number
  }
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        toast.error("Failed to fetch projects")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "bg-blue-100 text-blue-800"
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETED":
        return "bg-gray-100 text-gray-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTaskStats = (tasks: Project['tasks']) => {
    const completed = tasks.filter(t => t.status === "DONE").length
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length
    const todo = tasks.filter(t => t.status === "TODO").length
    return { completed, inProgress, todo, total: tasks.length }
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectToDelete.id))
        toast.success('Project deleted successfully')
        setDeleteDialogOpen(false)
        setProjectToDelete(null)
      } else {
        toast.error('Failed to delete project')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (project: Project, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Projects</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your projects and track progress
          </p>
        </div>
        <CreateProjectForm onProjectCreated={fetchProjects} />
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Create your first project to get started"
              }
            </p>
            {!searchTerm && <CreateProjectForm onProjectCreated={fetchProjects} />}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const taskStats = getTaskStats(project.tasks)
            const progressPercentage = taskStats.total > 0 
              ? Math.round((taskStats.completed / taskStats.total) * 100) 
              : 0

            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: project.color }}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/projects/${project.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Project
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={(e) => openDeleteDialog(project, e)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Status and Priority */}
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <CheckSquare className="mr-1 h-4 w-4" />
                        {taskStats.completed}/{taskStats.total} tasks
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="mr-1 h-4 w-4" />
                        {project._count.members + 1} members
                      </div>
                    </div>

                    {/* Dates */}
                    {(project.startDate || project.endDate) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="mr-1 h-4 w-4" />
                        {project.startDate && format(new Date(project.startDate), "MMM d")}
                        {project.startDate && project.endDate && " - "}
                        {project.endDate && format(new Date(project.endDate), "MMM d, yyyy")}
                      </div>
                    )}

                    {/* Owner */}
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                        {project.owner.image ? (
                          <img 
                            src={project.owner.image} 
                            alt={project.owner.name || ""} 
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {project.owner.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <span>
                        {project.owner.id === session?.user?.id ? "You" : project.owner.name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
              All tasks, comments, and project data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}