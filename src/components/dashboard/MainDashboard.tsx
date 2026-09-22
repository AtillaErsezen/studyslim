'use client';

import { useState, useCallback, useEffect } from "react";
import dynamic from 'next/dynamic';
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import UserChat from "@/components/UserChat";
import CreateNewChat from "@/components/CreateNewChat";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, MessageSquare, User, Settings, LogOut, ChevronRight, ChevronsUpDown, Calendar, MessageCircle, Plus } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const BookingsPanel = dynamic(() => import('@/components/BookingsPanel'), {
  ssr: false,
  loading: () => <div className="w-full h-96 rounded-lg border border-border bg-slate-100 animate-pulse" />
});
//TODO make possible to chat among all users regardless of role
//TODO pending bookings with removed courses should be cancelled automatically
//TODO cancelling bookings from tutor side
export default function MainDashboard({ userData }: { userData: any }) {
  console.log("userData", userData)
  const isTutor = userData?.role === 'tutor';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"messages" | "bookings">("messages");
  const [selectedContact, setSelectedContact] = useState<{id: string; name: string; image: string; conversationId: string} | null>(null);
  const [showCreateChat, setShowCreateChat] = useState(false);

  // Fetch conversations from conversations table
  const { data: conversationsData, isLoading: conversationsLoading, mutate: mutateConversations } = useSWR(
    userData?.id ? `/api/conversations` : null,
    (url) => fetch(url).then(res => res.json()),
    {
      refreshInterval: 30000, // Poll every 30 seconds instead of 5
      revalidateOnFocus: false, // Don't revalidate on every focus
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
    }
  );
  //FIXME create new chat component eskisi gibi gozukmeli
  //TODO add delete chat functionality(three dots on message panel top right corner) delete from conversations and messages tables
  //FIXME chat rendering animation(loading text shouldn't appear in human message, message sent by user rendered as if sent from the other side first, after closing vscode) same thing for bookings(accept-deny buttons seen on tutor side)
  // Transform conversations data for display
  const conversationUsers = (conversationsData?.data || []).map((conv: any) => ({
    id: conv.otherUser.id,
    name: conv.otherUser.name,
    image: conv.otherUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser.id}`,
    conversationId: conv.conversation.id,
    lastMessage: conv.conversation.lastMessageContent,
    lastMessageAt: conv.conversation.lastMessageAt,
  }));

  const handleSetActiveTab = useCallback((tab: "messages" | "bookings") => {
    setActiveTab(tab);
  }, []);

  const handleSelectContact = useCallback((contact: {id: string; name: string; image: string; conversationId?: string}) => {
    setSelectedContact({
      ...contact,
      conversationId: contact.conversationId || '',
    });
    setActiveTab("messages");
  }, []);

  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  const handleGoToProfile = useCallback(() => {
    const profilePath = isTutor ? '/tutor/profile' : '/student/profile';
    router.push(profilePath);
  }, [router, isTutor]);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    window.location.href = '/login';
  }, []);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="px-4 py-3 cursor-pointer" onClick={handleGoHome}>
            <span className="text-xl font-bold text-foreground">Study<span className="text-primary">Slim</span></span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleGoHome} tooltip="Home">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Collapsible
                defaultOpen={true}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Messages">
                      <MessageSquare className="w-4 h-4" />
                      <span>Messages</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {conversationsLoading ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">Loading conversations...</div>
                      ) : conversationUsers.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">No conversations yet</div>
                      ) : (
                        conversationUsers.map((contact: { id: any; image: any; name: any; conversationId?: string | undefined; }) => (
                          <SidebarMenuSubItem key={contact.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={selectedContact?.id === contact.id}
                              onClick={() => handleSelectContact(contact)}
                              className="cursor-pointer"
                            >
                              <button className="flex items-center gap-2">
                                <img
                                  src={contact.image}
                                  alt={contact.name}
                                  className="w-8 h-8 rounded-full"
                                />
                                <span className="text-xs">{contact.name}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      )}
                      {/* AI Assistant button - always visible */}
                      <SidebarMenuSubItem className="mt-1">
                        <SidebarMenuSubButton
                          asChild
                          onClick={() => {/* TODO: Implement AI chat functionality */}}
                          className="cursor-pointer hover:bg-purple-500/10 transition-colors"
                        >
                          <button className="flex items-center gap-3 py-3 px-3 w-full border-t border-border/50 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent hover:via-purple-500/10">
                            <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                              <span className="text-xl">🤖</span>
                            </div>
                            <span className="text-sm font-medium text-purple-500">AI Assistant</span>
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {/* Always show "Start a New Chat" button at the bottom */}
                      <SidebarMenuSubItem className="mt-1">
                        <SidebarMenuSubButton
                          asChild
                          onClick={() => setShowCreateChat(true)}
                          className="cursor-pointer hover:bg-primary/10 transition-colors"
                        >
                          <button className="flex items-center gap-3 py-3 px-3 w-full border-t border-border/50 bg-gradient-to-r from-transparent via-primary/5 to-transparent hover:via-primary/10">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Plus className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-primary">Start New Chat</span>
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Bookings" onClick={() => handleSetActiveTab("bookings")} isActive={activeTab === "bookings"}>
                  <Calendar className="w-4 h-4" />
                  <span>Bookings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={userData?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor"}
                        alt={userData?.name || "Tutor"}
                      />
                      <AvatarFallback className="rounded-lg">TT</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {userData?.name}
                      </span>
                      <span className="truncate text-xs">
                        {userData?.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="right"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={userData?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Tutor"}
                          alt={userData?.name || "Tutor"}
                        />
                        <AvatarFallback className="rounded-lg">
                          TT
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {userData?.name}
                        </span>
                        <span className="truncate text-xs">
                          {userData?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleGoToProfile}>
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold primary">Dashboard</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-col h-full w-full">
            {activeTab === "messages" ? (
              selectedContact ? (
                <UserChat 
                  studentId={selectedContact.id} 
                  studentName={selectedContact.name} 
                  studentImage={selectedContact.image}
                  conversationId={selectedContact.conversationId}
                />
              ) : conversationUsers.length === 0 && !conversationsLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                  <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold text-foreground">No conversations yet</h3>
                      <p className="text-muted-foreground">
                        Start connecting with {isTutor ? 'students' : 'tutors'} by creating your first conversation
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreateChat(true)}
                      className="group mt-4 flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
                    >
                      <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
                      Start a New Chat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Select a conversation to start messaging</p>
                </div>
              )
            ) : (
              <BookingsPanel userId={userData.id} />
            )}
          </div>
        </div>
      </SidebarInset>

      {/* Create New Chat Modal */}
      {showCreateChat && (
        <CreateNewChat
          onClose={() => setShowCreateChat(false)}
          onSelectUser={async (user) => {
            // Create conversation when user is selected
            try {
              const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ other_user_id: user.id }),
              });
              const result = await response.json();
              
              if (result.success) {
                // Refresh conversations list
                mutateConversations();
                
                // Set selected student with conversation ID
                setSelectedContact({
                  ...user,
                  conversationId: result.data.id,
                });
                setActiveTab("messages");
              }
            } catch (error) {
              console.error('Failed to create conversation:', error);
            }
          }}
          currentUserId={userData?.id}
        />
      )}
    </SidebarProvider>
  );
}
