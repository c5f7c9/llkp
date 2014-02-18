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
        suite('empty', function () {
            test(1, function () {
                var p = txt('');
                var r = p.exec('');

                assert.equal(r, '');
            });

            test(2, function () {
                var p = txt('');
                var r = p.exec('abc');

                assert.equal(r, null);
            });
        });

        suite('regular', function () {
            test(1, function () {
                var p = txt('abc');
                var r = p.exec('abc');

                assert.equal(r, 'abc');
            });

            test(2, function () {
                var p = txt('abc');
                var r = p.exec('abcdef');

                assert.equal(r, null);
            });

            test(3, function () {
                var p = txt('abc');
                var r = p.exec('abC');

                assert.equal(r, null);
            });

            test(4, function () {
                var p = txt('abc');
                var r = p.exec('ab');

                assert.equal(r, null);
            });

            test(5, function () {
                var p = txt('abc');
                var r = p.exec('');

                assert.equal(r, null);
            });
        });

        suite('toString', function () {
            test(1, function () {
                var p = txt('');
                assert.equal(p, '""');
            });

            test(2, function () {
                var p = txt('abc');
                assert.equal(p, '"abc"');
            });

            test(3, function () {
                var p = txt('"123"');
                assert.equal(p, '"\\"123\\""');
            });
        });
    });

    suite('rgx', function () {
        test(1, function () {
            var p = rgx(/abc/);
            var r = p.exec('abc');

            assert.equal(r, 'abc');
        });

        test(2, function () {
            var p = rgx(/abc/);
            var r = p.exec('abcdef');

            assert.equal(r, null);
        });

        test(3, function () {
            var p = rgx(/abc/);
            var r = p.exec('abC');

            assert.equal(r, null);
        });

        test(4, function () {
            var p = rgx(/abc/);
            var r = p.exec('123abc');

            assert.equal(r, null);
        });

        test(5, function () {
            var p = rgx(/[\x00-\xff]+/m);
            var r = p.exec('abc\r\ndef');

            assert.equal(r, 'abc\r\ndef');
        });

        test('toString', function () {
            assert.equal(rgx(/abc/) + '', '/abc/');
        });
    });

    suite('opt', function () {
        test(1, function () {
            var p = opt(txt('abc'));
            var r = p.exec('abc');

            assert.equal(r, 'abc');
        });

        test(2, function () {
            var p = opt(txt('abc'));
            var r = p.exec('abcdef');

            assert.equal(r, null);
        });

        test(3, function () {
            var p = opt(txt(''));
            var r = p.exec('');

            assert.equal(r, '');
        });

        test(4, function () {
            var p = opt(txt(''));
            var r = p.exec('abc');

            assert.equal(r, null);
        });

        test(5, function () {
            var p = opt(txt('abc'));
            var r = p.exec('');

            assert.equal(r, void 0);
        });

        test(6, function () {
            var p = opt(txt('abc'));
            var r = p.exec('def');

            assert.equal(r, null);
        });

        test(7, function () {
            var p = opt(txt('abc'), 456);
            var r = p.exec('');

            assert.equal(r, 456);
        });

        test(8, function () {
            var p = opt(txt(''), 456);
            var r = p.exec('');

            assert.equal(r, '');
        });

        test(9, function () {
            var p = opt(opt(txt('abc')));
            var r = p.exec('abc');

            assert.equal(r, 'abc');
        });

        test('toString', function () {
            var p = opt(txt('abc'));
            assert.equal(p, '"abc"?');
        });
    });

    suite('exc', function () {
        test(1, function () {
            var p = exc(txt('abc'), txt('abcdef'));
            var r = p.exec('abc');

            assert.equal(r, 'abc');
        });

        test(2, function () {
            var p = exc(txt('abc'), txt('abcdef'));
            var r = p.exec('abcdef');

            assert.equal(r, null);
        });

        test(3, function () {
            var p = exc(txt('abc'), txt('abc'));
            var r = p.exec('abc');

            assert.equal(r, null);
        });

        test(4, function () {
            var p = exc(txt('abc'), txt('def'));
            var r = p.exec('123');

            assert.equal(r, null);
        });

        test('toString', function () {
            var p = exc(txt('abc'), txt('123'));
            assert.equal(p, '"abc" ~ "123"');
        });
    });

    suite('any', function () {
        var p;

        setup(function () {
            p = any(txt('a'), txt('bb'), txt('ccc'))
        });

        test(1, function () {
            var r = p.exec('a');
            assert.equal(r, 'a');
        });

        test(2, function () {
            var r = p.exec('bb');
            assert.equal(r, 'bb');
        });

        test(3, function () {
            var r = p.exec('ccc');
            assert.equal(r, 'ccc');
        });

        test(4, function () {
            var r = p.exec('aaaa');
            assert.equal(r, null);
        });

        test(5, function () {
            var r = p.exec('bbbb');
            assert.equal(r, null);
        });

        test(6, function () {
            var r = p.exec('cccc');
            assert.equal(r, null);
        });

        test(7, function () {
            var p = any(txt('a'));
            assert.equal(p.exec('a'), 'a');
            assert.equal(p.exec('b'), null);
            assert.equal(p.exec(''), null);
        });

        test(8, function () {
            var p = any(txt(''));
            assert.equal(p.exec('a'), null);
            assert.equal(p.exec(''), '');
        });

        test('toString', function () {
            assert.equal(p, '("a" | "bb" | "ccc")');
        });
    });

    suite('seq', function () {
        test(1, function () {
            var p = seq(rgx(/a+/), rgx(/b+/), rgx(/c+/));
            var r = p.exec('abbccc');

            assert.deepEqual(r, ['a', 'bb', 'ccc']);
        });

        test(2, function () {
            var p = seq(rgx(/a+/), rgx(/b*/), opt(rgx(/c+/)), rgx(/d+/));
            var r = p.exec('adddd');

            assert.deepEqual(r, ['a', '', void 0, 'dddd']);
        });

        test(3, function () {
            var d = txt('1');
            var p = seq(seq(seq(d), seq(d)), seq(seq(d), seq(d)));
            var r = p.exec('1111');

            assert.deepEqual(r, [[['1'], ['1']], [['1'], ['1']]]);
        });

        test(4, function () {
            var p = seq(rgx(/a+/), rgx(/b+/), rgx(/c+/));
            var r = p.exec('abbdddd');

            assert.equal(r, null);
        });

        test('toString', function () {
            var p = seq(txt('abc'), txt('123'), opt(rgx(/x/)));
            assert.equal(p, '("abc" "123" /x/?)');
        });
    });

    suite('rep', function () {
        suite('regular', function () {
            suite('accepts', function () {
                test(1, function () {
                    var p = rep(txt('abc'));
                    var r = p.exec('abcabcabc');

                    assert.deepEqual(r, ['abc', 'abc', 'abc']);
                });

                test(2, function () {
                    var p = rep(rep(txt('abc')));
                    var r = p.exec('abcabcabc');

                    assert.deepEqual(r, [['abc', 'abc', 'abc']]);
                });

                test(3, function () {
                    var p = rep(opt(txt('abc')));
                    var r = p.exec('abcabc');

                    assert.deepEqual(r, ['abc', 'abc']);
                });

                test(4, function () {
                    var p = seq(rep(opt(txt('abc'))), txt('def'));
                    var r = p.exec('abcdef');

                    assert.deepEqual(r, [['abc'], 'def']);
                });
            });

            suite('rejects', function () {
                test(1, function () {
                    var p = rep(txt('abc'));
                    var r = p.exec('def');

                    assert.equal(r, null);
                });

                test(2, function () {
                    var p = rep(txt(''));
                    var r = p.exec('abc');

                    assert.equal(r, null);
                });

                test(3, function () {
                    var p = rep(txt('abc'));
                    var r = p.exec('');

                    assert.equal(r, null);
                });
            });

            test('toString', function () {
                var p = rep(txt('123'));
                assert.equal(p, '"123"*');
            });
        });

        suite('separated', function () {
            suite('accepts', function () {
                test(1, function () {
                    var p = rep(txt('abc'), txt(','));
                    var r = p.exec('abc,abc,abc');

                    assert.deepEqual(r, ['abc', 'abc', 'abc']);
                });

                test(2, function () {
                    var p = rep(rep(txt('abc'), txt(',')), txt(','));
                    var r = p.exec('abc,abc,abc');

                    assert.deepEqual(r, [['abc', 'abc', 'abc']]);
                });

                test(3, function () {
                    var p = rep(rep(rgx(/\w+/), txt('=')), txt('&'));
                    var r = p.exec('abc=123&def=456');

                    assert.deepEqual(r, [['abc', '123'], ['def', '456']]);
                });

                test(4, function () {
                    var p = rep(opt(txt('abc')), txt(','));
                    var r = p.exec('abc,abc');

                    assert.deepEqual(r, ['abc', 'abc']);
                });
            });

            suite('rejects', function () {
                test(1, function () {
                    var p = rep(txt('abc'), txt(','));
                    var r = p.exec('abc,abc,abd');

                    assert.equal(r, null);
                });

                test(2, function () {
                    var p = rep(txt('abc'), txt(','));
                    var r = p.exec('def');

                    assert.equal(r, null);
                });

                test(3, function () {
                    var p = rep(txt(''), txt(','));
                    var r = p.exec('abc');

                    assert.equal(r, null);
                });
            });

            test('toString', function () {
                var p = rep(rgx(/\d+/), txt(','));
                assert.equal(p, '/\\d+/*');
            });
        });
    });

    suite('then', function () {
        test('simple', function () {
            var p = rgx(/\d+/).
                then(function (s) { return 1 / +s });

            var r = p.exec('10');

            assert.equal(r, 0.1);
        });

        test('chain', function () {
            var p = rgx(/\d+/)
                .then(function (s) { return +s })
                .then(function (n) { return 1 / n });

            var r = p.exec('10');

            assert.equal(r, 0.1);
        });

        test('text', function () {
            var n = rgx(/\d+/)
                .then(function (s) { return +s + 1 })
                .then(function (s, t) { return t + '=>' + s });

            var p = rep(n, txt(','));
            var r = p.exec('123,456,789');

            assert.deepEqual(r, ['123=>124', '456=>457', '789=>790']);
        });

        test('rejected', function () {
            var n = 0;
            var p = txt('a').then(function (s) { n = 1 });
            var r = p.exec('b');

            assert.equal(r, null);
            assert.equal(n, 0);
        });
    });
});
