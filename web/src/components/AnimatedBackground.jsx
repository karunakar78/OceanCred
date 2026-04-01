export default function AnimatedBackground() {
  return (
    <div className="ambient-bg" aria-hidden>
      <div className="ambient-bg__base" />
      <div className="ambient-bg__orb ambient-bg__orb--primary" />
      <div className="ambient-bg__orb ambient-bg__orb--secondary" />
      <div className="ambient-bg__grain" />
      <div className="ambient-bg__grid" />
    </div>
  );
}
