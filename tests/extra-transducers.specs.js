import { Observable } from 'rxjs';
import { into, push, startWith, transduceLazyObservable } from "../transducers"

QUnit.module("Testing startWith", {});

QUnit.test("works with iterables", function exec_test(assert) {
  assert.deepEqual(into([], startWith(0), [1, 2, 3, 4, 5]), [0, 1, 2, 3, 4, 5], `works with iterables`)
});

QUnit.test("works with observables", function exec_test(assert) {
  const done = assert.async(1);
  const source = new Observable(o => {
    [1, 2, 3, 4, 5].forEach(x => o.next(x));
    o.complete();
  });
  const transducedObs = transduceLazyObservable(source, startWith(0), Observable);
  let obsValues = [];
  transducedObs.subscribe(
    x => push(obsValues, x),
    err => {
      assert.ok(false, err)
      done(err)
    },
    () => {
      debugger
      assert.deepEqual(obsValues, [0, 1, 2, 3, 4, 5], `works with observables`);
      done()
    })
});
