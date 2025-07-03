import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  context: z.object({
    projectId: z.string().optional(),
    includeProjects: z.boolean().default(false),
    includeTasks: z.boolean().default(false),
  }).optional(),
})

// Mock AI responses based on common queries
const getMockResponse = (message: string, hasContext: boolean) => {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('prioritize') || lowerMessage.includes('priority')) {
    return `Based on your current workload, I recommend prioritizing:

1. **High-priority tasks with upcoming deadlines** - Focus on tasks due within the next 3 days
2. **Blocked tasks** - Resolve any dependencies that are preventing team progress  
3. **Quick wins** - Complete 1-2 small tasks to build momentum
4. **Strategic work** - Allocate time for important but not urgent project planning

${hasContext ? 'Looking at your current projects, you have several tasks in progress. Consider focusing on completing in-progress tasks before starting new ones.' : 'Connect a project context to get more specific recommendations!'}`
  }
  
  if (lowerMessage.includes('progress') || lowerMessage.includes('analyze')) {
    return `Here's my analysis of your project progress:

**Overall Health**: Your projects are showing good momentum! 

**Key Insights**:
- Task completion rate is steady
- Most projects are on track with their timelines
- Team collaboration appears active

**Recommendations**:
- Review any overdue tasks and reassign if needed
- Consider breaking down large tasks into smaller, manageable pieces
- Schedule regular check-ins with team members

${hasContext ? 'Based on your specific project data, I can see active development across multiple projects.' : 'For detailed project analysis, select a specific project in the context dropdown above.'}`
  }
  
  if (lowerMessage.includes('risk') || lowerMessage.includes('problem')) {
    return `**Risk Assessment for Your Projects**:

🟡 **Medium Risks Identified**:
- Some tasks approaching their due dates
- Potential resource allocation challenges
- Dependencies between tasks that could cause delays

🟢 **Low Risk Areas**:
- Team communication appears strong
- Project scope seems well-defined
- Regular progress updates are happening

**Mitigation Strategies**:
1. Set up automated deadline reminders
2. Create buffer time for complex tasks
3. Establish clear escalation paths for blocked work
4. Regular risk review meetings

Would you like me to dive deeper into any specific risk area?`
  }
  
  if (lowerMessage.includes('tip') || lowerMessage.includes('advice') || lowerMessage.includes('help')) {
    return `**🚀 Productivity Tips for Project Management**:

**Time Management**:
- Use time-blocking for focused work sessions
- Batch similar tasks together
- Set clear start/end times for meetings

**Team Collaboration**:
- Create shared project documentation
- Establish regular update rhythms
- Use async communication when possible

**Task Organization**:
- Break large projects into 2-hour chunks
- Use priority matrices (urgent vs important)
- Celebrate small wins to maintain momentum

**Tools & Automation**:
- Set up notifications for critical deadlines
- Use templates for recurring project types
- Automate status reporting where possible

What specific area would you like me to elaborate on?`
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello! 👋 I'm your TaskFlow AI assistant. I'm here to help you:

- **Analyze your project progress** and identify bottlenecks
- **Prioritize tasks** based on deadlines and importance  
- **Suggest improvements** for team productivity
- **Answer questions** about project management best practices
- **Generate insights** from your project data

Try asking me:
- "What should I prioritize today?"
- "Analyze my project progress"
- "What are the risks in my projects?"
- "Give me productivity tips"

How can I help you today?`
  }
  
  // Default response for other queries
  return `I understand you're asking about: "${message}"

As your AI project management assistant, I can help you with:

**Project Analysis**: I can review your project health, completion rates, and team performance
**Task Prioritization**: I'll help you focus on what matters most
**Risk Assessment**: I can identify potential issues before they become problems
**Productivity Tips**: I'll share best practices for efficient project management

For more specific insights, try connecting a project context using the dropdown above, or ask me something like:
- "How are my projects performing?"
- "What should I focus on this week?"
- "What productivity tips do you recommend?"

${hasContext ? 'I can see you have project context loaded - feel free to ask specific questions about your current work!' : ''}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { message, context } = chatSchema.parse(body)

    let hasContext = false

    // Check if we have context data (simplified)
    if (context && (context.projectId || context.includeProjects || context.includeTasks)) {
      hasContext = true
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const mockResponse = getMockResponse(message, hasContext)

    return NextResponse.json({
      response: mockResponse,
      hasContext,
      timestamp: new Date().toISOString(),
      mock: true // Indicates this is a mock response
    })

  } catch (error: any) {
    console.error("Mock AI chat error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ 
      error: "Failed to process chat message",
      details: error.message 
    }, { status: 500 })
  }
}