// Sets a TERMA user's password: npm run set-password -- <username>
// The hash format matches src/lib/server/auth.ts (scrypt$salt$hash); auth.test.ts verifies that.
import { randomBytes, scryptSync } from "node:crypto"
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import { createInterface } from "node:readline"

const USERNAMES = ["ratna", "budi", "sari", "tono", "dewi"]
const username = process.argv[2]
if (!USERNAMES.includes(username)) {
  console.error(`Pakai: npm run set-password -- <${USERNAMES.join("|")}>`)
  process.exit(1)
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  rl._writeToOutput = text => { if (text.startsWith(question)) process.stdout.write(text) } // hide typed characters
  return new Promise(resolve => rl.question(question, answer => { rl.close(); process.stdout.write("\n"); resolve(answer) }))
}

const password = await ask(`Kata sandi baru untuk ${username}: `)
if (password.length < 8) { console.error("Kata sandi minimal 8 karakter."); process.exit(1) }
if (await ask("Ulangi kata sandi: ") !== password) { console.error("Kata sandi tidak sama."); process.exit(1) }

const dir = process.env.TERMA_DATA_DIR ?? join(homedir(), ".terma")
const file = join(dir, "users.json")
let users = {}
try { users = JSON.parse(readFileSync(file, "utf8")) } catch { /* first user */ }
const salt = randomBytes(16).toString("hex")
users[username] = `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`
mkdirSync(dir, { recursive: true })
writeFileSync(`${file}.tmp`, JSON.stringify(users, null, 2), { mode: 0o600 })
renameSync(`${file}.tmp`, file)
console.log(`Kata sandi ${username} tersimpan di ${file}`)
