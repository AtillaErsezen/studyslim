import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: "https://studyslim.vercel.app", // Replace with your actual base URL
});

// Better Auth creates these hooks for you automatically.
// You don't need to write them yourself!
export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession, 
} = authClient;