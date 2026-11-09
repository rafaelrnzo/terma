// Run with: ./node_modules/.bin/vite-node scripts/seed-raya-demo.ts <output.json> <yyyy-mm-dd>
import { writeFileSync } from "node:fs"
import { rayaDemoWorkspace } from "../src/lib/raya-demo"

const [output, date] = process.argv.slice(2)
if (!output || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) throw new Error("Pakai: seed-raya-demo.ts <output.json> <yyyy-mm-dd>")
writeFileSync(output, JSON.stringify(rayaDemoWorkspace(date)))
console.log(`Seed Raya tersimpan untuk ${date}`)
