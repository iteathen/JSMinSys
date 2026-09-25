// Canonical nominal base for JSMinSys branch managers.
//
// Construction is cold/control-plane work. Instantiate BranchManager subclasses
// before entering any hot loop, preferably during application initialization.
// Manager polymorphism should select the implementation outside the hot path; a
// concrete run() should then enter its specialized numeric loop without
// recurring class dispatch where practical.
//
// Branch managers are a role distinct from Worker. They coordinate/reconcile
// shared work; they do not inherit worker execution semantics.
export class BranchManager {
  constructor(owner){
    this.owner=owner;
  }

  run(){
    throw new TypeError('BranchManager.run must be implemented');
  }
}
