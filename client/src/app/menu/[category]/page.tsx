import { redirect } from "next/navigation";

export const instant = false;

export function generateStaticParams() {
  return [
    { category: "sri-lankan" },
    { category: "indian" },
    { category: "east-asian" },
    { category: "plant-led" },
    { category: "vegan" },
    { category: "international" },
    { category: "dessert" },
    { category: "drinks" },
  ];
}

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryMenuRedirectPage({ params }: PageProps) {
  const { category } = await params;
  const clean = category.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (clean.includes("sri")) {
    redirect("/menu?category=Sri+Lankan#menu-items");
  }
  if (clean.includes("ind")) {
    redirect("/menu?category=Indian#menu-items");
  }
  if (clean.includes("east") || clean.includes("asian")) {
    redirect("/menu?category=East+Asian#menu-items");
  }
  if (clean.includes("plant") || clean.includes("vegan")) {
    redirect("/menu?category=Plant-led#menu-items");
  }
  if (clean.includes("dessert")) {
    redirect("/menu?category=Dessert#menu-items");
  }
  if (clean.includes("drink")) {
    redirect("/menu?category=Drinks#menu-items");
  }

  redirect("/menu#menu-items");
}
