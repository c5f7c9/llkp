// A set of predefined transforms for Pattern.
// Extends Pattern.prototype.
// Depends on `core` module.

(function () {
    'use strict';

    var prototype = typeof window != typeof void 0 ?
        window.LLKP.Core.Pattern.prototype : // for browsers
        require('./core').Pattern.prototype; // for Node

    prototype.make = function (value) {
        return this.then(function () {
            return value;
        });
    };

    prototype.select = function (index) {
        return this.then(function (r) {
            return r ? r[index] : void 0;
        });
    };

    prototype.as = function (name) {
        return this.then(function (r) {
            var m = {};
            m[name] = r;
            return m;
        });
    };

    prototype.map = function (mapping) {
        return this.then(function (r) {
            var m = {}, i;
            for (i in mapping)
                m[i] = r[mapping[i]];
            return m;
        });
    };

    prototype.parseInt = function (radix) {
        return this.then(function (r) {
            return parseInt(r, radix);
        });
    };

    prototype.parseFloat = function () {
        return this.then(function (r) {
            return parseFloat(r);
        });
    };

    prototype.merge = function (separator) {
        return this.then(function (r) {
            return r.join(separator || '');
        });
    };

    prototype.trim = function () {
        return this.then(function (r) {
            return r.trim();
        });
    };

    prototype.slice = function (start, end) {
        return this.then(function (r) {
            return r.slice(start, end);
        });
    };

    prototype.text = function () {
        return this.then(function (r, s) {
            return s;
        });
    };

    prototype.join = function (key, val) {
        return this.then(function (r) {
            var m = {}, i;
            for (i = 0; i < r.length; i++)
                m[r[i][key]] = r[i][val];
            return m;
        });
    };

    prototype.flatten = function () {
        function flatten(a) {
            var f = [], i;
            for (i = 0; i < a.length; i++)
                if (a[i] instanceof Array)
                    f = f.concat(flatten(a[i]));
                else
                    f.push(a[i]);
            return f;
        }

        return this.then(function (r) {
            return flatten(r);
        });
    };
})();
