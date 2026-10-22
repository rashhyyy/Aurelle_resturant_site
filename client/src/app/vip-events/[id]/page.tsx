import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { SPACES, getSpaceById } from "../../../data/spaces";
import SpaceDetailClient from "./SpaceDetailClient";

export const instant = false;

export function generateStaticParams() {
  return SPACES.flatMap((space) => [
    { id: space.id },
    { id: String(space.numericId) },
  ]);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function SpaceDetailAsync({ params }: PageProps) {
  const resolvedParams = await params;
  const space = getSpaceById(resolvedParams.id);

  if (!space) {
    notFound();
  }

  return <SpaceDetailClient space={space} />;
}

export default function SpaceDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#111215] flex items-center justify-center text-stone-400">
          <span className="font-serif text-lg tracking-widest uppercase">
            Loading Aurelle Space...
          </span>
        </div>
      }
    >
      <SpaceDetailAsync params={params} />
    </Suspense>
  );
}
