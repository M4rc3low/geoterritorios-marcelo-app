const PILL_STYLES = {
  yellow: 'bg-primary/10 text-primary border-primary/25',
  blue: 'bg-geo-blue/10 text-geo-blue border-geo-blue/25',
  green: 'bg-geo-green/10 text-geo-green border-geo-green/25',
  red: 'bg-geo-red/10 text-geo-red border-geo-red/25',
  orange: 'bg-geo-orange/10 text-geo-orange border-geo-orange/25',
  purple: 'bg-geo-purple/10 text-geo-purple border-geo-purple/25',
  muted: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
};

export default function Pill({ children, variant = 'yellow' }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${PILL_STYLES[variant] || PILL_STYLES.yellow}`}>
      {children}
    </span>
  );
}