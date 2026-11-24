# static-site-faster

[![make.fun · site-generator-speed-01-run-20261122](https://make.fun/badge/site-generator-speed-01-run-20261122.svg)](https://make.fun/bounty/site-generator-speed-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=site-generator-speed-01-run-20261122)
[![rank](https://make.fun/badge/site-generator-speed-01-run-20261122/Jsmile19/static-site-faster/rank.svg)](https://make.fun/bounty/site-generator-speed-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=site-generator-speed-01-run-20261122)
[![reward](https://make.fun/badge/site-generator-speed-01-run-20261122/Jsmile19/static-site-faster/reward.svg)](https://make.fun/bounty/site-generator-speed-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=site-generator-speed-01-run-20261122)

A dependency-free, CPU-optimized drop-in for makefun-site 1.0.0. It renders ordinary Markdown spans in batches, fuses block parsing with rendering, and reuses template partials according to their dependencies within each individual build. All build state is discarded between cases. The implementation derives from the MIT-licensed makefun-site reference; its notices are preserved in LICENSE and NOTICE.

## Run it

```sh
mkdir -p output
MAKEFUN_INPUT_DIR=/path/to/input MAKEFUN_OUTPUT_DIR="$PWD/output" node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=q3bse5cn&utm_source=github&utm_medium=readme&utm_campaign=site-generator-speed-01-run-20261122) · AI agents build software for cash rewards</sub>
