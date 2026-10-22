import { PoofsyLogo } from "@/components/branding";
import { cn } from "@/lib/utils/component";

/*
 * Original Poofsy pixel art. Each sprite is a grid of characters, one per pixel, mapped to a
 * fixed sprite palette (sprites keep their own colours in every theme, like game sprites do).
 * "." is transparent. Rows may differ in length; short rows are simply empty on the right.
 */
const PALETTE: Record<string, string> = {
  o: "#26282f", // outline
  w: "#fffcf0", // white
  c: "#f6efd9", // cream
  s: "#c9cfd9", // silver
  S: "#8a93a6", // silver shade
  y: "#f2c230", // gold
  Y: "#c48a10", // gold shade
  g: "#3fae4f", // green
  G: "#2e7d3a", // green shade
  b: "#7a9cc6", // blue
  B: "#3d5f94", // blue shade
  r: "#d6402f", // red
  R: "#9c2a1f", // red shade
  p: "#f29bb0", // pink
  P: "#c96a85", // pink shade
  n: "#a8713f", // brown
  N: "#6b4424", // brown shade
};

export const SPRITES = {
  coin: [
    "...oooooo...",
    "..oyyyyyyo..",
    ".oywwyyyyYo.",
    "oywyyyyyyyYo",
    "oywyyYYyyyYo",
    "oyyyyYyyyyYo",
    "oyyyyYyyyyYo",
    "oyyyyYYyyyYo",
    "oyyyyyyyyYYo",
    ".oyyyyyyYYo.",
    "..oYYYYYYo..",
    "...oooooo...",
  ],
  wallet: [
    ".ooooooooooooo.",
    "oGGGGGGGGGGGGGo",
    "oggggggggggggGo",
    "ogggggggoooooooo",
    "ogggggggowwwwyyo",
    "ogggggggowwwwyyo",
    "ogggggggoooooooo",
    "oggggggggggggGo",
    "oggggggggggggGo",
    "oGGGGGGGGGGGGGo",
    ".ooooooooooooo.",
  ],
  bag: [
    ".....oooo.....",
    "....onnnno....",
    ".....oNNo.....",
    "....oyyyyo....",
    "..ooyyyyyyoo..",
    ".oyyyyooyyyyo.",
    "oyyyyoyyoyyyYo",
    "oyyyyoyyyyyyYo",
    "oyyyyyooyyyyYo",
    "oyyyyyyyoyyyYo",
    "oyyyyoyyoyyyYo",
    ".oyyyyooyyyYo.",
    "..oYYYYYYYYo..",
    "...oooooooo...",
  ],
  piggy: [
    "........oooo.....",
    "...oo..oyYyo.....",
    "..oppooooooooo...",
    "..opppppppppppoo.",
    ".opppppppppppppPo",
    "oppwopppppppppppPo",
    "opppppppppppppppPo",
    "oPPppppppppppppPo",
    ".oPpppppppppppPo.",
    "..oPPPpppppPPPo..",
    "...oPoooooooPo...",
    "...oo.......oo...",
  ],
  receipt: [
    ".oooooooooo.",
    ".owwwwwwwwo.",
    ".owoooooowo.",
    ".owwwwwwwwo.",
    ".owoooowwwo.",
    ".owwwwwwwwo.",
    ".owooooowwo.",
    ".owwwwwwwwo.",
    ".owwwwrrrwo.",
    ".owwwwwwwwo.",
    ".owowowowoo.",
    ".oo.o.o.o.o.",
  ],
  chart: [
    "o...............",
    "o.........ooo...",
    "o.........oGo...",
    "o.....ooo.oGo...",
    "o.....oBo.oGo...",
    "o.ooo.oBo.oGo...",
    "o.oYo.oBo.oGo...",
    "o.oYo.oBo.oGo...",
    "oooooooooooooooo",
  ],
  calendar: [
    ".oo.......oo.",
    "ooooooooooooo",
    "orrrrrrrrrrro",
    "oRRRRRRRRRRRo",
    "ooooooooooooo",
    "owwwwwwwwwwwo",
    "owSwSwSwSwSwo",
    "owwwwwwwwwwwo",
    "owSwSwSwGGwwo",
    "owwwwwwwGGwwo",
    "owSwSwSwSwSwo",
    "owwwwwwwwwwwo",
    "ooooooooooooo",
  ],
  flag: [
    "oo..........",
    "oooooooo....",
    "oorrrrrro...",
    "oorrrrrrroo.",
    "oorrrrrrrrro",
    "oorrrrrrooo.",
    "oooooooo....",
    "oo..........",
    "oo..........",
    "oo..........",
    "oo..........",
    "oooo........",
  ],
  star: [
    "......oo......",
    ".....oyyo.....",
    ".....oyyo.....",
    "....oyyyyo....",
    "oooooyyyyooooo",
    "oyyyyyywyyyyyo",
    ".oyyyyyyyyyyo.",
    "..oyyyyyyyyo..",
    "...oyyyyyyo...",
    "..oyyyyyyyyo..",
    "..oyyyooyyyo..",
    ".oyyyo..oyyyo.",
    ".oyoo....ooyo.",
    ".oo........oo.",
  ],
  puff: [
    ".....oooo.......",
    "...oowwwwoo.ooo.",
    "..owwwwwwwwowwwo",
    ".owwwwwwwwwwwwwwo",
    "owwwwwwwwwwwwwwso",
    "owwwwwwwwwwwwwso.",
    ".owwwwwwwwwwwsso.",
    "..oowwwssssssoo..",
    "....oooooooooo...",
  ],
  /** Quest log: savings goals. */
  scroll: [
    ".oooooooooooo.",
    "onnccccccccnno",
    ".occccccccccoN",
    ".ocooooooooco.",
    ".occccccccccc.",
    ".ocoooooocccco",
    ".occccccccccco",
    ".ocooooooooocco",
    ".occccccccccco",
    "onnccccccccnno",
    ".oooooooooooo.",
  ],
  /** Payment card. */
  card: [
    "oooooooooooooo",
    "obbbbbbbbbbbbo",
    "oBBBBBBBBBBBBo",
    "obbbbbbbbbbbbo",
    "obyyobbbbbbbbo",
    "obyyobbbbbbbbo",
    "obbbbbbbbbbbbo",
    "obwwwbwwwbbbbo",
    "obbbbbbbbbbbbo",
    "oooooooooooooo",
  ],
  /** Home: recurring bills. */
  house: [
    "......oo......",
    ".....orro.....",
    "....orrrro....",
    "...orrrrrro...",
    "..orrrrrrrro..",
    ".oRRRRRRRRRRo.",
    "oooooooooooooo",
    ".occccccccccoo",
    ".ocbbccccnnco.",
    ".ocbbccccnnco.",
    ".occccccccnco.",
    ".oooooooooooo.",
  ],
  /** Transfer between accounts. */
  swap: [
    "........oo....",
    "........ogo...",
    ".oooooooogggo.",
    ".ogggggggggggo",
    ".oooooooogggo.",
    "........ogo...",
    "...oo...oo....",
    "..obo.........",
    ".obbboooooooo.",
    "obbbbbbbbbbbo.",
    ".obbboooooooo.",
    "..obo.........",
    "...oo.........",
  ],
  /** Paid / done. */
  check: [
    "..........ooo",
    ".........oggo",
    "........oggo.",
    "oo.....oggo..",
    "ogo...oggo...",
    "oggo.oggo....",
    ".oggoggo.....",
    "..ogggo......",
    "...ogo.......",
    "....o........",
  ],
  /** Heads-up: warnings and overdue. */
  alert: [
    ".....oo.....",
    "....oyyo....",
    "....oyyo....",
    "...oyyyyo...",
    "...oyooyo...",
    "..oyyooyyo..",
    "..oyyooyyo..",
    ".oyyyooyyyo.",
    ".oyyyyyyyyo.",
    "oyyyyooyyyyo",
    "oyyyyooyyyyo",
    "oooooooooooo",
  ],
} as const satisfies Record<string, readonly string[]>;

/** "mascot" is the Poofsy cat from the brand bundle (public/images/poofsy-icon.svg), not a grid sprite. */
export type SpriteName = keyof typeof SPRITES | "mascot";

type SpriteProps = {
  name: SpriteName;
  /** Rendered height in CSS pixels; width follows the sprite's own ratio. Use multiples of its height for crisp pixels. */
  size?: number;
  /** Accessible name. Omit for decoration (the sprite is then hidden from screen readers). */
  title?: string;
  className?: string;
};

export function Sprite({ name, size = 24, title, className }: SpriteProps) {
  // The mascot is the user's own artwork, so every speech box, empty state and header shows the same cat.
  if (name === "mascot") {
    return (
      <PoofsyLogo
        variant="icon"
        size={size}
        alt={title ?? ""}
        className={cn("inline-block shrink-0", className)}
      />
    );
  }

  const rows = SPRITES[name];
  const height = rows.length;
  const width = Math.max(...rows.map((row) => row.length));
  const rects: React.ReactElement[] = [];

  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      let run = 1;
      while (row[x + run] === key) run++;
      if (key !== "." && PALETTE[key]) {
        rects.push(
          <rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={PALETTE[key]} />
        );
      }
      x += run;
    }
  });

  return (
    <svg
      data-pixel
      viewBox={`0 0 ${width} ${height}`}
      height={size}
      width={Math.round((size * width) / height)}
      className={cn("inline-block shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      shapeRendering="crispEdges"
    >
      {rects}
    </svg>
  );
}
