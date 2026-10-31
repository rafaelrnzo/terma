export function DashboardSkeleton() {
  return <div role="status" aria-label="Memuat ringkasan shift" className="space-y-6">
    <div className="space-y-3"><h1 className="text-xl font-semibold">Ringkasan shift</h1><div className="skeleton-value h-4 w-52" /></div>
    <div className="metrics-grid">{["Pekerja", "Rencana disetujui", "Perlu perhatian", "Cakupan bacaan"].map(label => <div key={label} className="summon-panel p-5"><p className="text-sm text-muted-foreground">{label}</p><div className="skeleton-value mt-4 h-8 w-20" /><div className="skeleton-value mt-3 h-3 w-32" /></div>)}</div>
    <div className="summon-panel p-5"><h2 className="text-sm font-medium">Profil panas zona</h2><div className="skeleton-value mt-5 h-64 w-full" /></div>
  </div>
}
