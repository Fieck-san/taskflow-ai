import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openai, SYSTEM_PROMPTS, formatProjectForAI } from "@/lib/openai";
import { z } from "zod";

const projectInsightsSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = projectInsightsSchema.parse(body);

    // Fetch project with all related data
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
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
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
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
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        activities: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Format project data for AI analysis
    const projectData = formatProjectForAI(project);

    // Calculate additional metrics
    const now = new Date();
    const daysUntilDeadline = project.endDate
      ? Math.ceil(
          (new Date(project.endDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    const recentActivity = project.activities.length;
    const taskDistribution = {
      todo: project.tasks.filter((t) => t.status === "TODO").length,
      inProgress: project.tasks.filter((t) => t.status === "IN_PROGRESS")
        .length,
      inReview: project.tasks.filter((t) => t.status === "IN_REVIEW").length,
      done: project.tasks.filter((t) => t.status === "DONE").length,
    };

    const analysisContext = `
Project Analysis Request:
${JSON.stringify(projectData, null, 2)}

Additional Context:
- Days until deadline: ${daysUntilDeadline || "No deadline set"}
- Recent activity level: ${recentActivity} activities in last 10 actions
- Task distribution: ${taskDistribution.todo} todo, ${
      taskDistribution.inProgress
    } in progress, ${taskDistribution.inReview} in review, ${
      taskDistribution.done
    } completed
- Project age: ${Math.ceil(
      (now.getTime() - new Date(project.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    )} days

Please provide actionable insights about this project's health, risks, and recommendations.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS.PROJECT_INSIGHTS,
        },
        {
          role: "user",
          content: analysisContext,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const aiInsights = completion.choices[0]?.message?.content;

    if (!aiInsights) {
      return NextResponse.json(
        { error: "No insights generated" },
        { status: 500 }
      );
    }

    // Calculate project health score
    const completionRate =
      projectData.taskCount > 0
        ? (projectData.completedTasks / projectData.taskCount) * 100
        : 0;
    const overdueRate =
      projectData.taskCount > 0
        ? (projectData.overdueTasks / projectData.taskCount) * 100
        : 0;
    const healthScore = Math.max(
      0,
      Math.min(100, completionRate - overdueRate * 2 + recentActivity * 5)
    );

    return NextResponse.json({
      insights: aiInsights,
      metrics: {
        healthScore: Math.round(healthScore),
        completionRate: Math.round(completionRate),
        overdueRate: Math.round(overdueRate),
        daysUntilDeadline,
        recentActivityLevel: recentActivity,
        taskDistribution,
      },
      projectData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("AI project insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate project insights" },
      { status: 500 }
    );
  }
}
