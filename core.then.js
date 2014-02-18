// A set of predefined transforms for Pattern.
// Installs LLKP.Core.Pattern.prototype.

(function () {
    'use strict';

    var transforms = {
        select: function (index) {
            return this.then(function (r) {
                return r[index];
            });
        },

        as: function (name) {
            return this.then(function (r) {
                var m = {};
                m[name] = r;
                return m;
            });
        },

        map: function (mapping) {
            return this.then(function (r) {
                var m = {}, i;
                for (i in mapping)
                    m[i] = r[mapping[i]];
                return m;
            });
        },

        parseInt: function (radix) {
            return this.then(function (r) {
                return parseInt(r, radix);
            });
        },

        merge: function (separator) {
            return this.then(function (r) {
                return r.join(separator || '');
            });
        },

        text: function () {
            return this.then(function (r, s) {
                return s;
            });
        },

        join: function (key, val) {
            return this.then(function (r) {
                var m = {}, i;
                for (i = 0; i < r.length; i++)
                    m[r[i][key]] = r[i][val];
                return m;
            });
        },

        flatten: function () {
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
        }
    };

    
    if (typeof module != typeof void 0) // for Node
        (module.exports = require('./core')).Pattern.prototype = transforms

    if (typeof window != typeof void 0) // for browsers
        window.LLKP.Pattern.prototype = transforms;
})();
