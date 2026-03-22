import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  const prisma = new PrismaClient({ adapter });

  const styles = [
    {
      name: "Minimalist Clean",
      prompt: `# Minimalist Clean Style

## Visual Direction
- **Color Palette**: Whites, light grays, muted pastels. Maximum 3 colors.
- **Typography**: Clean sans-serif. Thin weights. Generous letter-spacing.
- **Layout**: Abundant whitespace. Center-aligned hero product. No clutter.

## Tone
Sophisticated, calm, understated luxury. Let the product speak for itself.

## Composition Rules
1. Product occupies 40-60% of frame, centered or rule-of-thirds
2. Background: solid color or subtle gradient, never busy
3. No more than 2 text elements (headline + subline)
4. Shadow/lighting: soft, diffused, natural

## Example Output JSON
\`\`\`json
{
  "prompt": "A minimalist product photo of [PRODUCT] on a clean white surface, soft diffused lighting, ample negative space, muted pastel accent, professional advertising photography, 4k, ultra clean",
  "negative_prompt": "cluttered, busy background, harsh shadows, text overlay, watermark",
  "aspect_ratio": "1:1"
}
\`\`\``,
    },
    {
      name: "Bold & Vibrant",
      prompt: `# Bold & Vibrant Style

## Visual Direction
- **Color Palette**: Saturated primaries and complementary contrasts. Electric blues, hot pinks, vivid oranges.
- **Typography**: Heavy bold fonts. High contrast against background.
- **Layout**: Dynamic angles, overlapping elements, energetic composition.

## Tone
Exciting, youthful, attention-grabbing. High energy street-level appeal.

## Composition Rules
1. Product at a dynamic angle, not straight-on
2. Background: bold color blocks or gradient splashes
3. Motion blur or speed lines for energy
4. High contrast lighting, dramatic shadows acceptable

## Example Output JSON
\`\`\`json
{
  "prompt": "A vibrant dynamic advertisement featuring [PRODUCT], bold saturated colors, energetic composition, dramatic lighting, pop art influence, eye-catching commercial photography, 4k",
  "negative_prompt": "muted colors, plain, boring, static, dull lighting",
  "aspect_ratio": "1:1"
}
\`\`\``,
    },
    {
      name: "Premium Luxury",
      prompt: `# Premium Luxury Style

## Visual Direction
- **Color Palette**: Deep blacks, charcoals, gold accents, rich burgundy. Dark mode aesthetic.
- **Typography**: Elegant serif or refined sans-serif. Gold or cream on dark.
- **Layout**: Symmetrical, balanced, grand. Generous margins.

## Tone
Opulent, exclusive, aspirational. Evoke desire and prestige.

## Composition Rules
1. Product lit with dramatic rim lighting or spotlight
2. Background: dark textured surface (marble, velvet, dark wood)
3. Gold/metallic accents for highlights
4. Shallow depth of field, bokeh acceptable

## Example Output JSON
\`\`\`json
{
  "prompt": "A luxury advertisement featuring [PRODUCT] on dark marble surface, dramatic rim lighting, gold accents, shallow depth of field, premium feel, high-end commercial photography, 4k",
  "negative_prompt": "cheap, bright colors, cluttered, casual, low quality",
  "aspect_ratio": "1:1"
}
\`\`\``,
    },
  ];

  for (const style of styles) {
    await prisma.style.upsert({
      where: { name: style.name },
      update: { prompt: style.prompt },
      create: style,
    });
  }

  console.log("Seeded 3 styles successfully.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
