"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { AIProjectForm } from "@/components/projects/ai-project-form";
import {
  FolderOpen,
  CheckSquare,
  Users,
  Clock,
  TrendingUp,
  Plus,
  Calendar,
  AlertCircle,
  Sparkles,
  Bot,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface DashboardStats {
  projectCount: number;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  tasks: Array<{ status: string }>;
  _count: { tasks: number; members: number };
}

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate: string | null;
  status: string;
  project: { name: string; color: string };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    projectCount: 0,
    activeTaskCount: 0,
    completedTaskCount: 0,
    overdueTaskCount: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects
      const projectsResponse = await fetch("/api/projects");
      let projects = [];
      if (projectsResponse.ok) {
        projects = await projectsResponse.json();
        setRecentProjects(projects.slice(0, 3));
      }

      // Fetch tasks
      const tasksResponse = await fetch("/api/tasks");
      let tasks = [];
      if (tasksResponse.ok) {
        tasks = await tasksResponse.json();
        setUpcomingTasks(tasks.slice(0, 3));
      }

      // Calculate stats
      const projectCount = projects.length;
      const allTasks = tasks;
      const activeTaskCount = allTasks.filter((t: Task) =>
        ["TODO", "IN_PROGRESS", "IN_REVIEW"].includes(t.status)
      ).length;
      const completedTaskCount = allTasks.filter(
        (t: Task) => t.status === "DONE"
      ).length;
      const overdueTaskCount = allTasks.filter(
        (t: Task) =>
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
      ).length;

      setStats({
        projectCount,
        activeTaskCount,
        completedTaskCount,
        overdueTaskCount,
      });
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "bg-blue-100 text-blue-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isTaskOverdue = (dueDate: string | null, status: string) => {
    return dueDate && new Date(dueDate) < new Date() && status !== "DONE";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 h-24 rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    );
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
        <div className="flex space-x-2">
          <CreateProjectForm onProjectCreated={fetchDashboardData} />
          <AIProjectForm onProjectCreated={fetchDashboardData} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Projects
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.projectCount}
                </p>
                <p className="text-xs text-gray-500">Total projects</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeTaskCount}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.completedTaskCount} completed
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recentProjects.reduce(
                    (acc, p) => acc + p._count.members + 1,
                    0
                  )}
                </p>
                <p className="text-xs text-gray-500">Across all projects</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Overdue Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overdueTaskCount}
                </p>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <FolderOpen className="mr-2 h-5 w-5" />
                  Recent Projects
                </CardTitle>
                <CardDescription>Your most active projects</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/projects">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => {
                const completedTasks = project.tasks.filter(
                  (t) => t.status === "DONE"
                ).length;
                const totalTasks = project.tasks.length;
                const progress =
                  totalTasks > 0
                    ? Math.round((completedTasks / totalTasks) * 100)
                    : 0;

                return (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {project.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace("_", " ")}
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="mr-1 h-3 w-3" />
                            {project._count.members + 1} members
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <CheckSquare className="mr-1 h-3 w-3" />
                            {completedTasks}/{totalTasks} tasks
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="mx-auto h-8 w-8 mb-2" />
                <p>No projects yet</p>
                <CreateProjectForm onProjectCreated={fetchDashboardData} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <CheckSquare className="mr-2 h-5 w-5" />
                  Recent Tasks
                </CardTitle>
                <CardDescription>
                  Tasks that need your attention
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/tasks">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => {
                const isOverdue = isTaskOverdue(task.dueDate, task.status);

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {task.project.name}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <div className="flex items-center text-sm text-gray-500">
                            {isOverdue && (
                              <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
                            )}
                            <Calendar className="mr-1 h-3 w-3" />
                            <span className={isOverdue ? "text-red-600" : ""}>
                              {format(new Date(task.dueDate), "MMM d")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="mx-auto h-8 w-8 mb-2" />
                <p>No tasks yet</p>
                <p className="text-sm">Create a project to get started</p>
              </div>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CreateProjectForm onProjectCreated={fetchDashboardData}>
              <Button
                variant="outline"
                className="justify-start h-auto p-4 w-full"
              >
                <div className="text-left">
                  <div className="font-medium">Create New Project</div>
                  <div className="text-sm text-gray-500">
                    Start organizing your work
                  </div>
                </div>
              </Button>
            </CreateProjectForm>

            <AIProjectForm onProjectCreated={fetchDashboardData}>
              <Button
                variant="outline"
                className="justify-start h-auto p-4 w-full"
              >
                <div className="text-left">
                  <div className="font-medium flex items-center">
                    <Sparkles className="mr-1 h-4 w-4 text-purple-600" />
                    AI Project Creation
                  </div>
                  <div className="text-sm text-gray-500">
                    Let AI suggest tasks for you
                  </div>
                </div>
              </Button>
            </AIProjectForm>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              asChild
            >
              <Link href="/dashboard/ai">
                <div className="text-left">
                  <div className="font-medium flex items-center">
                    <Bot className="mr-1 h-4 w-4 text-blue-600" />
                    AI Assistant
                  </div>
                  <div className="text-sm text-gray-500">
                    Chat with your AI helper
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              asChild
            >
              <Link href="/dashboard/analytics">
                <div className="text-left">
                  <div className="font-medium">View Analytics</div>
                  <div className="text-sm text-gray-500">
                    Check your productivity metrics
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
