"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Paperclip, FileText, Video, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CreateBookingPanel from "@/components/CreateBookingPanel";
import { useSession } from "@/lib/auth-client";

interface Message {
  id: string;
  role: "user" | "assistant" | "student"; //TODO: change roles in here
  content: string;
  messageType?: string;
  bookingId?: string;
  studentName?: string;
  studentImage?: string;
}

interface StudentChatProps {
  studentId: string;
  studentName: string;
  studentImage: string;
  conversationId?: string;
}

export default function UserChat({
  studentId,
  studentName,
  studentImage,
  conversationId,
}: StudentChatProps) {
  const { data: session } = useSession();
  const [tutorId, setTutorId] = useState<string | null>(null);

  // Fetch messages from database using conversationId
  const { data: messagesData, mutate: mutateMessages } = useSWR(
    conversationId ? `/api/messages?conversation_id=${conversationId}` : null,
    (url) => fetch(url).then(res => res.json()),
    {
      refreshInterval: 3000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Transform database messages to component format
  const messages: Message[] = (messagesData?.data || []).map((msg: any) => ({
    id: msg.id,
    role: msg.senderId === session?.user?.id ? "user" : "student",
    content: msg.content,
    messageType: msg.messageType,
    bookingId: msg.bookingId,
  })).reverse(); // Reverse to show oldest first

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // Keep for send button disable state
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{[key: string]: any}>({});

  // Fetch booking details for booking messages
  useEffect(() => {
    const bookingMessages = messages.filter(m => m.messageType === 'booking' && m.bookingId);
    bookingMessages.forEach(async (msg) => {
      if (!bookingDetails[msg.bookingId!]) {
        try {
          const res = await fetch(`/api/bookings?id=${msg.bookingId}`);
          const data = await res.json();
          if (data.success) {
            setBookingDetails(prev => ({ ...prev, [msg.bookingId!]: data.data }));
          }
        } catch (error) {
          console.error('Failed to fetch booking:', error);
        }
      }
    });
  }, [messages.length]);

  //update booking status, accepted or denied
  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });

      if (response.ok) {
        // Refresh booking details
        const res = await fetch(`/api/bookings?id=${bookingId}`);
        const data = await res.json();
        if (data.success) {
          setBookingDetails(prev => ({ ...prev, [bookingId]: data.data }));
        }
        // Refresh messages
        mutateMessages();
      }
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  // Fetch tutor ID from session user ID
  useEffect(() => {
    if (session?.user?.id && (session.user as any)?.role === 'tutor') {
      fetch(`/api/tutors?user_id=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.length > 0) {
            setTutorId(data.data[0].id);
          }
        })
        .catch(err => console.error('Failed to fetch tutor ID:', err));
    }
  }, [session]);
  //TODO pending bookings with past dates should be auto-cancelled
  
  const handleDeleteChat = async () => {
    if (!conversationId) return;

    try {
      //delete messages first to handle foreign key constraint
      const messages_response = await fetch(`/api/messages?conversation_id=${conversationId}`, {
        method: 'DELETE',
      });
      //don't proceed if messages deletion failed
      if (!messages_response.ok) {
        console.error('Failed to delete messages');
        alert('Failed to delete conversation messages. Please try again.');
        return;
      }
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Navigate back or refresh - you may want to emit an event or callback here
        window.location.href = '/dashboard';
      } else {
        console.error('Failed to delete conversation');
        alert('Failed to delete conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Error deleting conversation. Please try again.');
    }
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !conversationId) return;

    setInput("");
    setLoading(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: trimmed,
          message_type: 'text',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh messages from server
        mutateMessages();
      } else {
        console.error('Failed to send message:', result.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };
  //<a href="https://www.flaticon.com/free-icons/booking" title="Booking icons">Booking icons created by Aldo Cervantes - Flaticon</a>
  return (
    <div className="w-full h-full flex flex-col rounded-lg border border-border bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center gap-3">
        <img
          src={studentImage}
          alt={studentName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{studentName}</h3>
          <p className="text-xs text-muted-foreground">Student</p>
        </div>
        
        {/* Three-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title="Chat options"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span>Delete Chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-zinc-900/50">
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Start a conversation with {studentName}
          </div>
        ) : (
          messages.map((m, i) => {
            // Render booking card for booking messages
            if (m.messageType === 'booking' && m.bookingId) {
              const booking = bookingDetails[m.bookingId];
              return (
                <div key={m.id} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                    {booking ? (
                      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-4 shadow-md space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-zinc-700">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">Booking Request</p>
                            <p className="text-xs text-muted-foreground capitalize">Status: {booking.status}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Course:</span>
                            <span className="font-medium">{booking.courseName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">{new Date(booking.sessionDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time:</span>
                            <span className="font-medium">{booking.startTime} - {booking.endTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">{booking.duration} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rate:</span>
                            <span className="font-medium">€{booking.hourlyRate}/hour</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-zinc-700">
                            <span className="text-muted-foreground font-semibold">Total:</span>
                            <span className="font-bold text-primary text-lg">€{booking.totalAmount?.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        {booking.status === 'pending' && m.role === 'student' && (
                          <div className="flex gap-2 pt-3">
                            <button
                              onClick={() => handleBookingAction(m.bookingId!, 'confirmed')}
                              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-semibold transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleBookingAction(m.bookingId!, 'cancelled')}
                              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition-colors"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                        
                        {/* Cancel button - show for both parties on pending or confirmed bookings */}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          //Dont show the students cancel booking option unless they confirm
                          !(booking.status === "pending" && m.role === "student") &&(
                          <div className="flex pt-3">
                            <button
                              onClick={() => handleBookingAction(m.bookingId!, 'cancelled')}
                              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-semibold transition-colors"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/2"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Regular text message
            return (
              <div key={m.id} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm
                    ${m.role === "user" ? "bg-primary" : "bg-slate-400"}`}>
                    {m.role === "user" ? "You" : studentName.charAt(0)}
                  </div>
                  
                  <div className={`p-3 rounded-2xl text-sm shadow-sm
                    ${m.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-none" 
                      : "bg-white border border-gray-100 text-gray-700 rounded-bl-none"
                    }`}
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded-md border border-border bg-slate-50/50 text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              disabled={loading}
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {(session?.user as any)?.role === 'tutor' && (
              <DropdownMenuItem className="cursor-pointer" onClick={() => setShowBookingPanel(true)}>
                <img src="/images/attachement_dropdown/booking.svg" alt="booking" className="w-4 h-4 mr-2" />
                <span>Create new booking</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="cursor-pointer">
              <FileText className="w-4 h-4 mr-2" />
              <span>Upload Document</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Video className="w-4 h-4 mr-2" />
              <span>Upload Video</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1 rounded-md border border-border px-3 py-2 bg-slate-50/50 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>

      {/* Booking Panel */}
      {showBookingPanel && tutorId && (
        <CreateBookingPanel
          onClose={() => setShowBookingPanel(false)}
          tutorId={tutorId}
          studentName={studentName}
          studentId={studentId}
          conversationId={conversationId}
        />
      )}

      {/* Delete Chat Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation with {studentName}? 
              This action cannot be undone and all messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
