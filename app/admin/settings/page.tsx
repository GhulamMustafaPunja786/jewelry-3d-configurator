export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Settings</h1>
      <div className="space-y-4 border border-[var(--color-border)] bg-white/80 p-6 text-sm text-[var(--color-ink-muted)]">
        <p>
          Environment is configured via <code>.env</code>. See{" "}
          <code>.env.example</code> for all supported variables.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[var(--color-ink)]">Database</strong> — SQLite
            locally; switch <code>DATABASE_URL</code> to PostgreSQL for production.
          </li>
          <li>
            <strong className="text-[var(--color-ink)]">Email / WhatsApp / AI</strong>{" "}
            — adapters no-op gracefully when unset.
          </li>
          <li>
            <strong className="text-[var(--color-ink)]">3D assets</strong> — place GLB
            files in <code>public/models/rings/</code>.
          </li>
          <li>
            <strong className="text-[var(--color-ink)]">Session</strong> — local
            cookie auth with jose + bcryptjs (Supabase Auth can be adapted later).
          </li>
        </ul>
      </div>
    </div>
  );
}
