"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import project from "../../public/images/terma-project-diorama-blue.png"

const areas = [
  { name: "Area kerja", position: "work", title: "Kenali panas di setiap area.", description: "Tinjau bacaan panas per zona dan kualitas sumbernya sebelum menyusun rencana.", href: "/pengukuran", action: "Lihat pengukuran" },
  { name: "Koordinasi regu", position: "crew", title: "Satu rencana untuk satu regu.", description: "HSE meninjau rencana. Mandor menerima instruksi dan mencatat pelaksanaannya.", href: "/instruksi", action: "Lihat instruksi mandor" },
  { name: "Area istirahat", position: "rest", title: "Istirahat masuk dalam rencana.", description: "Telusuri jadwal kerja–istirahat tiap pekerja, lalu bandingkan dengan durasi aktual.", href: "/rencana", action: "Lihat rencana kerja" },
]

export function LandingSite() {
  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState(false)
  const area = areas[active]

  return <div className="landing-site" role="group" aria-label="Jelajahi ilustrasi proyek TERMA">
    <figure>
    <div className="landing-site-scene" data-image-failed={failed || undefined}>
      <Image src={project} alt="Miniatur proyek konstruksi dengan bangunan, regu pekerja, dan tempat istirahat beratap biru." priority sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) calc(100vw - 96px), (max-width: 1360px) 53vw, 712px" onError={() => setFailed(true)} />
      {failed && <p className="landing-site-fallback">Ilustrasi belum dapat dimuat. Anda tetap bisa menjelajahi ketiga area di bawah.</p>}
      <div className="landing-site-pins" hidden={failed}>
        {areas.map((item, index) => <button key={item.position} type="button" className={`site-pin site-pin-${item.position}`} aria-label={`Jelajahi ${item.name.toLowerCase()}`} aria-pressed={active === index} aria-controls="site-area-detail" onClick={() => setActive(index)}>{index + 1}</button>)}
      </div>
    </div>
    <figcaption className="landing-site-caption">Ilustrasi proyek · bukan peta atau data langsung</figcaption>
    </figure>
    <div className="landing-site-choices" role="group" aria-label="Pilih area untuk mengenal fitur">
      {areas.map((item, index) => <button key={item.position} type="button" aria-pressed={active === index} aria-controls="site-area-detail" onClick={() => setActive(index)} className="landing-site-choice">
        <span className="site-choice-number" aria-hidden>{active === index ? <Check size={14} /> : index + 1}</span>{item.name}
      </button>)}
    </div>
    <div id="site-area-detail" className="landing-site-detail" aria-live="polite" aria-atomic="true">
      <h2>{area.title}</h2>
      <p>{area.description}</p>
      <Link href={area.href}>{area.action}<ArrowRight size={16} aria-hidden /></Link>
    </div>
  </div>
}
