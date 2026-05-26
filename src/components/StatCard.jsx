export default function StatCard({ value, label, color = 'text-primary' }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col gap-1">
      <div className={`font-crimson text-[30px] leading-none font-medium ${color}`}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
        {label}
      </div>
    </div>
  );
}