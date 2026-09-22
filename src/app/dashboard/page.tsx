import { redirect } from "next/navigation";
import { headers } from "next/headers";
import MainDashboard from '@/components/dashboard/MainDashboard';

// Force dynamic rendering - prevent build-time prerendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function DashboardPage() {
  // Lazy load auth
  const { auth } = await import("@/lib/auth");
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log("DashboardPage session:", session);
  if (!session) {
    redirect('/login');
  }
  if (!session.user.role || (session.user.role !== 'student' && session.user.role !== 'tutor')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Role</h1>
          <p className="mt-2 text-muted-foreground">Your account doesn't have a valid role assigned.</p>
        </div>
      </div>
    );
  }

  return <MainDashboard userData={session.user} />;
}
