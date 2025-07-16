import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ollama, SYSTEM_PROMPTS, formatProjectForAI } from "@/lib/ollama";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  context: z
    .object({
      projectId: z.string().optional(),
      includeProjects: z.boolean().default(false),
      includeTasks: z.boolean().default(false),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, context } = chatSchema.parse(body);

    let contextData = "";

    // Gather context data if requested
    if (context) {
      if (context.projectId) {
        // Get specific project data
        const project = await prisma.project.findFirst({
          where: {
            id: context.projectId,
            OR: [
              { ownerId: session.user.id },
              {
                members: {
                  some: {
                    userId: session.user.id,
                  },
                },
              },
            ],
          },
          include: {
            tasks: true,
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (project) {
          contextData += `Current Project Context:\n${JSON.stringify(
            formatProjectForAI(project),
            null,
            2
          )}\n\n`;
        }
      }

      if (context.includeProjects) {
        // Get user's projects summary
        const projects = await prisma.project.findMany({
          where: {
            OR: [
              { ownerId: session.user.id },
              {
                members: {
                  some: {
                    userId: session.user.id,
                  },
                },
              },
            ],
          },
          include: {
            tasks: {
              select: {
                status: true,
                priority: true,
                dueDate: true,
              },
            },
            _count: {
              select: {
                tasks: true,
                members: true,
              },
            },
          },
          take: 10, // Limit to avoid context overflow
        });

        const projectsSummary = projects.map((p) => ({
          name: p.name,
          status: p.status,
          priority: p.priority,
          taskCount: p._count.tasks,
          completedTasks: p.tasks.filter((t) => t.status === "DONE").length,
          overdueTasks: p.tasks.filter(
            (t) =>
              t.dueDate &&
              new Date(t.dueDate) < new Date() &&
              t.status !== "DONE"
          ).length,
        }));

        contextData += `User's Projects Summary:\n${JSON.stringify(
          projectsSummary,
          null,
          2
        )}\n\n`;
      }

      if (context.includeTasks) {
        // Get user's recent tasks
        const tasks = await prisma.task.findMany({
          where: {
            project: {
              OR: [
                { ownerId: session.user.id },
                {
                  members: {
                    some: {
                      userId: session.user.id,
                    },
                  },
                },
              ],
            },
          },
          include: {
            project: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 20, // Recent tasks only
        });

        const tasksSummary = tasks.map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          project: t.project.name,
          dueDate: t.dueDate,
          isOverdue:
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            t.status !== "DONE",
        }));

        contextData += `User's Recent Tasks:\n${JSON.stringify(
          tasksSummary,
          null,
          2
        )}\n\n`;
      }
    }

    const fullMessage = contextData
      ? `${SYSTEM_PROMPTS.CHAT_ASSISTANT}\n\nContext:\n${contextData}User Question: ${message}`
      : `${SYSTEM_PROMPTS.CHAT_ASSISTANT}\n\nUser Question: ${message}`;

    const aiResponse = await ollama.generateResponse(fullMessage);

    if (!aiResponse) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: aiResponse,
      hasContext: !!contextData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
