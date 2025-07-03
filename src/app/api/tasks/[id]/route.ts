import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Task title too long").optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/tasks/[id] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        project: {
          OR: [
            { ownerId: session.user.id },
            { 
              members: {
                some: {
                  userId: session.user.id
                }
              }
            }
          ]
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to the task
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        project: {
          OR: [
            { ownerId: session.user.id },
            { 
              members: {
                some: {
                  userId: session.user.id
                }
              }
            }
          ]
        }
      },
      include: {
        project: true
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    })

    // Create an activity log for task update
    await prisma.activity.create({
      data: {
        type: "TASK_UPDATED",
        description: `Updated task "${task.title}"`,
        projectId: task.projectId,
        taskId: task.id,
        userId: session.user.id,
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has access to the task
    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        project: {
          OR: [
            { ownerId: session.user.id },
            { 
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["ADMIN", "MANAGER"] }
                }
              }
            }
          ]
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found or insufficient permissions" }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}