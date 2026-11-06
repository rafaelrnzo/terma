"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowClockwiseIcon, DropIcon, HeartbeatIcon, ShieldPlusIcon, ThermometerIcon, TimerIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { BODY_VIEWS } from "@/components/figures/worker-body/generated"
import { bodyMonitoring, type BodyRegion } from "@/lib/body-monitoring"
import { exampleBodyMonitoring } from "@/lib/body-monitoring-example"
import { useApp } from "@/lib/store"

const icons={heat:ThermometerIcon,hydration:DropIcon,band:HeartbeatIcon,kidneys:ShieldPlusIcon,exposure:TimerIcon}
const toneLabel={attention:"Perlu perhatian",recorded:"Data tercatat",unknown:"Belum diketahui"}

export default function WorkerBodyMonitor({code,date}:{code:string;date:string}) {
 const {state,user}=useApp()
 const [selected,setSelected]=useState<BodyRegion>("kidneys")
 const [view,setView]=useState<"front"|"back">("front")
 const [clock,setClock]=useState(()=>Date.now())
 const [source,setSource]=useState<"saved"|"example"|null>(null)
 const root=useRef<HTMLElement>(null)
 const list=useRef<HTMLDivElement>(null)
 const indicator=useRef<HTMLSpanElement>(null)
 const [visible,setVisible]=useState(true)
 const savedModel=user ? bodyMonitoring(state,user,code,date,clock) : null
 const showExample=source==="example" || (source===null && !!savedModel?.signals.every(signal=>signal.tone==="unknown"))
 const model=savedModel && user ? showExample ? exampleBodyMonitoring(code,date,user.role==="KLINIK") : savedModel : null
 const hasModel=!!model
 useEffect(()=>{const target=root.current;if(!target)return;let inView=true;const sync=()=>setVisible(inView && !document.hidden);const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;sync()});observer.observe(target);document.addEventListener("visibilitychange",sync);return()=>{observer.disconnect();document.removeEventListener("visibilitychange",sync)}},[hasModel])
 useEffect(()=>{if(!visible)return;const tick=()=>{if(!document.hidden)setClock(Date.now())};const timer=setInterval(tick,30000);document.addEventListener("visibilitychange",tick);return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",tick)}},[visible])
 useLayoutEffect(()=>{const element=list.current,thumb=indicator.current;if(!element || !thumb)return;const place=()=>{const button=element.querySelector<HTMLElement>('[aria-pressed="true"]');if(!button)return;thumb.style.transform=`translateY(${button.offsetTop}px)`;thumb.style.height=`${button.offsetHeight}px`};place();const observer=new ResizeObserver(place);observer.observe(element);return()=>observer.disconnect()},[selected,hasModel])
 if(!model)return null
 const active=model.signals.find(signal=>signal.key===selected)!
 const geometry=BODY_VIEWS[view]
 const attention=model.signals.filter(signal=>signal.tone==="attention").length
 return <section ref={root} className="body-monitor" aria-label="Peta sinyal tubuh pekerja" data-visible={visible}>
  <header className="body-monitor-heading"><div><p className="eyebrow">FIG. 02 · TERMA HUMAN MONITOR</p><h3>Peta sinyal tubuh</h3><p className="mt-1 text-xs text-muted-foreground">{showExample ? "Ilustrasi · cuplikan 13.40 WIB" : "Data tersimpan"}</p></div><div className="flex flex-wrap items-center gap-2"><span className="body-monitor-count">{model.signals.every(signal=>signal.tone==="unknown") ? "Data pemantauan belum tersedia" : `${attention} sinyal perlu perhatian`}</span><Button size="sm" variant="outline" onClick={()=>setSource(showExample ? "saved" : "example")}>{showExample ? "Lihat data tersimpan" : "Lihat contoh terisi"}</Button></div></header>
  <div className="body-monitor-grid">
   <div className="body-map-card iso" data-selected-region={selected}>
    <div className="body-map-toolbar"><span>{view==="front" ? "Potongan depan" : "Potongan belakang"}</span><Button size="sm" variant="ghost" onClick={()=>setView(previous=>previous==="front"?"back":"front")}><ArrowClockwiseIcon aria-hidden />Putar tubuh</Button></div>
    <svg viewBox="0 0 480 610" className="iso-svg body-svg" role="group" aria-label="Manekin anatomi isometrik dengan lima marker interaktif">
     <g dangerouslySetInnerHTML={{__html:geometry.art}} />
     {model.signals.map(signal=>{const [x,y]=geometry.anchors[signal.key];return <g key={signal.key} className="body-marker" data-tone={signal.tone} data-selected={selected===signal.key} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={`${signal.title}: ${signal.value}. ${toneLabel[signal.tone]}`} aria-pressed={selected===signal.key} onClick={()=>setSelected(signal.key)} onKeyDown={event=>{if(event.key==="Enter" || event.key===" "){event.preventDefault();setSelected(signal.key)}}}>
      <title>{signal.title} · {signal.value}</title><circle className="body-marker-hit" r="33" /><circle className="body-marker-halo" r="20" /><circle className="body-marker-ring" r="12" /><circle className="body-marker-dot" r="5" />
     </g>})}
    </svg>
    <div className="body-map-footer"><span>Pilih marker untuk melihat sumber</span><span>{geometry.parts} bagian</span></div>
   </div>
   <div className="body-signal-column"><div ref={list} className="body-signal-list" aria-label="Sinyal pemantauan"><span ref={indicator} className="body-signal-indicator" aria-hidden />{model.signals.map(signal=>{const Icon=icons[signal.key];return <button key={signal.key} type="button" className="body-signal-button" aria-pressed={selected===signal.key} data-active={selected===signal.key} data-tone={signal.tone} onClick={()=>setSelected(signal.key)}><span className="selectable-icon"><Icon className="icon-outline" size={18} aria-hidden /><Icon className="icon-fill" size={18} weight="fill" aria-hidden /></span><span><strong>{signal.title}</strong><small>{signal.value}</small></span><span className="body-signal-state">{toneLabel[signal.tone]}</span></button>})}</div>
    <section className="body-signal-detail" aria-live="polite" aria-atomic="true"><p className="eyebrow">{toneLabel[active.tone]}</p><h4>{active.title}</h4><p>{active.explanation}</p><dl><div><dt>Sumber</dt><dd>{active.source}</dd></div>{active.observedAt && <div><dt>{showExample ? "Waktu cuplikan" : "Waktu pengukuran"}</dt><dd>{new Date(active.observedAt).toLocaleString("id-ID")}</dd></div>}</dl><p className="body-signal-action">{active.action}</p></section>
   </div>
  </div>
  {model.clinicalNote && <p className="body-clinical-note"><strong>Privat Klinik · jawaban check-in:</strong> {model.clinicalNote}</p>}
  <footer className="body-monitor-caption">{showExample ? "Sumber: ilustrasi pemantauan. Tidak masuk rekap operasional." : "Marker menunjukkan konteks pemantauan, bukan organ yang telah didiagnosis sakit. Scan minum tidak mengukur kadar cairan; Band tidak memeriksa fungsi ginjal. Nilai yang belum tersedia tetap ditandai belum diketahui."}</footer>
 </section>
}
