// Diwali fairy lights across the top of the homepage hero: one golden
// string on a sagging wire, with thin "curtain" strands of lights hanging
// from it that fade out downwards. Pure CSS animation (opacity only, cheap
// to render), decorative, never blocks clicks. Shown only during the offer.
const BULBS = 20;
const SWAGS = 10; // the wire dips between hooks this many times
const STRANDS = 26; // hanging curtain strands
const STRAND_GAP = 22; // px between lights on a strand
const COLOR = "#ffc861"; // one warm golden tone

export default function DiwaliLights() {
  const seg = 1000 / SWAGS;

  return (
    <div aria-hidden="true" className="dl-strip" style={{ ["--c" as string]: COLOR }}>
      <div className="dl-curtain">
        {Array.from({ length: STRANDS }, (_, i) => {
          const length = 110 + ((i * 37) % 7) * 38; // 110–338px, varied like a real curtain
          const lights = Math.floor(length / STRAND_GAP);
          return (
            <span className="dl-strand" key={i} style={{ left: `${((i + 0.5) / STRANDS) * 100}%`, height: `${length}px` }}>
              {Array.from({ length: lights }, (_, j) => (
                <i key={j} style={{ top: `${(j + 1) * STRAND_GAP}px`, animationDelay: `${((i * 3 + j * 5) % 9) * 0.25}s` }} />
              ))}
            </span>
          );
        })}
      </div>
      {Array.from({ length: BULBS }, (_, i) => {
        const x = ((i + 0.5) / BULBS) * 1000;
        const t = (x % seg) / seg; // position within its swag, 0–1
        const y = 4 + 44 * t * (1 - t); // exactly on the wire (quadratic curve)
        return (
          <span
            className="dl-bulb"
            key={i}
            style={{ left: `${x / 10}%`, top: `${(y / 30) * 100}%`, animationDelay: `${(i % 7) * 0.28}s` }}
          />
        );
      })}
    </div>
  );
}
