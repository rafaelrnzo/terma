import Link from "next/link"
import Image from "next/image"

export function Wordmark({ href = "/ringkasan" }: { href?: string }) {
  return <Link href={href} aria-label={href === "/" ? "TERMA · Tentang aplikasi" : "TERMA · Hari ini"} className="brand-logo shrink-0 rounded-sm">
    <span className="brand-logo-frame"><Image src="/brand/terma-heatwave.png" alt="" width={2078} height={757} priority /></span>
  </Link>
}
