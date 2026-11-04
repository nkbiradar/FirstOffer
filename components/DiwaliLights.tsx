// A single string of twinkling Diwali fairy lights across the top of the
// homepage hero. Pure CSS animation (no JS), decorative only; the homepage
// shows it only while the Diwali offer is running.
const BULBS = 44;
const SWAGS = 11; // the wire dips between hooks this many times
const COLORS = ["#fbbf24", "#fb923c", "#f472b6", "#34d399", "#60a5fa", "#fde68a"];

export default function DiwaliLights() {
  // Wire: a row of shallow curves, drawn in a 0–1000 × 0–30 box stretched to full width.
  const seg = 1000 / SWAGS;
  let d = "M0 4";
  for (let i = 0; i < SWAGS; i += 1) d += ` Q ${seg * i + seg / 2} 26 ${seg * (i + 1)} 4`;

  return (
    <div aria-hidden="true" className="dl-strip">
      <svg className="dl-wire" preserveAspectRatio="none" viewBox="0 0 1000 30">
        <path d={d} fill="none" stroke="#7c6a3a" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: BULBS }, (_, i) => {
        const x = ((i + 0.5) / BULBS) * 1000;
        const t = (x % seg) / seg; // position within its swag, 0–1
        const y = 4 + 44 * t * (1 - t); // exactly on the wire (quadratic curve)
        return (
          <span
            className="dl-bulb"
            key={i}
            style={{
              left: `${x / 10}%`,
              top: `${(y / 30) * 100}%`,
              ["--c" as string]: COLORS[i % COLORS.length],
              animationDelay: `${(i % 7) * 0.28}s`,
            }}
          />
        );
      })}
    </div>
  );
}
