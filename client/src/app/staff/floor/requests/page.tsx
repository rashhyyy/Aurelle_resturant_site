'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FloorRequestsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/staff/floor/service-requests');
  }, [router]);

  return null;
}
