import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { STORIES, getStoryById } from "../../../data/stories";
import RecipeStoryClient from "./RecipeStoryClient";

export const instant = false;

export function generateStaticParams() {
  return STORIES.flatMap((story) => [
    { id: story.id },
    { id: String(story.numericId) },
  ]);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function RecipeStoryDetail({ params }: PageProps) {
  const resolvedParams = await params;
  const story = getStoryById(resolvedParams.id);

  if (!story) {
    notFound();
  }

  return <RecipeStoryClient activeStory={story} />;
}

export default function RecipeStoryPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#111215] flex items-center justify-center text-stone-400">
          <span className="font-serif text-lg tracking-widest uppercase">
            Loading Story...
          </span>
        </div>
      }
    >
      <RecipeStoryDetail params={params} />
    </Suspense>
  );
}
