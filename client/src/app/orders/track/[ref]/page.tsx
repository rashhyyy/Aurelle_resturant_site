import { redirect } from 'next/navigation';

export const instant = false;

interface PageProps {
  params: Promise<{ ref: string }>;
}

export default async function OrderTrackRedirect({ params }: PageProps) {
  const { ref } = await params;
  if (ref && typeof ref === 'string') {
    redirect(`/cart?ref=${encodeURIComponent(ref.toUpperCase())}&stage=status`);
  } else {
    redirect('/cart?stage=status');
  }
}
