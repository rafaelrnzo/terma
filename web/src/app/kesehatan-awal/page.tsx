import { redirect } from "next/navigation"
export default async function BaselinePage({ searchParams }: { searchParams: Promise<{ pekerja?: string }> }) {
  const { pekerja } = await searchParams
  redirect(`/impor?tab=pemeriksaan${pekerja ? `&pekerja=${encodeURIComponent(pekerja)}` : ""}`)
}
