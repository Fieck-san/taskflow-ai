"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  UserPlus,
  Crown,
  Shield,
  User,
  Mail,
  Calendar,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface TeamMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
  };
  role: string;
  joinedAt: string;
  project: {
    id: string;
    name: string;
    color: string;
  };
}

interface Project {
  id: string;
  name: string;
  color: string;
  status: string;
  _count: {
    members: number;
    tasks: number;
  };
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchTeamData = async () => {
    try {
      // Fetch projects to get team members
      const projectsResponse = await fetch("/api/projects");
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);

        // Extract all team members from projects
        const allMembers: TeamMember[] = [];
        projectsData.forEach((project: any) => {
          if (project.members) {
            project.members.forEach((member: any) => {
              allMembers.push({
                ...member,
                project: {
                  id: project.id,
                  name: project.name,
                  color: project.color,
                },
              });
            });
          }
          // Add project owner as well
          if (project.owner) {
            allMembers.push({
              id: `owner-${project.id}`,
              user: project.owner,
              role: "ADMIN",
              joinedAt: project.createdAt,
              project: {
                id: project.id,
                name: project.name,
                color: project.color,
              },
            });
          }
        });

        // Remove duplicates based on user.id and project.id combination
        const uniqueMembers = allMembers.filter((member, index, self) =>
          index === self.findIndex(m => 
            m.user.id === member.user.id && m.project.id === member.project.id
          )
        );

        setTeamMembers(uniqueMembers);
        setFilteredMembers(uniqueMembers);
      }
    } catch (error) {
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  useEffect(() => {
    let filtered = teamMembers;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Project filter
    if (projectFilter !== "all") {
      filtered = filtered.filter(member => member.project.id === projectFilter);
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    setFilteredMembers(filtered);
  }, [teamMembers, searchQuery, projectFilter, roleFilter]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "MANAGER":
        return <Shield className="w-4 h-4 text-blue-600" />;
      case "MEMBER":
        return <User className="w-4 h-4 text-gray-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-yellow-100 text-yellow-800";
      case "MANAGER":
        return "bg-blue-100 text-blue-800";
      case "MEMBER":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";
  };

  // Get unique users across all projects
  const uniqueUsers = teamMembers.reduce((acc, member) => {
    if (!acc.find(u => u.id === member.user.id)) {
      acc.push(member.user);
    }
    return acc;
  }, [] as any[]);

  const teamStats = {
    totalMembers: uniqueUsers.length,
    totalProjects: projects.length,
    admins: teamMembers.filter(m => m.role === "ADMIN").length,
    managers: teamMembers.filter(m => m.role === "MANAGER").length,
    members: teamMembers.filter(m => m.role === "MEMBER").length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 h-8 w-8" />
            Team Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage team members across all your projects
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input placeholder="Enter email address" type="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select defaultValue="MEMBER">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Send Invitation</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{teamStats.totalMembers}</p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{teamStats.admins}</p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{teamStats.managers}</p>
              <p className="text-sm text-gray-600">Managers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{teamStats.members}</p>
              <p className="text-sm text-gray-600">Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <div className="space-y-4">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <Card key={`${member.user.id}-${member.project.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback>
                        {getInitials(member.user.name || member.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {member.user.name || member.user.email}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{member.user.email}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center text-sm text-gray-500">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: member.project.color }}
                          />
                          {member.project.name}
                        </span>
                        <span className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleColor(member.role)}>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        {member.role}
                      </div>
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || projectFilter !== "all" || roleFilter !== "all"
                  ? "Try adjusting your filters to see more team members."
                  : "Invite team members to start collaborating on projects."}
              </p>
              {!searchQuery && projectFilter === "all" && roleFilter === "all" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite First Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input placeholder="Enter email address" type="email" />
                      <Button className="w-full">Send Invitation</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}