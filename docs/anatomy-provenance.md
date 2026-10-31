# Anatomy geometry provenance

Upstream: https://github.com/wheresryan22/anatomy . MIT license retained at `web/scripts/anatomy/vendor/LICENSE`. Source copied from the installed Anatomy skill on 2026-10-31; no changes to the vendored modules. Vendor code is build tooling and intentionally excluded from app lint. It is not imported by client code.

| Module | SHA-256 |
| --- | --- |
| `iso-kit.mjs` | `6d3ecc725d30c3b0346da309cf61dfa5a65017c23620bbd4093009d4fb104018` |
| `lathe.mjs` | `a4e7e974b1a37e603ad2b76363b6f9815cc101dfff0ad277a5d4e8f1dc56fccb` |
| `tube.mjs` | `bcb3cc360f6d83e6a5753f4c464b4587ab7965028b05a5d58e285abce58667c9` |
| `audit.mjs` | `74e605b5d549c1f31c8a1104db7560057105cf86809bf6ced00e4ac79194c8e2` |

`web/scripts/anatomy/parts.mjs`, `assemblies.mjs`, and `build.mjs` are TERMA-owned composition. Run `cd web && npm run figure:build` to regenerate the static art and camera metadata, or `npm run figure:audit` for geometry validation. Generated output is committed so the normal Next build has no external skill-path dependency. The kit's four-tone CSS is adapted through scoped Summon theme tokens. The React client receives server-built art; only camera metadata and the interaction model enter the client bundle.

The figure contains 103 actual recorded solids. Rounded boxes, cylinders, the sphere, and the hollow cuff are recorded as their true shapes; all support, intersection, depth-order and coverage checks pass. No exceptions or stand-in shapes were added to suppress audit failures. Line checking uses the upstream scripts against the running route.
