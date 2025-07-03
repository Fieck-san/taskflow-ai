import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { openai, SYSTEM_PROMPTS, parseAIResponse } from "@/lib/openai";
import { z } from "zod";

const suggestTasksSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().optional(),
  projectType: z.string().optional(),
  targetAudience: z.string().optional(),
  timeline: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = suggestTasksSchema.parse(body);

    // Create detailed project context for AI
    const projectContext = `
Project: ${validatedData.projectName}
Description: ${validatedData.projectDescription || "No description provided"}
Type: ${validatedData.projectType || "General project"}
Target Audience: ${validatedData.targetAudience || "Not specified"}
Timeline: ${validatedData.timeline || "Not specified"}

Please suggest specific, actionable tasks for this project.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS.TASK_SUGGESTIONS,
        },
        {
          role: "user",
          content: projectContext,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const suggestedTasks = parseAIResponse(aiResponse);

    if (!suggestedTasks || !Array.isArray(suggestedTasks)) {
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      );
    }

    // Validate and clean up the suggested tasks
    const cleanTasks = suggestedTasks.map((task) => ({
      title: task.title || "Untitled Task",
      description: task.description || "",
      priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(task.priority)
        ? task.priority
        : "MEDIUM",
      estimatedHours:
        typeof task.estimatedHours === "number" ? task.estimatedHours : 1,
      tags: Array.isArray(task.tags) ? task.tags : [],
    }));

    return NextResponse.json({
      tasks: cleanTasks,
      context: projectContext,
      aiUsed: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("AI task suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to generate task suggestions" },
      { status: 500 }
    );
  }
}
