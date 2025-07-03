"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIProjectForm } from "@/components/projects/ai-project-form";
import {
  Bot,
  Sparkles,
  Send,
  BarChart3,
  Brain,
  Lightbulb,
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ProjectInsight {
  projectId: string;
  projectName: string;
  insights: string;
  metrics: {
    healthScore: number;
    completionRate: number;
    overdueRate: number;
    daysUntilDeadline: number | null;
  };
  generatedAt: string;
}

export default function AIDashboardPage() {
  const { data: session } = useSession();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content:
        "Hello! I'm your TaskFlow AI assistant. I can help you analyze your projects, suggest improvements, prioritize tasks, and answer questions about project management. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projectInsights, setProjectInsights] = useState<ProjectInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState<
    Record<string, boolean>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat-mock", {
        // Using mock API for now
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          context: {
            projectId: selectedProject || undefined,
            includeProjects: true,
            includeTasks: true,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: result.response,
          isUser: false,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      } else {
        toast.error("Failed to get AI response");
      }
    } catch (error) {
      toast.error("Something went wrong with the AI chat");
    } finally {
      setIsLoading(false);
    }
  };

  const generateProjectInsights = async (projectId: string) => {
    if (loadingInsights[projectId]) return;

    setLoadingInsights((prev) => ({ ...prev, [projectId]: true }));

    try {
      const response = await fetch("/api/ai/project-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const result = await response.json();
        const project = projects.find((p) => p.id === projectId);

        const insight: ProjectInsight = {
          projectId,
          projectName: project?.name || "Unknown Project",
          insights: result.insights,
          metrics: result.metrics,
          generatedAt: result.generatedAt,
        };

        setProjectInsights((prev) => {
          const filtered = prev.filter((i) => i.projectId !== projectId);
          return [...filtered, insight];
        });

        toast.success("AI insights generated successfully!");
      } else {
        toast.error("Failed to generate insights");
      }
    } catch (error) {
      toast.error("Something went wrong generating insights");
    } finally {
      setLoadingInsights((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    if (score >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bot className="mr-3 h-8 w-8 text-purple-600" />
            AI Assistant
          </h1>
          <p className="text-gray-600 mt-1">
            Get intelligent insights and assistance for your projects
          </p>
        </div>
        <AIProjectForm onProjectCreated={fetchProjects} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center">
                <MessageCircle className="mr-2 h-5 w-5" />
                AI Chat Assistant
              </CardTitle>
              <CardDescription>
                Ask questions about your projects, get productivity tips, or
                request task suggestions
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0">
              {/* Project Context Selector */}
              {projects.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg flex-shrink-0">
                  <label className="text-sm font-medium text-blue-900 mb-2 block">
                    Project Context (optional):
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="">General conversation</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 min-h-0 mb-4">
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-lg shadow-sm ${
                            message.isUser
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white border text-gray-900 rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-2 ${
                              message.isUser ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border p-3 rounded-lg rounded-bl-sm shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            <span className="text-sm text-gray-600">
                              AI is thinking...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Message Input */}
              <div className="flex space-x-2 flex-shrink-0">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Ask me anything about your projects..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !currentMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Project Insights */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
                Quick AI Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  setCurrentMessage(
                    "Analyze my project progress and give me insights"
                  )
                }
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analyze Progress
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  setCurrentMessage("What tasks should I prioritize today?")
                }
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Get Priorities
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  setCurrentMessage(
                    "What are the risks in my current projects?"
                  )
                }
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Risk Assessment
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  setCurrentMessage(
                    "Give me productivity tips for project management"
                  )
                }
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Productivity Tips
              </Button>
            </CardContent>
          </Card>

          {/* Project Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5 text-blue-600" />
                Project Insights
              </CardTitle>
              <CardDescription>
                Generate AI-powered analysis for your projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No projects yet. Create a project to get AI insights!
                </p>
              ) : (
                <>
                  {projects.slice(0, 3).map((project) => {
                    const insight = projectInsights.find(
                      (i) => i.projectId === project.id
                    );
                    const isLoading = loadingInsights[project.id];

                    return (
                      <div key={project.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">
                            {project.name}
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateProjectInsights(project.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        {insight && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge
                                className={getHealthColor(
                                  insight.metrics.healthScore
                                )}
                              >
                                Health: {insight.metrics.healthScore}%
                              </Badge>
                              <Badge variant="outline">
                                {insight.metrics.completionRate}% Complete
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-3">
                              {insight.insights}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
