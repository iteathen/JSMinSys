// Benchmark-only startup bridge. V8 consumes these process-wide flags before
// JS starts. Node rejects re-passing them as explicit Worker execArgv, although
// worker isolates retain their process-wide effect. Do not change flags at run
// time, change the production worker host, or warm up any solving position.
const processWideV8Flag=/^(?:--no-maglev|--trace-opt|--trace-deopt|--trace-turbo-inlining|--invocation-count-for-turbofan=\d+|--max-inlined-bytecode-size(?:-cumulative)?=\d+)$/;
for(let i=process.execArgv.length-1;i>=0;i--){
  if(processWideV8Flag.test(process.execArgv[i]))process.execArgv.splice(i,1);
}
