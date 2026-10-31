import { ShiftPageClient } from "@/components/shift-page-client"
import { IotFigure } from "@/components/figures/terma/figure"

export default async function ShiftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ShiftPageClient id={id} deviceFigure={<IotFigure focused />} />
}
