import { redirect } from "next/navigation"
export default async function InsightPage({ searchParams }: { searchParams: Promise<{ pekerja?: string }> }) {
  const { pekerja } = await searchParams
  redirect(pekerja ? `/pekerja/${encodeURIComponent(pekerja)}?tab=analisis` : "/monitoring?tab=analitik")
}
