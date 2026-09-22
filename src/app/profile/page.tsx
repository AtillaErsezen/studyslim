"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Home, Search, MessageSquare, User, Settings, LogOut, Mail, Calendar, Shield, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    role: "",
    image: "",
    isActive: true,
    createdAt: "",
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
    
    // Set initial data from session
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
        image: session.user.image || prev.image,
        createdAt: session.user.createdAt?.toString() || prev.createdAt,
      }));
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users?id=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setProfileData({
              name: data.data.name || session.user.name || "",
              email: data.data.email || session.user.email || "",
              role: data.data.role || "",
              image: data.data.image || session.user.image || "",
              isActive: data.data.isActive ?? true,
              createdAt: data.data.createdAt || session.user.createdAt?.toString() || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.email, session?.user?.image, session?.user?.createdAt]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/users?id=${session?.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          image: profileData.image,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Update local state with the saved data
          setProfileData(prev => ({
            ...prev,
            name: result.data.name || prev.name,
            email: result.data.email || prev.email,
            image: result.data.image || prev.image,
          }));
        }
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        console.error("Failed to update profile:", errorData);
        alert("Failed to update profile: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="px-4 py-3 cursor-pointer" onClick={() => router.push('/')}>
            <span className="text-xl font-bold text-foreground">Study<span className="text-primary">Slim</span></span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/')}>
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/dashboard')}>
                  <Search className="w-4 h-4" />
                  <span>Find Tutors</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MessageSquare className="w-4 h-4" />
                  <span>Messages</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/student/profile')} className="bg-accent">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={async () => {
                await authClient.signOut();
                router.push('/login');
              }}>
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">My Profile</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="max-w-3xl mx-auto w-full">
            {/* Profile Header */}
            <div className="bg-card rounded-lg border p-6 mb-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  {profileData.image ? (
                    <img
                      src={profileData.image}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                      <User className="w-12 h-12 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">{profileData.name}</h2>
                    <button
                      onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      {isEditing ? "Save Changes" : "Edit Profile"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Mail className="w-4 h-4" />
                    <span>{profileData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span className="capitalize">{profileData.role}</span>
                    {profileData.isActive && (
                      <span className="ml-2 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <p className="text-muted-foreground">{profileData.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <p className="text-muted-foreground">{profileData.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Avatar URL</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profileData.image}
                      onChange={(e) => setProfileData({ ...profileData, image: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <p className="text-muted-foreground">{profileData.image || "No avatar set"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Account Type</label>
                  <p className="text-muted-foreground capitalize">{profileData.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Account Created</label>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {profileData.createdAt ? (() => {
                        try {
                          const date = new Date(profileData.createdAt);
                          return !isNaN(date.getTime()) ? date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : "N/A";
                        } catch {
                          return "N/A";
                        }
                      })() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tutor Profile Section (if user is a tutor) */}
            {profileData.role === 'tutor' && (
              <div className="bg-card rounded-lg border p-6 mt-6">
                <h3 className="text-xl font-semibold mb-4">Tutor Profile</h3>
                <button
                  onClick={() => router.push('/tutor-profile')}
                  className="w-full px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                >
                  Manage Tutor Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
