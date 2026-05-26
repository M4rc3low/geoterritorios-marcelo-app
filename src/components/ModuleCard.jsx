import { Link } from 'react-router-dom';

const ACCENT_COLORS = {
  yellow: 'before:bg-primary',
  blue: 'before:bg-geo-blue',
  green: 'before:bg-geo-green',
  orange: 'before:bg-geo-orange',
};

export default function ModuleCard({ icon, title, desc, nums, cta, to, color = 'yellow' }) {
  return (
    <Link
      to={to}
      className={`bg-card border border-border rounded-lg p-5 cursor-pointer transition-all duration-200 relative overflow-hidden
        before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] ${ACCENT_COLORS[color] || ''}
        hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] group`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-crimson text-[17px] font-medium mb-1">{title}</div>
      <div className="text-[11px] text-muted-foreground leading-relaxed mb-3">{desc}</div>
      {nums && (
        <div className="flex gap-4">
          {nums.map((n, i) => (
            <div key={i}>
              <div className={`font-crimson text-[22px] font-medium ${n.color || 'text-primary'}`}>{n.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{n.label}</div>
            </div>
          ))}
        </div>
      )}
      <div className="text-[11px] text-muted-foreground mt-2.5 transition-colors group-hover:text-primary">
        {cta}
      </div>
    </Link>
  );
}