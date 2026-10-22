'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FloorOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/staff/floor/kitchen-alerts');
  }, [router]);

  return null;
}
