function normalizeStringArray(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function extractQuotedStrings(rawText: string): string[] {
  const matches = Array.from(rawText.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g));

  return normalizeStringArray(
    matches.map((match) => match[1] ?? match[2] ?? "")
  );
}

function extractDelimitedStrings(rawText: string): string[] {
  const cleaned = rawText
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .replace(/^\s*\[/, "")
    .replace(/\]\s*$/, "")
    .trim();

  if (!cleaned) return [];

  return normalizeStringArray(
    cleaned
      .split(/[,\n]/)
      .map((value) => value.replace(/^["'\s]+|["'\s]+$/g, ""))
  );
}

export function parseModelStringArray(rawText: string): string[] {
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return normalizeStringArray(parsed);
      }
    } catch {
      // Fall through to more tolerant parsing for malformed model output.
    }
  }

  const quotedStrings = extractQuotedStrings(rawText);
  if (quotedStrings.length > 0) {
    return quotedStrings;
  }

  return extractDelimitedStrings(rawText);
}
