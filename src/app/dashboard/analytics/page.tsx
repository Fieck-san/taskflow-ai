"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Users,
  Calendar,
  CheckSquare,
  AlertCircle,
  Award,
} from "lucide-react";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import toast from "react-hot-toast";

interface AnalyticsData {
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
    cancelled: number;
  };
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
    overdue: number;
  };
  productivity: {
    tasksCompletedThisWeek: number;
    tasksCompletedLastWeek: number;
    averageCompletionTime: number;
    onTimeCompletionRate: number;
  };
  team: {
    totalMembers: number;
    activeMembers: number;
    topPerformer: {
      name: string;
      tasksCompleted: number;
    } | null;
  };
  timeTracking: {
    totalHoursLogged: number;
    averageHoursPerTask: number;
    mostTimeSpentProject: {
      name: string;
      hours: number;
    } | null;
  };
}

interface Project {
  id: string;
  name: string;
  status: string;
  tasks: Array<{
    status: string;
    dueDate: string | null;
    estimatedHours: number | null;
    actualHours: number | null;
    assignee: {
      id: string;
      name: string;
    } | null;
  }>;
  _count: { tasks: number; members: number };
  createdAt: string;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  const fetchAnalyticsData = async () => {
    try {
      // Fetch projects and tasks data
      const projectsResponse = await fetch("/api/projects");
      const tasksResponse = await fetch("/api/tasks");

      if (projectsResponse.ok && tasksResponse.ok) {
        const projectsData = await projectsResponse.json();
        const tasksData = await tasksResponse.json();
        
        setProjects(projectsData);

        // Calculate analytics
        const now = new Date();
        const oneWeekAgo = subWeeks(now, 1);
        const twoWeeksAgo = subWeeks(now, 2);

        // Project analytics
        const projectStats = {
          total: projectsData.length,
          active: projectsData.filter((p: Project) => p.status === "ACTIVE").length,
          completed: projectsData.filter((p: Project) => p.status === "COMPLETED").length,
          onHold: projectsData.filter((p: Project) => p.status === "ON_HOLD").length,
          cancelled: projectsData.filter((p: Project) => p.status === "CANCELLED").length,
        };

        // Task analytics
        const taskStats = {
          total: tasksData.length,
          todo: tasksData.filter((t: any) => t.status === "TODO").length,
          inProgress: tasksData.filter((t: any) => t.status === "IN_PROGRESS").length,
          inReview: tasksData.filter((t: any) => t.status === "IN_REVIEW").length,
          done: tasksData.filter((t: any) => t.status === "DONE").length,
          overdue: tasksData.filter((t: any) => 
            t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
          ).length,
        };

        // Productivity analytics
        const tasksCompletedThisWeek = tasksData.filter((t: any) => 
          t.status === "DONE" && new Date(t.updatedAt) >= oneWeekAgo
        ).length;
        
        const tasksCompletedLastWeek = tasksData.filter((t: any) => 
          t.status === "DONE" && 
          new Date(t.updatedAt) >= twoWeeksAgo && 
          new Date(t.updatedAt) < oneWeekAgo
        ).length;

        const completedTasks = tasksData.filter((t: any) => t.status === "DONE");
        const onTimeCompletions = completedTasks.filter((t: any) => 
          !t.dueDate || new Date(t.updatedAt) <= new Date(t.dueDate)
        ).length;
        
        const onTimeCompletionRate = completedTasks.length > 0 
          ? (onTimeCompletions / completedTasks.length) * 100 
          : 0;

        // Team analytics
        const allMembers = new Set();
        projectsData.forEach((project: Project) => {
          // Add project owner
          if (project.id) allMembers.add(session?.user?.id);
          // Add project members would go here when member data is available
        });

        // Calculate top performer (simplified)
        const topPerformer = {
          name: session?.user?.name || "You",
          tasksCompleted: tasksCompletedThisWeek,
        };

        // Time tracking analytics
        const tasksWithHours = tasksData.filter((t: any) => t.actualHours);
        const totalHoursLogged = tasksWithHours.reduce((sum: number, task: any) => 
          sum + (task.actualHours || 0), 0
        );
        const averageHoursPerTask = tasksWithHours.length > 0 
          ? totalHoursLogged / tasksWithHours.length 
          : 0;

        setAnalytics({
          projects: projectStats,
          tasks: taskStats,
          productivity: {
            tasksCompletedThisWeek,
            tasksCompletedLastWeek,
            averageCompletionTime: 3.5, // Placeholder
            onTimeCompletionRate,
          },
          team: {
            totalMembers: allMembers.size,
            activeMembers: allMembers.size,
            topPerformer,
          },
          timeTracking: {
            totalHoursLogged,
            averageHoursPerTask,
            mostTimeSpentProject: projectsData.length > 0 ? {
              name: projectsData[0].name,
              hours: Math.round(totalHoursLogged * 0.4), // Placeholder calculation
            } : null,
          },
        });
      }
    } catch (error) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [session]);

  const getChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) return { type: "neutral", value: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      type: change > 0 ? "positive" : change < 0 ? "negative" : "neutral",
      value: Math.abs(change),
    };
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const weeklyChange = getChangeIndicator(
    analytics.productivity.tasksCompletedThisWeek,
    analytics.productivity.tasksCompletedLastWeek
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 h-8 w-8" />
            Analytics & Insights
          </h1>
          <p className="text-gray-600 mt-1">
            Track your productivity and project performance
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.projects.total}</p>
                <p className="text-xs text-green-600">
                  {analytics.projects.active} active
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.tasks.done}</p>
                <div className="flex items-center text-xs">
                  {weeklyChange.type === "positive" ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : weeklyChange.type === "negative" ? (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  ) : null}
                  <span className={
                    weeklyChange.type === "positive" ? "text-green-600" :
                    weeklyChange.type === "negative" ? "text-red-600" : "text-gray-600"
                  }>
                    {weeklyChange.value.toFixed(1)}% from last week
                  </span>
                </div>
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
                <p className="text-sm font-medium text-gray-600">On-Time Completion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.productivity.onTimeCompletionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600">Delivery performance</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.team.totalMembers}</p>
                <p className="text-xs text-blue-600">
                  {analytics.team.activeMembers} active
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Project Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${analytics.projects.total > 0 ? (analytics.projects.active / analytics.projects.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{analytics.projects.active}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${analytics.projects.total > 0 ? (analytics.projects.completed / analytics.projects.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{analytics.projects.completed}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">On Hold</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ 
                        width: `${analytics.projects.total > 0 ? (analytics.projects.onHold / analytics.projects.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{analytics.projects.onHold}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckSquare className="mr-2 h-5 w-5" />
              Task Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">To Do</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full"
                      style={{ 
                        width: `${analytics.tasks.total > 0 ? (analytics.tasks.todo / analytics.tasks.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{analytics.tasks.todo}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">In Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${analytics.tasks.total > 0 ? (analytics.tasks.inProgress / analytics.tasks.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{analytics.tasks.inProgress}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Done</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${analytics.tasks.total > 0 ? (analytics.tasks.done / analytics.tasks.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{analytics.tasks.done}</span>
                </div>
              </div>
              {analytics.tasks.overdue > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-600">Overdue</span>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{analytics.tasks.overdue}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Productivity Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Productivity Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.productivity.tasksCompletedThisWeek}
                </p>
                <p className="text-sm text-gray-600">Tasks this week</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {analytics.productivity.averageCompletionTime}d
                </p>
                <p className="text-sm text-gray-600">Avg completion time</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Weekly Progress</span>
                <Badge variant={
                  weeklyChange.type === "positive" ? "default" :
                  weeklyChange.type === "negative" ? "destructive" : "secondary"
                }>
                  {weeklyChange.type === "positive" ? "+" : weeklyChange.type === "negative" ? "-" : ""}
                  {weeklyChange.value.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.team.topPerformer && (
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium">Top Performer</p>
                  <p className="text-sm text-gray-600">{analytics.team.topPerformer.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">
                    {analytics.team.topPerformer.tasksCompleted}
                  </p>
                  <p className="text-sm text-gray-600">tasks completed</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total hours logged</span>
                <span className="font-medium">{analytics.timeTracking.totalHoursLogged}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg hours per task</span>
                <span className="font-medium">{analytics.timeTracking.averageHoursPerTask.toFixed(1)}h</span>
              </div>
              {analytics.timeTracking.mostTimeSpentProject && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Most time spent</span>
                  <span className="font-medium">{analytics.timeTracking.mostTimeSpentProject.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}