import { homedir } from "node:os"
import { join } from "node:path"

/**
 * Where the shared workspace and password hashes live. Mount a volume here in production.
 * The local default sits outside the project: inside it, Next's file watcher would reload every
 * screen whenever the workspace is saved.
 */
export const dataDir = () => process.env.TERMA_DATA_DIR ?? join(homedir(), ".terma")
