import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const suggestTasksSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().optional(),
  projectType: z.string().optional(),
  targetAudience: z.string().optional(),
  timeline: z.string().optional(),
})

const generateMockTasks = (projectData: any) => {
  const projectType = projectData.projectType?.toLowerCase() || 'general'
  const projectName = projectData.projectName
  
  // Different task sets based on project type
  const taskTemplates = {
    website: [
      {
        title: "Create wireframes and user flow",
        description: "Design the basic structure and navigation flow for the website",
        priority: "HIGH",
        estimatedHours: 8,
        tags: ["design", "planning", "ux"]
      },
      {
        title: "Set up development environment",
        description: "Configure local development setup with necessary tools and frameworks",
        priority: "HIGH",
        estimatedHours: 4,
        tags: ["setup", "development", "environment"]
      },
      {
        title: "Design homepage layout",
        description: "Create the main landing page design with responsive layout",
        priority: "MEDIUM",
        estimatedHours: 12,
        tags: ["design", "frontend", "responsive"]
      },
      {
        title: "Implement user authentication",
        description: "Build login/signup functionality with security features",
        priority: "HIGH",
        estimatedHours: 16,
        tags: ["backend", "security", "auth"]
      },
      {
        title: "Create content management system",
        description: "Build admin interface for managing website content",
        priority: "MEDIUM",
        estimatedHours: 20,
        tags: ["backend", "cms", "admin"]
      },
      {
        title: "Optimize for SEO",
        description: "Implement meta tags, structured data, and performance optimizations",
        priority: "MEDIUM",
        estimatedHours: 6,
        tags: ["seo", "optimization", "marketing"]
      },
      {
        title: "Test across devices and browsers",
        description: "Comprehensive testing on different devices and browsers",
        priority: "HIGH",
        estimatedHours: 8,
        tags: ["testing", "qa", "compatibility"]
      }
    ],
    "mobile-app": [
      {
        title: "Define app architecture",
        description: "Plan the technical architecture and technology stack",
        priority: "HIGH",
        estimatedHours: 6,
        tags: ["architecture", "planning", "technical"]
      },
      {
        title: "Create user interface mockups",
        description: "Design app screens and user interface elements",
        priority: "HIGH",
        estimatedHours: 16,
        tags: ["design", "ui", "mockups"]
      },
      {
        title: "Set up development framework",
        description: "Initialize project with chosen mobile development framework",
        priority: "HIGH",
        estimatedHours: 4,
        tags: ["setup", "framework", "mobile"]
      },
      {
        title: "Implement core navigation",
        description: "Build the main navigation and screen transitions",
        priority: "MEDIUM",
        estimatedHours: 12,
        tags: ["navigation", "frontend", "mobile"]
      },
      {
        title: "Integrate API services",
        description: "Connect app to backend services and APIs",
        priority: "HIGH",
        estimatedHours: 20,
        tags: ["backend", "api", "integration"]
      },
      {
        title: "Implement push notifications",
        description: "Set up push notification system for user engagement",
        priority: "MEDIUM",
        estimatedHours: 8,
        tags: ["notifications", "engagement", "mobile"]
      },
      {
        title: "Test on real devices",
        description: "Test app functionality on various mobile devices",
        priority: "HIGH",
        estimatedHours: 12,
        tags: ["testing", "mobile", "qa"]
      }
    ],
    marketing: [
      {
        title: "Define target audience and personas",
        description: "Research and create detailed buyer personas for the campaign",
        priority: "HIGH",
        estimatedHours: 8,
        tags: ["research", "personas", "strategy"]
      },
      {
        title: "Develop campaign messaging",
        description: "Create compelling messaging and value propositions",
        priority: "HIGH",
        estimatedHours: 6,
        tags: ["messaging", "copywriting", "strategy"]
      },
      {
        title: "Design marketing materials",
        description: "Create visual assets for various marketing channels",
        priority: "MEDIUM",
        estimatedHours: 16,
        tags: ["design", "assets", "creative"]
      },
      {
        title: "Set up analytics tracking",
        description: "Implement tracking for campaign performance measurement",
        priority: "HIGH",
        estimatedHours: 4,
        tags: ["analytics", "tracking", "measurement"]
      },
      {
        title: "Launch social media campaign",
        description: "Execute social media strategy across chosen platforms",
        priority: "MEDIUM",
        estimatedHours: 12,
        tags: ["social-media", "execution", "engagement"]
      },
      {
        title: "Create email marketing sequence",
        description: "Develop automated email sequences for lead nurturing",
        priority: "MEDIUM",
        estimatedHours: 10,
        tags: ["email", "automation", "nurturing"]
      },
      {
        title: "Analyze and optimize performance",
        description: "Review campaign metrics and optimize based on data",
        priority: "MEDIUM",
        estimatedHours: 6,
        tags: ["analysis", "optimization", "reporting"]
      }
    ]
  }
  
  // Get appropriate tasks or use generic ones
  let baseTasks = taskTemplates[projectType as keyof typeof taskTemplates] || [
    {
      title: "Project planning and scope definition",
      description: "Define project requirements, timeline, and deliverables",
      priority: "HIGH",
      estimatedHours: 6,
      tags: ["planning", "scope", "requirements"]
    },
    {
      title: "Research and competitive analysis",
      description: "Analyze competitors and market research for the project",
      priority: "MEDIUM",
      estimatedHours: 8,
      tags: ["research", "analysis", "competitive"]
    },
    {
      title: "Create project documentation",
      description: "Document project specifications and requirements",
      priority: "MEDIUM",
      estimatedHours: 4,
      tags: ["documentation", "specs", "planning"]
    },
    {
      title: "Set up project infrastructure",
      description: "Establish necessary tools and workflows for the project",
      priority: "HIGH",
      estimatedHours: 6,
      tags: ["setup", "infrastructure", "tools"]
    },
    {
      title: "Develop core functionality",
      description: "Build the main features and functionality",
      priority: "HIGH",
      estimatedHours: 24,
      tags: ["development", "core", "features"]
    },
    {
      title: "Quality assurance and testing",
      description: "Test all functionality and ensure quality standards",
      priority: "HIGH",
      estimatedHours: 12,
      tags: ["testing", "qa", "quality"]
    }
  ]
  
  // Customize tasks based on project name and description
  const customizedTasks = baseTasks.map(task => ({
    ...task,
    title: task.title.replace(/website|app|campaign/gi, projectName.toLowerCase())
  }))
  
  return customizedTasks.slice(0, 6) // Return 6 tasks
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = suggestTasksSchema.parse(body)

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

    const suggestedTasks = generateMockTasks(validatedData)

    return NextResponse.json({
      tasks: suggestedTasks,
      context: `AI-generated tasks for ${validatedData.projectName}`,
      aiUsed: true,
      mock: true // Indicates this is a mock response
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Mock AI task suggestion error:", error)
    return NextResponse.json({ error: "Failed to generate task suggestions" }, { status: 500 })
  }
}