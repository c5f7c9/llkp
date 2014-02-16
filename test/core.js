var assert = require('assert');
var core = require('../core');

var txt = core.txt;
var rgx = core.rgx;
var opt = core.opt;
var exc = core.exc;
var any = core.any;
var seq = core.seq;
var rep = core.rep;

suite('Core', function () {
    'use strict';

    suite('txt', function () {
        test('1.1', function () {
            var p = txt('');
            var r = p.exec('');

            assert.equal(r[0], '');
            assert.equal(r.end, 0);
        });

        test('1.2', function () {
            var p = txt('');
            var r = p.exec('abc');

            assert.equal(r[0], '');
            assert.equal(r.end, 0);
        });

        test('2.1', function () {
            var p = txt('abc');
            var r = p.exec('abc');

            assert.equal(r[0], 'abc');
            assert.equal(r.end, 3);
        });

        test('2.2', function () {
            var p = txt('abc');
            var r = p.exec('abcdef');

            assert.equal(r[0], 'abc');
            assert.equal(r.end, 3);
        });

        test('2.3', function () {
            var p = txt('abc');
            var r = p.exec('abC');

            assert(!r);;
        });

        test('toString.1', function () {
            assert.equal(txt('') + '', '""');
        });

        test('toString.2', function () {
            assert.equal(txt('abc') + '', '"abc"');
        });

        test('toString.3', function () {
            assert.equal(txt('"123"') + '', '"\\"123\\""');
        });
    });

    suite('rgx', function () {
        test('1.1', function () {
            var p = rgx(/abc/);
            var r = p.exec('abc');

            assert.equal(r[0], 'abc');
            assert.equal(r.end, 3);
        });

        test('1.2', function () {
            var p = rgx(/abc/);
            var r = p.exec('abcdef');

            assert.equal(r[0], 'abc');
            assert.equal(r.end, 3);
        });

        test('2.1', function () {
            var p = rgx(/abc/);
            var r = p.exec('abC');

            assert(!r);;
        });

        test('2.2', function () {
            var p = rgx(/abc/);
            var r = p.exec('123abc');

            assert(!r);;
        });

        test('1.4', function () {
            var p = rgx(/[\x00-\xff]+/m);
            var r = p.exec('abc\r\ndef');

            assert.equal(r[0], 'abc\r\ndef');
            assert.equal(r.end, 8);
        });

        test('toString', function () {
            assert.equal(rgx(/abc/) + '', '/abc/');
        });
    });

    suite('opt', function () {
        test('1.1', function () {
            var p = opt(txt('abc'));
            var r = p.exec('abc');

            assert.equal(r[0], 'abc');
            assert.equal(r.end, 3);
        });

        test('1.2', function () {
            var p = opt(txt('abc'));
            var r = p.exec('abcdef');

            assert.equal(r[0], 'abc');
            assert.equal(r.end, 3);
        });

        test('1.3', function () {
            var p = opt(txt(''));
            var r = p.exec('');

            assert.equal(r[0], '');
            assert.equal(r.end, 0);
        });

        test('1.4', function () {
            var p = opt(txt(''));
            var r = p.exec('abc');

            assert.equal(r[0], '');
            assert.equal(r.end, 0);
        });

        test('2.1', function () {
            var p = opt(txt('abc'));
            var r = p.exec('def');

            assert.equal(r[0], void 0);
            assert.equal(r.end, 0);
        });

        test('2.2', function () {
            var p = opt(txt('abc'));
            var r = p.exec('');

            assert.equal(r[0], void 0);
            assert.equal(r.end, 0);
        });

        test('2.3', function () {
            var p = opt(txt('abc'), 456);
            var r = p.exec('def');

            assert.equal(r[0], 456);
            assert.equal(r.end, 0);
        });

        test('3.1', function () {
            var p = opt(opt(txt('abc')));
            var r = p.exec('abc');

            assert.equal(r[0], 'abc');
            assert.equal(r.end, 3);
        });

        test('toString', function () {
            assert.equal(opt(txt('abc')), '"abc"?');
        });
    });

    suite('exc', function () {
        test('1.1', function () {
            var p = exc(txt('abc'), txt('abcdef'));
            var r = p.exec('abcd');

            assert.equal(r[0], 'abc');
            assert.equal(r.end, 3);
        });

        suite('1.2', function () {
            var p = exc(rgx(/\w{3}/), rgx(/\d{3}/));

            test('a', function () {
                assert.equal(p.exec('abc')[0], 'abc');
            });

            test('b', function () {
                assert.equal(p.exec('a23')[0], 'a23');
            });

            test('c', function () {
                assert(!p.exec('123'));
            });
        });

        test('2.1', function () {
            var p = exc(txt('abc'), txt('abcdef'));
            var r = p.exec('abcdefg');

            assert(!r);
        });

        test('2.2', function () {
            var p = exc(txt('abc'), txt('abcdef'));
            var r = p.exec('12345');

            assert(!r);
        });

        test('2.3', function () {
            var x = txt('abc');
            var p = exc(x, x);
            var r = p.exec('abc');

            assert(!r);
        });

        test('toString', function () {
            var p = exc(rgx(/\w+/), txt('123'));
            assert.equal(p + '', '/\\w+/ ~ "123"');
        });
    });

    suite('any', function () {
        suite('1', function () {
            var p = any(txt('a'), txt('bb'), txt('ccc'));

            test('1', function () {
                var r = p.exec('a');

                assert.equal(r[0], 'a');
                assert.equal(r.end, 1);
            });

            test('2', function () {
                var r = p.exec('bb');

                assert.equal(r[0], 'bb');
                assert.equal(r.end, 2);
            });

            test('3', function () {
                var r = p.exec('ccc');

                assert.equal(r[0], 'ccc');
                assert.equal(r.end, 3);
            });
        });

        test('2', function () {
            var p = any(txt('a'), txt('bb'), txt('ccc'));
            var r = p.exec('dddd');

            assert(!r);
        });

        test('toString', function () {
            var p = any(txt('abc'), txt('123'), opt(rgx(/x/)));
            assert.equal(p + '', '("abc" | "123" | /x/?)');
        });
    });

    suite('seq', function () {
        test('1.1', function () {
            var p = seq(rgx(/a+/), rgx(/b+/), rgx(/c+/));
            var r = p.exec('abbccc');

            assert.deepEqual(r[0], ['a', 'bb', 'ccc']);
            assert.equal(r.end, 6);
        });

        test('1.2', function () {
            var p = seq(rgx(/a+/), rgx(/b*/), opt(rgx(/c+/)), rgx(/d+/));
            var r = p.exec('adddd');

            assert.deepEqual(r[0], ['a', '', void 0, 'dddd']);
            assert.equal(r.end, 5);
        });

        test('1.3', function () {
            var d = txt('1');
            var p = seq(seq(seq(d), seq(d)), seq(seq(d), seq(d)));
            var r = p.exec('11112222');

            assert.deepEqual(r[0], [[['1'], ['1']], [['1'], ['1']]]);
            assert.equal(r.end, 4);
        });

        test('2', function () {
            var p = seq(rgx(/a+/), rgx(/b+/), rgx(/c+/));
            var r = p.exec('abbdddd');

            assert(!r);
        });

        test('toString', function () {
            var p = seq(txt('abc'), txt('123'), opt(rgx(/x/)));
            assert.equal(p + '', '("abc" "123" /x/?)');
        });
    });

    suite('rep', function () {
        suite('regular', function () {
            test('accepts', function () {
                var p = rep(txt('abc'));
                var r = p.exec('abcabcabc');

                assert.deepEqual(r[0], ['abc', 'abc', 'abc']);
                assert(r.end, 9);
            });

            test('accepts', function () {
                var p = rep(rep(txt('abc')));
                var r = p.exec('abcabcabc');

                assert.deepEqual(r[0], [['abc', 'abc', 'abc']]);
                assert(r.end, 9);
            });

            test('accepts', function () {
                var p = rep(txt('abc'));
                var r = p.exec('abcabcabd');

                assert.deepEqual(r[0], ['abc', 'abc']);
                assert(r.end, 6);
            });

            test('accepts', function () {
                var p = rep(opt(txt('abc')));
                var r = p.exec('abcabcabd');

                assert.deepEqual(r[0], ['abc', 'abc']);
                assert(r.end, 6);
            });

            test('rejects', function () {
                var p = rep(txt('abc'));
                var r = p.exec('def');

                assert(!r);
            });

            test('rejects', function () {
                var p = rep(txt(''));
                var r = p.exec('abc');

                assert(!r);
            });

            test('toString', function () {
                var p = rep(txt('123'));
                assert.equal(p + '', '"123"*');
            });
        });

        suite('separated', function () {
            test('accepts', function () {
                var p = rep(txt('abc'), txt(','));
                var r = p.exec('abc,abc,abc');

                assert.deepEqual(r[0], ['abc', 'abc', 'abc']);
                assert(r.end, 11);
            });

            test('accepts', function () {
                var p = rep(rep(txt('abc'), txt(',')), txt(','));
                var r = p.exec('abc,abc,abc');

                assert.deepEqual(r[0], [['abc', 'abc', 'abc']]);
                assert(r.end, 11);
            });

            test('accepts', function () {
                var p = rep(txt('abc'), txt(','));
                var r = p.exec('abc,abc,abd');

                assert.deepEqual(r[0], ['abc', 'abc']);
                assert(r.end, 7);
            });

            test('accepts', function () {
                var p = rep(rep(rgx(/\w+/), txt('=')), txt('&'));
                var r = p.exec('abc=123&def=456;qqq');

                assert.deepEqual(r[0], [['abc', '123'], ['def', '456']]);
                assert(r.end, 15);
            });

            test('accepts', function () {
                var p = rep(opt(txt('abc')), txt(','));
                var r = p.exec('abc,abc,abd');

                assert.deepEqual(r[0], ['abc', 'abc', void 0]);
                assert(r.end, 7);
            });

            test('rejects', function () {
                var p = rep(txt('abc'), txt(','));
                var r = p.exec('def');

                assert(!r);
            });

            test('rejects', function () {
                var p = rep(txt(''), txt(','));
                var r = p.exec('abc');

                assert(!r);
            });

            test('toString', function () {
                var p = rep(rgx(/\d+/), txt(','));
                assert.equal(p + '', '/\\d+/*:","');
            });
        });
    });

    suite('Pattern', function () {
        suite('then', function () {
            test('simple', function () {
                var p = rgx(/\d+/).then(function (s) { return 1 / +s });
                var r = p.exec('10;def');

                assert.equal(r[0], 0.1);
                assert.equal(r.end, 2);
            });

            test('chain', function () {
                var p = rgx(/\d+/)
                    .then(function (s) { return +s })
                    .then(function (n) { return 1 / n });

                var r = p.exec('10;def');

                assert.equal(r[0], 0.1);
                assert.equal(r.end, 2);
            });

            test('text', function () {
                var n = rgx(/\d+/).then(function (s, t) { return t + '=>' + s });
                var p = rep(n, txt(','));
                var r = p.exec('123,456,789');

                assert.deepEqual(r[0], ['123,456,789=>123', '456,789=>456', '789=>789']);
                assert.equal(r.end, 11);
            });

            test('throws', function () {
                var err;

                try {
                    rgx(/\d+/).then(function (s) { throw 'abc' }).exec('123');
                } catch (e) {
                    err = e;
                }

                assert.equal(err, 'abc');
            });
        });

        suite('select', function () {
            test('1', function () {
                var p = rep(rgx(/\w+/), txt(';')).select(2);
                var r = p.exec('abc;def;ghi');

                assert.equal(r[0], 'ghi');
                assert.equal(r.end, 11);
            });

            test('2', function () {
                var p = rep(rgx(/\w+/), txt(';')).select(8);
                var r = p.exec('abc;def;ghi');

                assert.equal(r[0], void 0);
                assert.equal(r.end, 11);
            });

            test('3', function () {
                var p = rep(rgx(/\w+/), txt(';')).select('qwerty');
                var r = p.exec('abc;def;ghi');

                assert.equal(r[0], void 0);
                assert.equal(r.end, 11);
            });
        });
    });
});
