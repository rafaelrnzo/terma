import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return <section className="mx-auto max-w-lg py-16"><h1 className="font-heading text-3xl font-medium">Halaman tidak ditemukan</h1><p className="mt-4 text-muted-foreground">Alamat mungkin berubah atau belum tersedia. Kembali ke ringkasan untuk melanjutkan pekerjaan Anda.</p><Button asChild className="mt-6"><Link href="/ringkasan">Kembali ke ringkasan</Link></Button></section>
}
