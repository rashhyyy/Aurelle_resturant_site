'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OrderTrackRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const ref = params?.ref;
    if (ref && typeof ref === 'string') {
      router.replace(`/cart?ref=${encodeURIComponent(ref.toUpperCase())}&stage=status`);
    } else {
      router.replace('/cart?stage=status');
    }
  }, [params, router]);

  return (
    <div className="w-full min-h-screen bg-[#111215] flex items-center justify-center text-stone-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#C1A87D] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-stone-400">
          Loading Aurelle Order Tracking...
        </p>
      </div>
    </div>
  );
}
