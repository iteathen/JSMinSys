# Winning-endpoint repair checkpoint

Tested 105cb25, 90/90 matched runs EXACT. Native1 mean 45461667 latency fell
1075.52 -> 199.80 ms; native4 fell 1100.39 -> 207.17 ms. Native1 nodes fell
806844 -> 71552. All three fixture families improved. Whole-process cycles
include additional publication work. Instrumented matched loader unchanged.

Four workers still do not consistently beat one. Current sharing saves work
on F versus four unshared workers, but insufficient to overcome parallel costs
on these short completed roots. 35333571 single-worker diagnostic reached a
clean 30-second timeout (raw hard-probe.json); no completed-solve inference.

Next isolated seam: the symmetric proven losing endpoint after examining all
relevant children is also exact (upper bound <= -1), but remains unpublished
unless the incoming window was full. Keep ordinary draw/interior bounds out.
