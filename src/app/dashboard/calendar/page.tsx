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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Plus,
  Filter,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import toast from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string;
  project: {
    id: string;
    name: string;
    color: string;
  };
  assignee: {
    id: string;
    name: string;
  } | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "task" | "milestone" | "meeting";
  priority: string;
  status: string;
  project: {
    name: string;
    color: string;
  };
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const tasksData = await response.json();
        const tasksWithDueDates = tasksData.filter((task: Task) => task.dueDate);
        setTasks(tasksWithDueDates);
        
        // Convert tasks to calendar events
        const taskEvents: CalendarEvent[] = tasksWithDueDates.map((task: Task) => ({
          id: task.id,
          title: task.title,
          date: task.dueDate,
          type: "task" as const,
          priority: task.priority,
          status: task.status,
          project: task.project,
        }));
        
        setEvents(taskEvents);
      }
    } catch (error) {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    }).filter(event => {
      if (filterStatus !== "all" && event.status !== filterStatus) return false;
      if (filterPriority !== "all" && event.priority !== filterPriority) return false;
      return true;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-green-500";
      default:
        return "bg-gray-500";
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isTaskOverdue = (date: string, status: string) => {
    return new Date(date) < new Date() && status !== "DONE";
  };

  const upcomingTasks = tasks
    .filter(task => new Date(task.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const overdueTasks = tasks.filter(task => isTaskOverdue(task.dueDate, task.status));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
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
            <CalendarIcon className="mr-3 h-8 w-8" />
            Calendar
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage your tasks and deadlines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {format(currentDate, "MMMM yyyy")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelectedDate = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                        ${isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50"}
                        ${isSelectedDate ? "ring-2 ring-blue-500" : ""}
                        ${isTodayDate ? "bg-blue-50 border-blue-200" : ""}
                      `}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isTodayDate ? "text-blue-600" : 
                        isCurrentMonth ? "text-gray-900" : "text-gray-400"
                      }`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded truncate"
                            style={{ backgroundColor: event.project.color + "20", color: event.project.color }}
                          >
                            <div className="flex items-center gap-1">
                              <div 
                                className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`}
                              />
                              {event.title}
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(task.status)} variant="secondary">
                        {task.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(task.dueDate), "MMM d")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.project.color }}
                      />
                      <span className="text-xs text-gray-600">{task.project.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No upcoming tasks</p>
              )}
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-red-600">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(task.status)} variant="secondary">
                        {task.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-red-600">
                        Due {format(new Date(task.dueDate), "MMM d")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.project.color }}
                      />
                      <span className="text-xs text-gray-600">{task.project.name}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Selected Date Details */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, "MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getEventsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-2">
                    {getEventsForDate(selectedDate).map((event) => (
                      <div key={event.id} className="p-2 border rounded">
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(event.status)} variant="secondary">
                            {event.status.replace("_", " ")}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: event.project.color }}
                            />
                            <span className="text-xs text-gray-600">{event.project.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No events on this date</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}