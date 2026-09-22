'use client';

import dynamic from 'next/dynamic';

const TutorSearch = dynamic(() => import('@/components/TutorSearch'), {
  ssr: false,
  loading: () => <div className="w-full h-96 rounded-lg border border-border bg-slate-100 animate-pulse" />
});

export default function ManualSearchPanel() {
  return (
    <div className="space-y-4 text-foreground">
      <TutorSearch />
    </div>
  );
}
