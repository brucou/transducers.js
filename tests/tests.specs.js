var Immutable = require('immutable');
import {
  cat, compose, dedupe, drop, dropWhile, filter, interpose, into, keep, map, mapcat, merge, partition,
  partitionBy, push, remove, repeat, seq, take, takeNth, takeWhile, toArray, toObj, transduce,
  transformer
} from '../transducers';

const context = { num: 5 };

// utility

function first(x) {
  return x[0];
}

function second(x) {
  return x[1];
}

function add(x, y) {
  return x + y;
}

Immutable.List.prototype['@@transducer/init'] = function () {
  return Immutable.List().asMutable();
};

Immutable.List.prototype['@@transducer/result'] = function (lst) {
  return lst.asImmutable();
};

Immutable.List.prototype['@@transducer/step'] = function (lst, x) {
  return lst.push(x);
};

function eq(x, y, assert) {
  assert.equal(x, y, `Ok`);
}

function eql(x, y, assert) {
  assert.deepEqual(x, y, `Ok`);
}

function immutEql(src, dest, assert) {
  assert.deepEqual(src.toJS(), dest.toJS(), `Ok`);
}

QUnit.module("Testing core transducers", {});

QUnit.test("push/merge should work", function exec_test(assert) {
  eql(push([1, 2, 3], 4), [1, 2, 3, 4], assert);
  eql(merge({ x: 1, y: 2 }, { z: 3 }),
    { x: 1, y: 2, z: 3 }, assert);
  eql(merge({ x: 1, y: 2 }, ['z', 3]),
    { x: 1, y: 2, z: 3 }, assert);
});

QUnit.test("transformer protocol should work", function exec_test(assert) {
  const vec = Immutable.List.of(1, 2, 3);

  immutEql(vec['@@transducer/init'](), Immutable.List(), assert);

  immutEql(vec['@@transducer/step'](vec, 4),
    Immutable.List.of(1, 2, 3, 4), assert);
});

QUnit.test("map should work", function exec_test(assert) {
  eql(map([1, 2, 3, 4], x => x + 1),
    [2, 3, 4, 5], assert);
  eql(map({ x: 1, y: 2 }, x => [x[0], x[1] + 1]),
    { x: 2, y: 3 }, assert);
  eql(map([1, 2, 3, 4], (x, i) => i),
    [0, 1, 2, 3], assert);
  eql(map([1, 2, 3, 4], function (x) { return x + this.num }, context),
    [6, 7, 8, 9], assert);
  eql(seq([1, 2, 3, 4],
    map(function (x) { return x + this.num }, context)),
    [6, 7, 8, 9], assert);

  immutEql(map(Immutable.List.of(1, 2, 3, 4), x => x + 1),
    Immutable.List.of(2, 3, 4, 5), assert);

  eql(transduce([1, 2, 3],
    map(x => x * 2),
    transformer(add),
    0),
    12, assert);
});

QUnit.test("filter should work", function exec_test(assert) {
  eql(filter([1, 2, 3, 4], x => x % 2 === 0),
    [2, 4], assert);
  eql(filter({ x: 1, y: 2 }, x => x[1] % 2 === 0),
    { y: 2 }, assert);
  eql(filter([1, 2, 3, 4], (x, i) => i !== 0),
    [2, 3, 4], assert);
  eql(filter([4, 5, 6], function (x) { return x >= this.num }, context),
    [5, 6], assert);

  immutEql(filter(Immutable.List.of(1, 2, 3, 4), x => x % 2 === 0),
    Immutable.List.of(2, 4), assert);

  eql(transduce([1, 2, 3],
    filter(x => x % 2 === 0),
    transformer(add),
    0),
    2, assert);

});

QUnit.test("remove should work", function exec_test(assert) {
  eql(remove([1, 2, 3, 4], x => x % 2 === 0),
    [1, 3], assert);
  eql(remove({ x: 1, y: 2 }, x => x[1] % 2 === 0),
    { x: 1 }, assert);
  eql(remove([4, 5, 6], function (x) { return x < this.num }, context),
    [5, 6], assert);

  immutEql(remove(Immutable.List.of(1, 2, 3, 4), x => x % 2 === 0),
    Immutable.List.of(1, 3), assert);

  eql(transduce([1, 2, 3],
    remove(x => x % 2 === 0),
    transformer(add),
    0),
    4, assert);
});

QUnit.test("dedupe should work", function exec_test(assert) {
  eql(into([], dedupe(), [1, 2, 2, 3, 3, 3, 5]),
    [1, 2, 3, 5], assert)
});

QUnit.test("keep should work", function exec_test(assert) {
  eql(into([], keep(), [1, 2, undefined, null, false, 5]),
    [1, 2, false, 5], assert)
});

QUnit.test("take should work", function exec_test(assert) {
  eql(take([1, 2, 3, 4], 2), [1, 2], assert)
  eql(take([1, 2, 3, 4], 10), [1, 2, 3, 4], assert)

  immutEql(take(Immutable.List.of(1, 2, 3, 4), 2),
    Immutable.List.of(1, 2), assert)

  eql(into([], take(2), [1, 2, 3, 4]),
    [1, 2], assert);
});

QUnit.test("takeWhile should work", function exec_test(assert) {
  function lt(n) {
    return function (x) {
      return x < n;
    }
  }

  eql(takeWhile([1, 2, 3, 2], lt(3)), [1, 2], assert);
  eql(takeWhile([1, 2, 3, 4], lt(10)), [1, 2, 3, 4], assert)
  eql(takeWhile([4, 5, 6], function (x) { return x < this.num }, context),
    [4], assert);

  immutEql(takeWhile(Immutable.List.of(1, 2, 3, 2), lt(3)),
    Immutable.List.of(1, 2), assert)

  eql(into([], takeWhile(lt(3)), [1, 2, 3, 2]),
    [1, 2], assert);
});

QUnit.test("drop should work", function exec_test(assert) {
  eql(drop([1, 2, 3, 4], 2), [3, 4], assert)
  eql(drop([1, 2, 3, 4], 10), [], assert)

  immutEql(drop(Immutable.List.of(1, 2, 3, 4), 2),
    Immutable.List.of(3, 4), assert)

  eql(into([], drop(2), [1, 2, 3, 4]),
    [3, 4], assert);
});

QUnit.test("dropWhile should work", function exec_test(assert) {
  function lt(n) {
    return function (x) {
      return x < n;
    }
  }

  eql(dropWhile([1, 2, 3, 2], lt(3)), [3, 2], assert);
  eql(dropWhile([1, 2, 3, 4], lt(10)), [], assert);
  eql(dropWhile([4, 5, 6], function (x) { return x < this.num }, context),
    [5, 6], assert);

  immutEql(dropWhile(Immutable.List.of(1, 2, 3, 2), lt(3)),
    Immutable.List.of(3, 2), assert);

  eql(into([], dropWhile(lt(3)), [1, 2, 3, 2]),
    [3, 2], assert);
});
QUnit.test("partition should work", function exec_test(assert) {
  eql(partition([1, 2, 3, 4], 2), [[1, 2], [3, 4]], assert);
  eql(partition([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]], assert);

  immutEql(partition(Immutable.List.of(1, 2, 3, 4), 2),
    Immutable.List.of(
      Immutable.List.of(1, 2),
      Immutable.List.of(3, 4)
    ), assert);
  immutEql(partition(Immutable.List.of(1, 2, 3, 4, 5), 2),
    Immutable.List.of(
      Immutable.List.of(1, 2),
      Immutable.List.of(3, 4),
      Immutable.List.of(5)
    ), assert);

  eql(into([], partition(2), [1, 2, 3, 4]), [[1, 2], [3, 4]], assert);
  eql(into([], partition(2), [1, 2, 3, 4, 5]), [[1, 2], [3, 4], [5]], assert);

  // These 2 are tests for "ensure_unreduced" case
  eql(into([], compose(partition(2), take(2)),
    [1, 2, 3, 4, 5]),
    [[1, 2], [3, 4]], assert);
  eql(into([], compose(partition(2), take(3)),
    [1, 2, 3, 4, 5]),
    [[1, 2], [3, 4], [5]], assert);

});

QUnit.test("partitionBy should work", function exec_test(assert) {
  var type = (x) => typeof x;

  eql(partitionBy(["a", "b", 1, 2, "c", true, false, undefined], type),
    [["a", "b"], [1, 2], ["c"], [true, false], [undefined]], assert);
  immutEql(partitionBy(Immutable.List.of("a", "b", 1, 2, "c", true, false, undefined), type),
    Immutable.List.of(["a", "b"], [1, 2], ["c"], [true, false], [undefined]), assert);

  // These 2 are tests for "ensure_unreduced" case
  eql(into([], compose(partitionBy(type), take(4)),
    ["a", "b", 1, 2, "c", true, false, undefined]),
    [["a", "b"], [1, 2], ["c"], [true, false]], assert);
  eql(into([], compose(partitionBy(type), take(5)),
    ["a", "b", 1, 2, "c", true, false, undefined]),
    [["a", "b"], [1, 2], ["c"], [true, false], [undefined]], assert);

});
QUnit.test("interpose should work", function exec_test(assert) {
  eql(interpose([1, 2, 3], null), [1, null, 2, null, 3], assert);
  immutEql(interpose(Immutable.List.of(1, 2, 3), undefined),
    Immutable.List.of(1, undefined, 2, undefined, 3), assert);

  eql(interpose([], null), [], assert);
  immutEql(interpose(Immutable.List(), null), Immutable.List(), assert);

  // Test early-termination handling
  eql(into([], compose(interpose(null), take(4)),
    [1, 2, 3]),
    [1, null, 2, null], assert);
  eql(into([], compose(interpose(null), take(3)),
    [1, 2, 3]),
    [1, null, 2], assert);

});
QUnit.test("repeat should work", function exec_test(assert) {
  eql(repeat([1, 2, 3], 2), [1, 1, 2, 2, 3, 3], assert);
  immutEql(repeat(Immutable.List.of(1, 2), 3),
    Immutable.List.of(1, 1, 1, 2, 2, 2), assert);

  eql(repeat([], 2), [], assert);
  immutEql(repeat(Immutable.List(), 3), Immutable.List(), assert);

  eql(repeat([1, 2, 3], 0), [], assert);
  eql(repeat([1, 2, 3], 1), [1, 2, 3], assert);

  // Test early-termination handling
  eql(into([], compose(repeat(2), take(3)),
    [1, 2, 3]),
    [1, 1, 2], assert);
  eql(into([], compose(repeat(3), take(2)),
    [1, 2, 3]),
    [1, 1], assert);

});

QUnit.test("takeNth should work", function exec_test(assert) {
  eql(takeNth([1, 2, 3, 4], 2), [1, 3], assert);
  immutEql(takeNth(Immutable.List.of(1, 2, 3, 4, 5), 2),
    Immutable.List.of(1, 3, 5), assert);

  eql(takeNth([], 2), [], assert);
  immutEql(takeNth(Immutable.List(), 3), Immutable.List(), assert);

  eql(takeNth([1, 2, 3], 1), [1, 2, 3], assert);

});

QUnit.test("cat should work", function exec_test(assert) {
  eql(into([], cat, [[1, 2], [3, 4]]), [1, 2, 3, 4], assert);

  immutEql(into(Immutable.List(),
    cat,
    Immutable.fromJS([[1, 2], [3, 4]])),
    Immutable.List.of(1, 2, 3, 4), assert);
});

QUnit.test("mapcat should work", function exec_test(assert) {
  eql(into([],
    mapcat(arr => {
      return map(arr, x => x + 1);
    }),
    [[1, 2], [3, 4]]),
    [2, 3, 4, 5], assert);

  eql(into([],
    mapcat(function (arr) {
      return map(arr, x => x + this.num);
    }, context),
    [[1, 2], [3, 4]]),
    [6, 7, 8, 9], assert);

});
QUnit.test("into should work", function exec_test(assert) {
  eql(into([], map(x => x + 1), [1, 2, 3, 4]),
    [2, 3, 4, 5], assert);
  eql(into([], map(x => x[1] + 1), { x: 10, y: 20 }),
    [11, 21], assert);
  eql(into({}, map(x => [x[0], x[1] + 1]), { x: 10, y: 20 }),
    { x: 11, y: 21 }, assert);
  eql(into({}, map(x => ['foo' + x, x * 2]), [1, 2]),
    { foo1: 2, foo2: 4 }, assert);

  eql(into([1, 2, 3], map(x => x + 1), [7, 8, 9]),
    [1, 2, 3, 8, 9, 10], assert);

  immutEql(into(Immutable.List(), map(x => x + 1), [1, 2, 3]),
    Immutable.List.of(2, 3, 4), assert);

});
QUnit.test("seq should work", function exec_test(assert) {
  eql(seq([1, 2, 3, 4], map(x => x + 1)),
    [2, 3, 4, 5], assert);
  eql(seq({ x: 10, y: 20 }, map(x => [x[0], x[1] + 1])),
    { x: 11, y: 21 }, assert);

  immutEql(seq(Immutable.List.of(1, 2, 3), map(x => x + 1)),
    Immutable.List.of(2, 3, 4), assert);

});
QUnit.test("transduce and compose should work", function exec_test(assert) {
  eql(transduce([1, 2, 3, 4],
    compose(
      map(x => x + 1),
      filter(x => x % 2 === 0)
    ),
    transformer(push),
    []),
    [2, 4], assert)

  eql(transduce({ x: 1, y: 2 },
    compose(
      map(second),
      map(x => x + 1)
    ),
    transformer(push),
    []),
    [2, 3], assert)

  eql(transduce({ x: 1, y: 2 },
    compose(
      map(second),
      map(x => x + 1),
      map(x => ['foo' + x, x])
    ),
    transformer(merge),
    {}),
    { foo2: 2, foo3: 3 }, assert)

  immutEql(transduce(Immutable.List.of(1, 2, 3, 4),
    compose(
      map(x => x + 1),
      filter(x => x % 2 === 0)
    ),
    Immutable.List.prototype,
    Immutable.List()),
    Immutable.List.of(2, 4), assert);

  eql(into([], compose(map(x => [x, x * 2]),
    cat,
    filter(x => x > 2)),
    [1, 2, 3, 4]),
    [4, 3, 6, 4, 8], assert);

});
QUnit.test("array should work", function exec_test(assert) {
  var nums = {
    i: 0,
    next: function () {
      return {
        value: this.i++,
        done: false
      };
    },
  };

  eql(toArray([1, 2, 3]), [1, 2, 3], assert);
  eql(toArray([1, 2, 3, 4], take(3)),
    [1, 2, 3], assert);
  eql(toArray(nums, take(6)),
    [0, 1, 2, 3, 4, 5], assert);

});
QUnit.test("obj should work", function exec_test(assert) {
  eql(toObj([['foo', 1], ['bar', 2]]),
    { foo: 1, bar: 2 }, assert);
  eql(toObj({ foo: 1, bar: 2 }, map(kv => [kv[0], kv[1] + 1])),
    { foo: 2, bar: 3 }, assert);

});

// NOTE : too lazy to pass expect to QUnit
// QUnit.test("iter should work", function exec_test(assert) {
//     var nums = {
//       i: 0,
//       next: function() {
//         return {
//           value: this.i++,
//           done: false
//         };
//       },
//     };
//
//     var lt = toIter(nums, map(x => x * 2));
//     expect(lt instanceof t.LazyTransformer).to.be.ok();
//     expect(toArray(lt, take(5)),
//            [0, 2, 4, 6, 8]);
//   });
//
// });

