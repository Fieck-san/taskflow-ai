"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FolderOpen, 
  CheckSquare, 
  Users, 
  Clock,
  TrendingUp,
  Plus,
  Calendar,
  AlertCircle
} from "lucide-react"

// Mock data - in real app this would come from your database
const stats = [
  {
    title: "Active Projects",
    value: "3",
    change: "+1 this week",
    icon: FolderOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Tasks in Progress",
    value: "12",
    change: "+4 today",
    icon: CheckSquare,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Team Members",
    value: "8",
    change: "+2 this month",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Hours This Week",
    value: "24.5",
    change: "85% of goal",
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
]

const recentProjects = [
  {
    id: 1,
    name: "TaskFlow AI Dashboard",
    status: "In Progress",
    progress: 75,
    dueDate: "2025-07-15",
    members: 3,
  },
  {
    id: 2,
    name: "Mobile App Redesign",
    status: "Planning",
    progress: 25,
    dueDate: "2025-08-01",
    members: 5,
  },
  {
    id: 3,
    name: "API Documentation",
    status: "In Progress",
    progress: 60,
    dueDate: "2025-07-10",
    members: 2,
  },
]

const upcomingTasks = [
  {
    id: 1,
    title: "Review dashboard wireframes",
    project: "TaskFlow AI Dashboard",
    dueDate: "Today",
    priority: "High",
  },
  {
    id: 2,
    title: "Database schema optimization",
    project: "TaskFlow AI Dashboard",
    dueDate: "Tomorrow",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Team meeting preparation",
    project: "Mobile App Redesign",
    dueDate: "Jun 25",
    priority: "Low",
  },
]

export default function DashboardPage() {
  const { data: session } = useSession()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {session?.user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderOpen className="mr-2 h-5 w-5" />
              Recent Projects
            </CardTitle>
            <CardDescription>
              Your most active projects this week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">{project.status}</Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="mr-1 h-3 w-3" />
                      {project.members} members
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="mr-1 h-3 w-3" />
                      Due {project.dueDate}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckSquare className="mr-2 h-5 w-5" />
              Upcoming Tasks
            </CardTitle>
            <CardDescription>
              Tasks that need your attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{task.project}</p>
                  <div className="flex items-center space-x-3 mt-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      {task.dueDate === "Today" && (
                        <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
                      )}
                      <Calendar className="mr-1 h-3 w-3" />
                      {task.dueDate}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Create New Task</div>
                <div className="text-sm text-gray-500">Add a task to any project</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Invite Team Member</div>
                <div className="text-sm text-gray-500">Add someone to your workspace</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">View Analytics</div>
                <div className="text-sm text-gray-500">Check your productivity metrics</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}