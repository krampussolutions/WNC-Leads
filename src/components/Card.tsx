export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
      {children}
    </div>
  );
}
