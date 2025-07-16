interface OllamaResponse {
  response: string;
  done: boolean;
  context?: number[];
}

interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  context?: number[];
}

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'qwen2.5-coder:7b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateResponse(prompt: string, context?: number[]): Promise<string> {
    try {
      const requestBody: OllamaRequest = {
        model: this.model,
        prompt,
        stream: false,
      };

      if (context) {
        requestBody.context = context;
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama API error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }
}

export const ollama = new OllamaService();

export const SYSTEM_PROMPTS = {
  CHAT_ASSISTANT: `You are TaskFlow AI, a helpful project management assistant. You help users manage their projects, tasks, and team collaboration.

Your responsibilities:
- Help users understand their project progress and metrics
- Provide insights on task prioritization and deadlines
- Suggest improvements for project workflow
- Answer questions about their projects and tasks
- Offer productivity tips and best practices

Guidelines:
- Be concise and actionable in your responses
- Focus on project management and productivity topics
- Use the provided context about user's projects and tasks
- Be friendly but professional
- If you don't have enough context, ask clarifying questions`
};

export function formatProjectForAI(project: any) {
  return {
    name: project.name,
    status: project.status,
    priority: project.priority,
    description: project.description,
    tasks: project.tasks?.map((task: any) => ({
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      description: task.description,
    })) || [],
    members: project.members?.map((member: any) => ({
      name: member.user.name,
      role: member.role,
    })) || [],
    taskCounts: {
      total: project.tasks?.length || 0,
      completed: project.tasks?.filter((t: any) => t.status === 'DONE').length || 0,
      inProgress: project.tasks?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0,
      overdue: project.tasks?.filter((t: any) => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
      ).length || 0,
    }
  };
}