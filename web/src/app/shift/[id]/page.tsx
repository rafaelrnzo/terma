import { ShiftPageClient } from "@/components/shift-page-client"

export default async function ShiftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ShiftPageClient id={id} />
}
