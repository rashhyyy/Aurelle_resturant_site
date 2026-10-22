import React, { Suspense } from 'react';
import EditVIPRoomClient from './EditVIPRoomClient';
import { Loader2 } from 'lucide-react';

export const instant = false;

interface EditVIPRoomPageProps {
  params: Promise<{ id: string }>;
}

async function EditVIPRoomAsync({ params }: EditVIPRoomPageProps) {
  const { id } = await params;
  return <EditVIPRoomClient id={id} />;
}

export default function EditVIPRoomPage({ params }: EditVIPRoomPageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-24 flex flex-col items-center justify-center gap-3 text-stone-400">
          <Loader2 size={32} className="animate-spin text-[#B99A63]" />
          <p className="text-xs uppercase tracking-wider">Loading room configuration...</p>
        </div>
      }
    >
      <EditVIPRoomAsync params={params} />
    </Suspense>
  );
}
