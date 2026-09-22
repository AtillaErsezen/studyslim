import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "https://localhost:3000",
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
        "https://studyslim.vercel.app",
    "https://*.vercel.app", // Wildcard for all preview deployments
  
  ].filter(Boolean), // Remove empty strings
});