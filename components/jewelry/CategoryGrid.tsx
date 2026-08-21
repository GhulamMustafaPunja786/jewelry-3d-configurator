import { CATEGORIES } from "@/data/categories";
import { CategoryCard } from "./CategoryCard";

export function CategoryGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}
