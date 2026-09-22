"use client";

import { useState, useMemo } from "react";
import { X, Search, User as UserIcon } from "lucide-react";
import useSWR from "swr";

interface CreateNewChatProps {
  onClose: () => void;
  onSelectUser: (user: { id: string; name: string; image: string }) => void;
  currentUserId: string;
}

export default function CreateNewChat({ onClose, onSelectUser, currentUserId }: CreateNewChatProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Fetch all users
  const { data: usersData, isLoading } = useSWR(
    "/api/users",
    (url) => fetch(url).then((res) => res.json()),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  // Filter users based on search query and exclude current user
  const filteredUsers = useMemo(() => {
    if (!usersData?.data) return [];
    
    const users = usersData.data.filter((user: any) => user.id !== currentUserId);
    
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter((user: any) =>
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  }, [usersData, searchQuery, currentUserId]);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
  };

  const handleConfirm = () => {
    if (selectedUser) {
      onSelectUser({
        id: selectedUser.id,
        name: selectedUser.name,
        image: selectedUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-lg font-semibold">Start New Chat</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserIcon className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No users found" : "No users available"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user: any) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group ${
                    selectedUser?.id === user.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "hover:bg-muted border-2 border-transparent"
                  }`}
                >
                  <img
                    src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt={user.name}
                    className={`w-12 h-12 rounded-full flex-shrink-0 ring-2 transition-all ${
                      selectedUser?.id === user.id
                        ? "ring-primary"
                        : "ring-transparent group-hover:ring-primary/20"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary capitalize">
                      {user.role || "student"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Button - Only show when user is selected */}
        {selectedUser && (
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleConfirm}
              className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all font-medium shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.5)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
