import Link from "next/link"

/** Text identity while the team's custom logo is pending. No substitute emblem. */
export function Wordmark({ href = "/ringkasan" }: { href?: string }) {
  return <Link href={href} aria-label={href === "/" ? "TERMA — Tentang aplikasi" : "TERMA — Hari ini"} className="shrink-0 rounded-sm font-heading text-2xl font-semibold tracking-tight">terma<span className="text-primary">.</span></Link>
}
