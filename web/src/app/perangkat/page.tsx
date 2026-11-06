import { DeviceWorkflowContext } from "@/components/device-workflow-context"
import { IotFigure } from "@/components/figures/terma/figure"
import { PageHeader } from "@/components/app-shell"

export default function DevicesPage() {
  return <>
    <PageHeader title="Ekosistem perangkat IoT" summary="Tiga perangkat, satu gambaran lapangan. Menghubungkan panas lingkungan, kebiasaan minum, dan respons tubuh dengan rencana personal." />
    <DeviceWorkflowContext />
    <IotFigure />
  </>
}
