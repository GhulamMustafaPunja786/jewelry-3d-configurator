import { prisma } from "@/lib/database/prisma";

export default async function AdminProductsPage() {
  const products = await prisma.jewelryProduct.findMany({
    include: { models: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Products</h1>
      <div className="grid gap-4">
        {products.map((product) => (
          <article
            key={product.id}
            className="border border-[var(--color-border)] bg-white/80 p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl">{product.name}</h2>
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
                {product.category} · {product.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              {product.description}
            </p>
            <ul className="mt-4 space-y-1 text-sm">
              {product.models.map((model) => (
                <li key={model.id}>
                  {model.name}{" "}
                  <span className="text-[var(--color-ink-muted)]">
                    ({model.slug}
                    {model.modelUrl ? ` · ${model.modelUrl}` : " · procedural"})
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
