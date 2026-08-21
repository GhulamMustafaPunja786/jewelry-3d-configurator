export function HowItWorks() {
  const steps = [
    {
      title: "Describe",
      body: "Tell us the type, style, metal, and stone you have in mind.",
    },
    {
      title: "Visualize",
      body: "Review an AI-generated 3D preview and refine with feedback.",
    },
    {
      title: "Estimate",
      body: "Receive an atelier estimate and submit for specialist review.",
    },
  ];

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-cream-deep)]/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display mb-10 text-3xl text-[var(--color-ink)]">
          How it works
        </h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
                Step {index + 1}
              </p>
              <h3 className="mt-2 font-display text-2xl text-[var(--color-ink)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
