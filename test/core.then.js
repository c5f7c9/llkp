var assert = require('assert');
var core = require('../core');

require('../core.then');

var txt = core.txt;
var rgx = core.rgx;
var opt = core.opt;
var any = core.any;
var seq = core.seq;
var rep = core.rep;

suite('Core.Then', function () {
    'use strict';

    suite('select', function () {
        test(1, function () {
            var p = rep(rgx(/\w+/), txt(',')).select(0);
            var r = p.exec('1,2,3');

            assert.equal(r, '1');
        });

        test(2, function () {
            var p = rep(rgx(/\w+/), txt(',')).select(2);
            var r = p.exec('1,2,3');

            assert.equal(r, '3');
        });

        test(3, function () {
            var p = rep(rgx(/\w+/), txt(',')).select(-1);
            var r = p.exec('1,2,3');

            assert.equal(r, void 0);
        });

        test(4, function () {
            var p = opt(txt('x')).select(123);
            var s = '';
            var r = p.exec(s);

            assert.equal(r, void 0);
        });
    });

    suite('as', function () {
        test(1, function () {
            var p = rgx(/\w+/).as('w');
            var r = p.exec('123');

            assert.deepEqual(r, { w: 123 });
        });

        test(2, function () {
            var p = rgx(/\w+/).as('w').as('m');
            var r = p.exec('123');

            assert.deepEqual(r, { m: { w: 123 } });
        });
    });

    suite('map', function () {
        test(1, function () {
            var p = rep(rgx(/\w+/), rgx(/\s+/)).map({});
            var r = p.exec('abc def 123');

            assert.deepEqual(r, {});
        });

        test(1, function () {
            var p = rep(rgx(/\w+/), rgx(/\s+/)).map({ x: 0, y: 1, z: 2 });
            var r = p.exec('abc def 123');

            assert.deepEqual(r, { x: 'abc', y: 'def', z: '123' });
        });

        test(1, function () {
            var p = rep(rgx(/\w+/), rgx(/\s+/)).map({ x: 111 });
            var r = p.exec('abc def 123');

            assert.deepEqual(r, { x: void 0 });
        });
    });

    suite('parseInt', function () {
        test(10, function () {
            var p = rgx(/\w+/).parseInt();
            var r = p.exec('123');

            assert.strictEqual(r, 123);
        });

        test(2, function () {
            var p = rgx(/\w+/).parseInt(2);
            var r = p.exec('1011');

            assert.strictEqual(r, 11);
        });

        test(16, function () {
            var p = rgx(/\w+/).parseInt(16);
            var r = p.exec('20');

            assert.strictEqual(r, 32);
        });
    });

    suite('parseFloat', function () {
        test(1, function () {
            var p = rgx(/.+/).parseFloat();
            var r = p.exec('123.456');

            assert.strictEqual(r, 123.456);
        });

        test(2, function () {
            var p = rgx(/.+/).parseFloat();
            var r = p.exec('123');

            assert.strictEqual(r, 123);
        });
    });

    suite('merge', function () {
        test(1, function () {
            var p = rep(rgx(/\w+/), rgx(/\s+/)).merge();
            var r = p.exec('a  b c');

            assert.equal(r, 'abc');
        });

        test(2, function () {
            var p = rep(rgx(/\w+/), rgx(/\s+/)).merge(';');
            var r = p.exec('a  b c');

            assert.equal(r, 'a;b;c');
        });
    });

    suite('text', function () {
        test(1, function () {
            var p = txt('a').as('w').text();
            var r = p.exec('a');

            assert.equal(r, 'a');
        });

        test(2, function () {
            var p = opt(txt('a')).text();
            var r = p.exec('');

            assert.equal(r, '');
        });
    });

    suite('join', function () {
        test(1, function () {
            var p = rep(seq(rgx(/\w+/), txt('='), rgx(/\d+/).parseInt()), txt(';')).join(0, 2);
            var r = p.exec('a=1;bb=22;ccc=333');

            assert.deepEqual(r, { a: 1, bb: 22, ccc: 333 });
        });

        test(2, function () {
            var p = rep(seq(rgx(/\w+/), txt('='), rgx(/\d+/).parseInt()), txt(';')).join(0, 111);
            var r = p.exec('a=1;bb=22;ccc=333');

            assert.deepEqual(r, { a: void 0, bb: void 0, ccc: void 0 });
        });
    });

    suite('flatten', function () {
        test(1, function () {
            var q = { exec: function (str, pos) { return p.exec(str, pos) } };
            var p = seq(txt('('), rep(any(rgx(/\w+/), q), txt(',')), txt(')')).select(1);
            var s = '((((1,2,3),4,5,(6,(7),8),9),((1,2,3),4,5,(6,7,8),9)))';
            var r = p.flatten().exec(s);
            var w = p.exec(s);

            assert.deepEqual(r, [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            assert.deepEqual(w, [[[[1, 2, 3], 4, 5, [6, [7], 8], 9], [[1, 2, 3], 4, 5, [6, 7, 8], 9]]]);
        });
    });

    suite('trim', function () {
        test(1, function () {
            var p = rgx(/.+/).trim();
            var s = '123';
            var r = p.exec(s);

            assert.deepEqual(r, '123');
        });

        test(2, function () {
            var p = rgx(/.+/).trim();
            var s = '   123   ';
            var r = p.exec(s);

            assert.deepEqual(r, '123');
        });
    });

    suite('slice', function () {
        test(1, function () {
            var p = rgx(/\d+/).slice(1, 5);
            var s = '0123456789';
            var r = p.exec(s);

            assert.equal(r, '1234');
        });

        test(2, function () {
            var p = rgx(/\d+/).slice(+1, -1);
            var s = '0123456789';
            var r = p.exec(s);

            assert.equal(r, '12345678');
        });
    });
});
