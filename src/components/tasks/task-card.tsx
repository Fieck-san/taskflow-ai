"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Calendar, 
  Clock,
  User,
  Tag,
  Edit,
  Trash2
} from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  estimatedHours: number | null
  actualHours: number | null
  tags: string[]
  createdAt: string
  updatedAt: string
  assignee: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
}

interface TaskCardProps {
  task: Task
  onTaskUpdated?: () => void
}

export function TaskCard({ task, onTaskUpdated }: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-200"
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "IN_REVIEW":
        return "bg-purple-100 text-purple-800"
      case "DONE":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const updateTaskStatus = async (newStatus: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success("Task updated successfully!")
        if (onTaskUpdated) {
          onTaskUpdated()
        }
      } else {
        toast.error("Failed to update task")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Task deleted successfully!")
        if (onTaskUpdated) {
          onTaskUpdated()
        }
      } else {
        toast.error("Failed to delete task")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE"

  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? "border-red-200" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-sm line-clamp-2 mb-2">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updateTaskStatus("TODO")}>
                Mark as To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateTaskStatus("IN_PROGRESS")}>
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateTaskStatus("IN_REVIEW")}>
                Mark as In Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateTaskStatus("DONE")}>
                Mark as Done
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-3 w-3" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={deleteTask}
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Priority Badge */}
        <div className="flex items-center space-x-2">
          <Badge className={getPriorityColor(task.priority)} variant="outline">
            {task.priority}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center text-xs text-gray-600">
            <Calendar className="mr-1 h-3 w-3" />
            <span className={isOverdue ? "text-red-600" : ""}>
              {format(new Date(task.dueDate), "MMM d, yyyy")}
            </span>
          </div>
        )}

        {/* Estimated Hours */}
        {task.estimatedHours && (
          <div className="flex items-center text-xs text-gray-600">
            <Clock className="mr-1 h-3 w-3" />
            {task.estimatedHours}h estimated
          </div>
        )}

        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center text-xs text-gray-600">
            <User className="mr-1 h-3 w-3" />
            {task.assignee.name || task.assignee.email}
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-1">
            <Tag className="h-3 w-3 text-gray-400" />
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Quick Status Actions */}
        <div className="flex space-x-1">
          {task.status === "TODO" && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6"
              onClick={() => updateTaskStatus("IN_PROGRESS")}
              disabled={isLoading}
            >
              Start
            </Button>
          )}
          {task.status === "IN_PROGRESS" && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6"
              onClick={() => updateTaskStatus("IN_REVIEW")}
              disabled={isLoading}
            >
              Review
            </Button>
          )}
          {task.status === "IN_REVIEW" && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6"
              onClick={() => updateTaskStatus("DONE")}
              disabled={isLoading}
            >
              Complete
            </Button>
          )}
          {task.status === "DONE" && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6"
              onClick={() => updateTaskStatus("TODO")}
              disabled={isLoading}
            >
              Reopen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}