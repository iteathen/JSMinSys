# Private-cache curve extension

Owner requests sizes near15/100 MiB and explicitly forbids repeating baseline. Native power-of-two capacity at36bytes/entry selects nearest18MiB(524288) and72MiB(2097152); exact15/100 would require changing lookup mechanics. One new process each, not an AB comparison between candidate sizes. Reuse the four pinned36MiB placement samples as historical reference. Fixed6bbba7c source,10GiB shared,4workers(1wide+3deep),same pinned nightly,35333571,300000ms. No solver edits. Report descriptive historical-relative deltas only, no paired confidence interval. Source-clean and outcome/cleanup guards retained. Additional accepted capacity values in cold evidence harness only.

Owner next requests256MiB: nearest native capacity8388608entries=288MiB/worker. One candidate-only process; reuse historical36MiB and72MiB observations. Same source/runtime/pinning/sharedTT/fixture/300000ms ceiling. No solver changes.

Owner requests1GiB next: nearest supported33554432entries=1152MiB/worker. One candidate process,unchanged source/profile/timeout,no baseline rerun.
