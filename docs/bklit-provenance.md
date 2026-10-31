# Bklit chart source

Installed with shadcn from the official bklit/bklit-ui registry, main observed at b687f78aa506b674f50af1ec37282d930a3218ec on 2026-10-31. Components: line-chart, bar-chart and their registry dependencies.

Registry mirror used: https://raw.githubusercontent.com/bklit/bklit-ui/main/apps/web/public/r/{name}.json . The standard ui.bklit.com address redirects to bklit.com, which could not resolve from the local terminal during installation. The mirror is the same upstream published registry, not a reimplementation.

The source in web/src/components/charts and web/src/components/shimmering-text.tsx is vendored upstream code; retain its MIT attribution. Application compositions and tokens are owned separately. Existing Phosphor icon components use server-specific imports where necessary.

Upstream source: https://github.com/bklit/bklit-ui
Documentation: https://bklit.com/docs/components/line-chart and https://bklit.com/docs/components/bar-chart

MIT License

Copyright (c) 2026 uixmat

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
