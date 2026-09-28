# One-shot harder Player One win selection

Owner requires one test only,not a draw,harder than35333571 but hopefully under600s. Selected151231 from Connect4 docs/research/evidence/2026-09-12-pons-protocol/data/Test_L1_R3: exact reference row151231 1. Six moves/even parity means benchmark mover-positive score denotes first-player win. Late winning score and36remaining cells provide a plausible harder intermediate; no time/difficulty guarantee. No exploratory solve or baseline run used in selection. Rejected13333111 draw was never run.

Single fresh process,600000ms,locked10GiB shared/576MiB private/four pinned P-cores/nightly/source6bbba7c. ExpectedWDL+1 is a POST-run correctness assertion only; it is not an input to solver ordering/cache/evaluation. No expected best move is guessed. Selected profile and search code unchanged. Preserve timeout/failure without retry or another candidate.
