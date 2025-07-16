"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Download,
  Trash2,
  LogOut,
  Save,
  Camera,
  Mail,
  Lock,
  Globe,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import toast from "react-hot-toast";

interface UserSettings {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  emailNotifications: {
    taskUpdates: boolean;
    projectInvites: boolean;
    deadlineReminders: boolean;
    weeklyDigest: boolean;
  };
  projectDefaults: {
    defaultPriority: string;
    defaultStatus: string;
    autoAssign: boolean;
  };
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    theme: "system",
    language: "en",
    timezone: "UTC",
    emailNotifications: {
      taskUpdates: true,
      projectInvites: true,
      deadlineReminders: true,
      weeklyDigest: false,
    },
    projectDefaults: {
      defaultPriority: "MEDIUM",
      defaultStatus: "PLANNING",
      autoAssign: false,
    },
  });

  const [profileData, setProfileData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    bio: "",
    location: "",
    website: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      // In a real app, this would make an API call to update the user profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Profile updated successfully");
      // Update session data if needed
      await update();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // In a real app, this would make an API call to update the password
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Password updated successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async () => {
    setLoading(true);
    try {
      // In a real app, this would make an API call to update user settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      // In a real app, this would make an API call to export user data
      toast.success("Data export initiated. You'll receive an email when ready.");
    } catch (error) {
      toast.error("Failed to initiate data export");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In a real app, this would make an API call to delete the account
      toast.success("Account deletion initiated");
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                <a
                  href="#profile"
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 border-r-2 border-blue-500"
                >
                  <User className="mr-3 h-5 w-5" />
                  Profile
                </a>
                <a
                  href="#notifications"
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Bell className="mr-3 h-5 w-5" />
                  Notifications
                </a>
                <a
                  href="#preferences"
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Palette className="mr-3 h-5 w-5" />
                  Preferences
                </a>
                <a
                  href="#security"
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Shield className="mr-3 h-5 w-5" />
                  Security
                </a>
                <a
                  href="#data"
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Download className="mr-3 h-5 w-5" />
                  Data & Privacy
                </a>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card id="profile">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="text-lg">
                    {getInitials(session?.user?.name || session?.user?.email || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">
                    JPG, GIF or PNG. 1MB max.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. San Francisco, CA"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://yourwebsite.com"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleProfileUpdate} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card id="notifications">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Task Updates</p>
                  <p className="text-sm text-gray-600">Get notified when tasks are updated</p>
                </div>
                <Switch
                  checked={settings.emailNotifications.taskUpdates}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      emailNotifications: { ...settings.emailNotifications, taskUpdates: checked }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Project Invites</p>
                  <p className="text-sm text-gray-600">Get notified when invited to projects</p>
                </div>
                <Switch
                  checked={settings.emailNotifications.projectInvites}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      emailNotifications: { ...settings.emailNotifications, projectInvites: checked }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Deadline Reminders</p>
                  <p className="text-sm text-gray-600">Get reminders for upcoming deadlines</p>
                </div>
                <Switch
                  checked={settings.emailNotifications.deadlineReminders}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      emailNotifications: { ...settings.emailNotifications, deadlineReminders: checked }
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Digest</p>
                  <p className="text-sm text-gray-600">Receive weekly summary emails</p>
                </div>
                <Switch
                  checked={settings.emailNotifications.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      emailNotifications: { ...settings.emailNotifications, weeklyDigest: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance & Preferences */}
          <Card id="preferences">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Appearance & Preferences
              </CardTitle>
              <CardDescription>
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={settings.theme} onValueChange={(value) => setSettings({ ...settings, theme: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center">
                        <Monitor className="mr-2 h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSettingsUpdate} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card id="security">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handlePasswordUpdate} disabled={loading}>
                <Lock className="mr-2 h-4 w-4" />
                Update Password
              </Button>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <Button variant="outline">
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card id="data">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                Data & Privacy
              </CardTitle>
              <CardDescription>
                Manage your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-gray-600">Download a copy of your data</p>
                </div>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sign Out All Devices</p>
                  <p className="text-sm text-gray-600">Sign out from all other devices</p>
                </div>
                <Button variant="outline" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-600">Delete Account</p>
                  <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                </div>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and all associated data.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteAccount}>
                        Delete Account
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}