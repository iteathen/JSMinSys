// Canonical nominal base for JSMinSys workers.
//
// The base owns identity plus the required execution surface. Scheduling,
// queueing, synchronization, and domain policy stay in specialized workers or
// the existing numeric worker substrate.
export class Worker {
  constructor(owner){
    this.owner=owner;
  }

  run(){
    throw new TypeError('Worker.run must be implemented');
  }
}
