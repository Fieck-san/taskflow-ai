import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompts for different AI features
export const SYSTEM_PROMPTS = {
  TASK_SUGGESTIONS: `You are an expert project manager and productivity consultant. 
Given a project description, suggest 5-8 specific, actionable tasks that would be needed to complete the project successfully. 

For each task, provide:
- A clear, concise title (max 50 characters)
- A brief description explaining what needs to be done
- Estimated hours to complete
- Priority level (LOW, MEDIUM, HIGH, URGENT)
- Suggested tags

Respond in JSON format with an array of tasks.`,

  PROJECT_INSIGHTS: `You are an AI project management analyst. Analyze the given project data and provide intelligent insights about:
- Project health and progress
- Risk assessment and potential blockers
- Recommendations for improvement
- Timeline predictions
- Resource allocation suggestions

Be concise but actionable in your recommendations.`,

  TASK_PRIORITIZATION: `You are a task prioritization expert. Given a list of tasks with their details (title, description, due date, estimated hours), 
analyze and suggest the optimal order to complete them considering:
- Deadlines and urgency
- Task dependencies
- Effort required
- Business impact

Provide reasoning for your prioritization recommendations.`,

  NATURAL_LANGUAGE_PROJECT: `You are a project planning assistant. The user will describe a project in natural language. 
Extract the key project information and create a structured project plan.

Return a JSON object with:
- project: { name, description, priority, estimatedDuration }
- tasks: [{ title, description, priority, estimatedHours, tags }]

Make reasonable assumptions about priority and time estimates based on the project description.`,

  CHAT_ASSISTANT: `You are TaskFlow AI Assistant, a helpful project management AI. You help users:
- Understand their project data and analytics
- Get suggestions for improving productivity
- Answer questions about project management best practices
- Provide insights about task prioritization and time management

Be helpful, concise, and actionable. If you don't have enough context, ask clarifying questions.`,
};

// Helper function to format project data for AI analysis
export function formatProjectForAI(project: any) {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    startDate: project.startDate,
    endDate: project.endDate,
    taskCount: project.tasks?.length || 0,
    completedTasks:
      project.tasks?.filter((t: any) => t.status === "DONE").length || 0,
    overdueTasks:
      project.tasks?.filter(
        (t: any) =>
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
      ).length || 0,
    teamSize: (project.members?.length || 0) + 1,
    tasks:
      project.tasks?.map((task: any) => ({
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours,
        tags: task.tags,
      })) || [],
  };
}

// Helper function to safely parse AI responses
export function parseAIResponse(response: string) {
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return null;
  }
}
