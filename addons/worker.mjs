// Canonical nominal base for JSMinSys workers.
//
// This class intentionally owns only worker identity. Scheduling, queueing,
// evaluation, synchronization, and domain policy stay in the existing numeric
// worker substrate or in specialized add-ons.
export class Worker {
  constructor(owner){
    this.owner=owner;
  }
}
