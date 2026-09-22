import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const dynamic = 'force-dynamic'; //dynamic rendering to avoid build-time errors
export const runtime = 'nodejs';

export const { POST, GET } = toNextJsHandler(auth);