// COLD ONLY: checked before allocating native cache views. No search dependency.
// Slot masks use a nonnegative signed-u32 index; view lengths use native u32.
export function validateConnect4CacheCapacity32(capacity,elementsPerEntry){
  if(!Number.isSafeInteger(capacity)||capacity<1||capacity>0x80000000||
     !Number.isInteger(Math.log2(capacity))||
     !Number.isSafeInteger(elementsPerEntry)||elementsPerEntry<1||
     capacity*elementsPerEntry>0xffffffff)
    throw new RangeError('invalid Connect4 cache capacity or native view length');
  return capacity;
}
