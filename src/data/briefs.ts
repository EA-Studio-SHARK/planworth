// Daily brief. One JSON file per issue in src/data/briefs/, newest first.
// Numbers come from scripts/fetch-brief.mjs; scripts/check-brief.mjs gates every issue.
export type BriefItem = {
  source: "github" | "producthunt";
  name: string;
  url: string;
  zh: string;
  en: string;
  stars?: number;
  /** Stars gained since the previous issue; unset when the repo is new to our list. */
  gain?: number;
  /** A page on this site that helps with the item. */
  related?: { to: string; label: string; labelEn: string };
};

export type Brief = {
  date: string;
  /** How many days the star gains cover. */
  days: number;
  /** The day's takeaway, one or two sentences. */
  headline: string;
  headlineEn: string;
  lead: BriefItem & { why: string; whyEn: string };
  sections: { title: string; titleEn: string; items: BriefItem[] }[];
};

const files = import.meta.glob<Brief>("./briefs/*.json", { eager: true, import: "default" });

export const briefs: Brief[] = Object.values(files).sort((a, b) => b.date.localeCompare(a.date));

export function briefByDate(date: string | undefined) {
  return date ? (briefs.find((b) => b.date === date) ?? null) : briefs[0];
}
