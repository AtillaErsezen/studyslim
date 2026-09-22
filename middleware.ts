//protect route middleware: security guard for certain routes
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
 
export async function middleware(request: NextRequest) {
	//redirect users to login if not authenticated
	const session = await auth.api.getSession(request);
	if(!session) {
		return NextResponse.redirect(new URL("/login", request.nextUrl));
	}
	console.log("Middleware session user FOUND!:", session.user);
	return NextResponse.next();
}
 
export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard/:path*", "/tutor/:path*", "/bookings/:path*"],
};