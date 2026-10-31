import Link from "next/link"
import { WavesIcon as Waves } from "@phosphor-icons/react/ssr"

export function Wordmark({ href = "/ringkasan" }: { href?: string }) {
  return <Link href={href} aria-label={href === "/" ? "TERMA · Tentang aplikasi" : "TERMA · Hari ini"} className="brand-logo shrink-0 rounded-sm">
    <span className="terma-mark"><Waves size={23} aria-hidden /></span><span className="terma-wordmark">terma<span>.</span></span>
  </Link>
}
