"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { TaskCard } from "@/components/tasks/task-card";
import {
  ArrowLeft,
  Users,
  Calendar,
  CheckSquare,
  Clock,
  BarChart3,
  Plus,
  Settings,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  members: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    estimatedHours: number | null;
    actualHours: number | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    assignee: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    } | null;
  }>;
  activities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else if (response.status === 404) {
        toast.error("Project not found");
        router.push("/dashboard/projects");
      } else {
        toast.error("Failed to fetch project");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

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
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskStats = () => {
    if (!project) return { completed: 0, inProgress: 0, todo: 0, total: 0 };

    const completed = project.tasks.filter((t) => t.status === "DONE").length;
    const inProgress = project.tasks.filter(
      (t) => t.status === "IN_PROGRESS"
    ).length;
    const todo = project.tasks.filter((t) => t.status === "TODO").length;
    const inReview = project.tasks.filter(
      (t) => t.status === "IN_REVIEW"
    ).length;

    return {
      completed,
      inProgress,
      todo,
      inReview,
      total: project.tasks.length,
    };
  };

  const groupTasksByStatus = () => {
    if (!project) return {};

    return project.tasks.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    }, {} as Record<string, typeof project.tasks>);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-8 w-64 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
        <p className="text-gray-600 mt-2">
          The project you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const taskStats = getTaskStats();
  const progressPercentage =
    taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;

  const tasksByStatus = groupTasksByStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mt-1">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <CreateTaskForm projectId={project.id} onTaskCreated={fetchProject} />
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progressPercentage}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {taskStats.total}
                </p>
                <p className="text-xs text-gray-500">
                  {taskStats.completed} completed
                </p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Team Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {project.members.length + 1}
                </p>
                <p className="text-xs text-gray-500">Including owner</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due Date</p>
                <p className="text-lg font-bold text-gray-900">
                  {project.endDate
                    ? format(new Date(project.endDate), "MMM d, yyyy")
                    : "Not set"}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <div className="flex space-x-4 mb-6">
        <Badge className={getStatusColor(project.status)}>
          {project.status.replace("_", " ")}
        </Badge>
        <Badge className={getPriorityColor(project.priority)}>
          {project.priority}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({taskStats.total})</TabsTrigger>
          <TabsTrigger value="team">
            Team ({project.members.length + 1})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Status Overview */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Task Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {taskStats.todo}
                      </div>
                      <div className="text-sm text-blue-600">To Do</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {taskStats.inProgress}
                      </div>
                      <div className="text-sm text-yellow-600">In Progress</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {taskStats.inReview}
                      </div>
                      <div className="text-sm text-purple-600">In Review</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {taskStats.completed}
                      </div>
                      <div className="text-sm text-green-600">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Info */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">Owner</div>
                    <div className="flex items-center mt-1">
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
                      <span className="text-sm">
                        {project.owner.id === session?.user?.id
                          ? "You"
                          : project.owner.name}
                      </span>
                    </div>
                  </div>

                  {project.startDate && (
                    <div>
                      <div className="text-sm text-gray-600">Start Date</div>
                      <div className="text-sm">
                        {format(new Date(project.startDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  )}

                  {project.endDate && (
                    <div>
                      <div className="text-sm text-gray-600">End Date</div>
                      <div className="text-sm">
                        {format(new Date(project.endDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-gray-600">Created</div>
                    <div className="text-sm">
                      {format(new Date(project.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].map((status) => (
              <div key={status}>
                <h3 className="font-medium text-gray-900 mb-3">
                  {status.replace("_", " ")} (
                  {(tasksByStatus[status] || []).length})
                </h3>
                <div className="space-y-3">
                  {(tasksByStatus[status] || []).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onTaskUpdated={fetchProject}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>People working on this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Owner */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {project.owner.image ? (
                        <img
                          src={project.owner.image}
                          alt={project.owner.name || ""}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {project.owner.name?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {project.owner.id === session?.user?.id
                          ? "You"
                          : project.owner.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {project.owner.email}
                      </div>
                    </div>
                  </div>
                  <Badge>Owner</Badge>
                </div>

                {/* Members */}
                {project.members.map((member) => (
                  <div
                    key={member.user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        {member.user.image ? (
                          <img
                            src={member.user.image}
                            alt={member.user.name || ""}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {member.user.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.user.id === session?.user?.id
                            ? "You"
                            : member.user.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">Member</Badge>
                  </div>
                ))}

                {project.members.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto h-8 w-8 mb-2" />
                    <p>No team members yet</p>
                    <Button variant="outline" className="mt-2">
                      <Plus className="mr-2 h-4 w-4" />
                      Invite Members
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and changes to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.activities.length > 0 ? (
                <div className="space-y-4">
                  {project.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        {activity.user.image ? (
                          <img
                            src={activity.user.image}
                            alt={activity.user.name || ""}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {activity.user.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.user.id === session?.user?.id
                              ? "You"
                              : activity.user.name}
                          </span>{" "}
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(
                            new Date(activity.createdAt),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="mx-auto h-8 w-8 mb-2" />
                  <p>No activity yet</p>
                  <p className="text-sm">
                    Activity will appear here as you work on the project
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
