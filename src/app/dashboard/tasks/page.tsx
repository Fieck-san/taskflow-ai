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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { TaskCard } from "@/components/tasks/task-card";
import {
  CheckSquare,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  tags: string[];
  project: {
    id: string;
    name: string;
    color: string;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
        setFilteredTasks(data);
      }
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    let filtered = tasks;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "IN_REVIEW":
        return "bg-purple-100 text-purple-800";
      case "DONE":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isTaskOverdue = (dueDate: string | null, status: string) => {
    return dueDate && new Date(dueDate) < new Date() && status !== "DONE";
  };

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "TODO").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    inReview: tasks.filter(t => t.status === "IN_REVIEW").length,
    done: tasks.filter(t => t.status === "DONE").length,
    overdue: tasks.filter(t => isTaskOverdue(t.dueDate, t.status)).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CheckSquare className="mr-3 h-8 w-8" />
            My Tasks
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track your tasks across all projects
          </p>
        </div>
        <CreateTaskForm onTaskCreated={fetchTasks} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{taskStats.inReview}</p>
              <p className="text-sm text-gray-600">In Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{taskStats.done}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
              <p className="text-sm text-gray-600">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isOverdue = isTaskOverdue(task.dueDate, task.status);
            
            return (
              <Card key={task.id} className={isOverdue ? "border-red-200 bg-red-50" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace("_", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: task.project.color }}
                          />
                          {task.project.name}
                        </span>
                        
                        {task.dueDate && (
                          <span className={`flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(task.dueDate), "MMM d, yyyy")}
                          </span>
                        )}
                        
                        {task.estimatedHours && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {task.estimatedHours}h estimated
                          </span>
                        )}
                        
                        {task.assignee && (
                          <span>Assigned to {task.assignee.name}</span>
                        )}
                      </div>
                      
                      {task.tags.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {task.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters to see more tasks."
                  : "Get started by creating your first task."}
              </p>
              {!searchQuery && statusFilter === "all" && priorityFilter === "all" && (
                <CreateTaskForm onTaskCreated={fetchTasks} />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}