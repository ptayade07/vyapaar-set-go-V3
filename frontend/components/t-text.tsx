"use client";

import { useT } from "@/frontend/lib/i18n";

type Props = {
  hi: string;
  en: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
};

/** Renders whichever language is active. Lets static Hinglish/English pairs sit inside Server Component pages. */
export function T({ hi, en, as: Tag = "span", className }: Props) {
  const t = useT();
  return <Tag className={className}>{t(hi, en)}</Tag>;
}
