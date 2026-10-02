// Canonical nominal base for JSMinSys workers.
//
// Construction is cold/control-plane work. Instantiate Worker subclasses before
// entering any hot loop, preferably during application initialization. Worker
// polymorphism should select the implementation outside the hot path; a concrete
// run() should then enter its specialized numeric loop without recurring class
// dispatch where practical.
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
