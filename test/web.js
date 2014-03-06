// Simulates loading scripts in a browser.
//
// This test does not help to improve the branch coverage number
// reported by istanbul because istanbul hooks into `require`
// and this test uses `readFileSync` instead of `require`.

var assert = require('assert');
var fs = require('fs');

suite('Web', function () {
    'use strict';

    var window;

    setup(function () {
        window = {};
    });

    function load(path) {
        var text = fs.readFileSync(path, 'utf8');
        var func = new Function('window', 'module', 'exports', 'require', text); // jshint ignore:line
        return func(window);
    }

    test('Core', function () {
        load('core.js');

        assert.equal(typeof window.LLKP.Core.Pattern, 'function');
        assert.equal(typeof window.LLKP.Core.txt, 'function');
    });

    test('Core.Then', function () {
        load('core.js');
        load('core.then.js');

        assert.equal(typeof window.LLKP.Core.Pattern.prototype.select, 'function');
    });

    test('ABNF', function () {
        load('core.js');
        load('core.then.js');
        load('abnf.js');

        assert.equal(typeof window.LLKP.ABNF, 'function');
    });

    test('PEG', function () {
        load('core.js');
        load('core.then.js');
        load('peg.js');

        assert.equal(typeof window.LLKP.PEG, 'function');
    });
});
