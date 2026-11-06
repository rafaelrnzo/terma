import Link from "next/link"
import Image from "next/image"

export function Wordmark({ href = "/ringkasan" }: { href?: string }) {
  return <Link href={href} aria-label={href === "/" ? "TERMA · Tentang aplikasi" : "TERMA · Hari ini"} className="brand-logo shrink-0 rounded-sm">
    <Image className="brand-paper-light" src="/brand/terma-paper-on-light.png" width={1482} height={400} alt="TERMA" priority />
    <Image className="brand-paper-dark" src="/brand/terma-paper-on-dark.png" width={1482} height={400} alt="TERMA" priority />
  </Link>
}
