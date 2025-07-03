"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Sparkles, Wand2, CheckCircle, Clock } from "lucide-react"
import toast from "react-hot-toast"

const aiProjectSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().min(10, "Please provide a detailed description"),
  projectType: z.string().optional(),
  targetAudience: z.string().optional(),
  timeline: z.string().optional(),
})

type AIProjectForm = z.infer<typeof aiProjectSchema>

interface SuggestedTask {
  title: string
  description: string
  priority: string
  estimatedHours: number
  tags: string[]
  selected?: boolean
}

interface AIProjectFormProps {
  onProjectCreated?: () => void
  children?: React.ReactNode // Add children prop
}

export function AIProjectForm({ onProjectCreated, children }: AIProjectFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([])
  const [currentStep, setCurrentStep] = useState<'form' | 'tasks' | 'review'>('form')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<AIProjectForm>({
    resolver: zodResolver(aiProjectSchema),
  })

  const formData = watch()

  const generateTasks = async (data: AIProjectForm) => {
    setIsGeneratingTasks(true)
    try {
      const response = await fetch("/api/ai/suggest-tasks-mock", { // Using mock API for now
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setSuggestedTasks(result.tasks.map((task: SuggestedTask) => ({ ...task, selected: true })))
        setCurrentStep('tasks')
        toast.success("AI generated tasks successfully!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to generate tasks")
      }
    } catch (error) {
      toast.error("Failed to generate tasks. Please try again.")
    } finally {
      setIsGeneratingTasks(false)
    }
  }

  const createProjectWithTasks = async () => {
    setIsCreatingProject(true)
    try {
      // Create the project first
      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.projectName,
          description: formData.projectDescription,
          priority: "MEDIUM",
          status: "PLANNING",
        }),
      })

      if (!projectResponse.ok) {
        throw new Error("Failed to create project")
      }

      const project = await projectResponse.json()

      // Create selected tasks
      const selectedTasks = suggestedTasks.filter(task => task.selected)
      const taskPromises = selectedTasks.map(task =>
        fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
            tags: task.tags,
            projectId: project.id,
            status: "TODO",
          }),
        })
      )

      await Promise.all(taskPromises)

      toast.success(`Project created with ${selectedTasks.length} AI-generated tasks!`)
      setIsOpen(false)
      reset()
      setSuggestedTasks([])
      setCurrentStep('form')
      
      if (onProjectCreated) {
        onProjectCreated()
      }
      
      router.push(`/dashboard/projects/${project.id}`)
    } catch (error) {
      toast.error("Failed to create project. Please try again.")
    } finally {
      setIsCreatingProject(false)
    }
  }

  const toggleTaskSelection = (index: number) => {
    setSuggestedTasks(prev => 
      prev.map((task, i) => 
        i === index ? { ...task, selected: !task.selected } : task
      )
    )
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

  const selectedTaskCount = suggestedTasks.filter(task => task.selected).length
  const totalEstimatedHours = suggestedTasks
    .filter(task => task.selected)
    .reduce((total, task) => total + task.estimatedHours, 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700">
            <Sparkles className="mr-2 h-4 w-4" />
            Create with AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wand2 className="mr-2 h-5 w-5 text-purple-600" />
            AI-Powered Project Creation
          </DialogTitle>
          <DialogDescription>
            Describe your project and let AI suggest the perfect tasks to get you started.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {currentStep === 'form' && (
            <form onSubmit={handleSubmit(generateTasks)} className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  {...register("projectName")}
                  id="projectName"
                  placeholder="e.g., Website Redesign, Mobile App Development"
                  disabled={isGeneratingTasks}
                />
                {errors.projectName && (
                  <p className="text-sm text-red-600">{errors.projectName.message}</p>
                )}
              </div>

              {/* Project Description */}
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Detailed Description *</Label>
                <Textarea
                  {...register("projectDescription")}
                  id="projectDescription"
                  placeholder="Describe what you want to build, your goals, and any specific requirements..."
                  className="resize-none"
                  rows={4}
                  disabled={isGeneratingTasks}
                />
                {errors.projectDescription && (
                  <p className="text-sm text-red-600">{errors.projectDescription.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Type */}
                <div className="space-y-2">
                  <Label htmlFor="projectType">Project Type</Label>
                  <Select onValueChange={(value) => register("projectType").onChange({ target: { value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="mobile-app">Mobile App</SelectItem>
                      <SelectItem value="marketing">Marketing Campaign</SelectItem>
                      <SelectItem value="software">Software Development</SelectItem>
                      <SelectItem value="design">Design Project</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Select onValueChange={(value) => register("timeline").onChange({ target: { value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-week">1 Week</SelectItem>
                      <SelectItem value="2-weeks">2 Weeks</SelectItem>
                      <SelectItem value="1-month">1 Month</SelectItem>
                      <SelectItem value="2-3-months">2-3 Months</SelectItem>
                      <SelectItem value="6-months">6 Months</SelectItem>
                      <SelectItem value="1-year">1 Year+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  {...register("targetAudience")}
                  id="targetAudience"
                  placeholder="e.g., Small businesses, Students, Mobile users"
                  disabled={isGeneratingTasks}
                />
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  AI will analyze your project description and create relevant tasks with priorities, 
                  time estimates, and tags to help you get started quickly.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isGeneratingTasks}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isGeneratingTasks}>
                  {isGeneratingTasks ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Tasks...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Tasks with AI
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {currentStep === 'tasks' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">AI-Generated Tasks</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review and customize the tasks AI suggested for your project. 
                  You can select/deselect tasks to include in your project.
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span>{selectedTaskCount} of {suggestedTasks.length} tasks selected</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {totalEstimatedHours}h total estimated time
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {suggestedTasks.map((task, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all ${
                      task.selected 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleTaskSelection(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {task.selected ? (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            ) : (
                              <div className="h-4 w-4 border rounded border-gray-300" />
                            )}
                            <h4 className="font-medium">{task.title}</h4>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline">
                              {task.estimatedHours}h
                            </Badge>
                            {task.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('form')}
                  disabled={isCreatingProject}
                >
                  Back to Form
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isCreatingProject}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createProjectWithTasks}
                    disabled={selectedTaskCount === 0 || isCreatingProject}
                  >
                    {isCreatingProject ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      `Create Project with ${selectedTaskCount} Tasks`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}