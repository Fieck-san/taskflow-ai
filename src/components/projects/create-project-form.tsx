"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";

// Fixed schema - make required fields explicitly required
const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name too long"),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  color: z.string(),
});

// Create the type from the schema
type CreateProjectForm = z.infer<typeof createProjectSchema>;

const colorOptions = [
  { value: "#3B82F6", label: "Blue", class: "bg-blue-500" },
  { value: "#10B981", label: "Green", class: "bg-green-500" },
  { value: "#F59E0B", label: "Yellow", class: "bg-yellow-500" },
  { value: "#EF4444", label: "Red", class: "bg-red-500" },
  { value: "#8B5CF6", label: "Purple", class: "bg-purple-500" },
  { value: "#F97316", label: "Orange", class: "bg-orange-500" },
  { value: "#06B6D4", label: "Cyan", class: "bg-cyan-500" },
  { value: "#84CC16", label: "Lime", class: "bg-lime-500" },
];

interface CreateProjectFormProps {
  onProjectCreated?: () => void;
  children?: React.ReactNode; // Add this for when used as wrapper
}

export function CreateProjectForm({
  onProjectCreated,
  children,
}: CreateProjectFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Fixed useForm with proper typing and explicit defaults
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "PLANNING",
      priority: "MEDIUM",
      color: "#3B82F6",
      startDate: "",
      endDate: "",
    },
  });

  const selectedColor = watch("color");

  // Fixed onSubmit - clean the data before sending
  const onSubmit = async (data: CreateProjectForm) => {
    setIsLoading(true);
    try {
      // Clean the data by removing empty strings and applying defaults
      const cleanData = {
        ...data,
        description: data.description || undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
      });

      if (response.ok) {
        const project = await response.json();
        toast.success("Project created successfully!");
        setIsOpen(false);
        reset();
        if (onProjectCreated) {
          onProjectCreated();
        }
        router.push(`/dashboard/projects/${project.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create project");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If children are provided, render them as the trigger instead of default button
  const trigger = children || (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      New Project
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Start a new project to organize your tasks and collaborate with your
            team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                {...register("name")}
                id="name"
                placeholder="Enter project name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                {...register("description")}
                id="description"
                placeholder="Describe what this project is about..."
                className="resize-none"
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                defaultValue="PLANNING"
                onValueChange={(value) =>
                  setValue("status", value as CreateProjectForm["status"])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planning</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                defaultValue="MEDIUM"
                onValueChange={(value) =>
                  setValue("priority", value as CreateProjectForm["priority"])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                {...register("startDate")}
                id="startDate"
                type="date"
                disabled={isLoading}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                {...register("endDate")}
                id="endDate"
                type="date"
                disabled={isLoading}
              />
            </div>

            {/* Color */}
            <div className="md:col-span-2 space-y-2">
              <Label>Project Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue("color", color.value)}
                    className={`w-8 h-8 rounded-full ${color.class} ${
                      selectedColor === color.value
                        ? "ring-2 ring-offset-2 ring-gray-900"
                        : "hover:scale-110"
                    } transition-all`}
                    title={color.label}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
