import { IotFigure } from "@/components/figures/terma/figure"
import { PageHeader } from "@/components/app-shell"
import { LiveDevices } from "@/components/live-devices"

export default function DevicesPage() {
  return <>
    <PageHeader title="Ekosistem perangkat IoT" summary="Station · Water Station · Band." />
    <LiveDevices />
    <IotFigure />
  </>
}
