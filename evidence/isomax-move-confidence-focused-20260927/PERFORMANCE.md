# Generated performance medians

Reproduce with `node experiments/strategist/move-confidence-report.mjs`. Negative delta favors probing. TIMEOUT rows are censored, not completed-solve scores. Process cycles include startup; operation cycles cover the host solve invocation including workers and cleanup. All cycles sum all process threads.

| Workers | Case | Gap | Deep / probe ms | Operation cycles delta | Process cycles delta | Deep / probe nodes |
|---|---|---|---:|---:|---:|---:|
| 1 | p16-9 | tied | 73.30 / 73.70 | 1.3% | 1.4% | 7027 / 7145 |
| 1 | p28-11 | tied | 54.41 / 53.56 | -5.3% | -3.6% | 3766 / 2467 |
| 1 | p16-7 | near | 565.70 / TIMEOUT 30s | censored | censored | 305546 / 15921154 (partial) |
| 1 | p20-9 | near | 46.46 / 45.82 | -2.4% | -0.8% | 228 / 52 |
| 1 | p16-5 | clear | 837.28 / TIMEOUT 30s | censored | censored | 724018 / 18945374 (partial) |
| 1 | p24-1 | clear | 56.58 / 53.09 | -12.6% | -10.4% | 2773 / 1193 |
| 1 | diagnostic-0 | clear | 94.17 / 104.31 | 9.3% | 6.8% | 11406 / 15904 |
| 1 | diagnostic-1 | near | 134.06 / 59.06 | -55.1% | -42.3% | 40439 / 2544 |
| 7 | p16-9 | tied | 91.47 / 88.73 | -4.3% | -4.1% | 11163 / 8755 |
| 7 | p28-11 | tied | 84.58 / 81.89 | -0.9% | -0.1% | 12427 / 10024 |
| 7 | p16-7 | near | 305.50 / 308.45 | 1.4% | 1.2% | 495393 / 480465 |
| 7 | p20-9 | near | 65.15 / 62.64 | -4.1% | -3.9% | 493 / 137 |
| 7 | p16-5 | clear | 412.99 / 363.30 | -11.2% | -10.9% | 1247320 / 845653 |
| 7 | p24-1 | clear | 79.46 / 71.04 | -12.7% | -11.3% | 8692 / 2790 |
| 7 | diagnostic-0 | clear | 114.45 / 109.21 | -5.8% | -5.4% | 33199 / 25461 |
| 7 | diagnostic-1 | near | 141.19 / 87.06 | -45.6% | -43.2% | 122136 / 10087 |
