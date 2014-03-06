// Debugging extensions for parsing functions.
// Installs debugging methods to Pattern.prototype.

(function () {
    'use strict';

    var Pattern = typeof window != typeof void 0 ?
        window.LLKP.Core.Pattern : // for browsers
        require('./core').Pattern; // for Node

    var indent = 1;

    Pattern.prototype.watch = function (alias) {
        var self = this;
        return new Pattern(alias || self + '', function (str, pos) {
            var i, s, r, p;

            i = new Array(indent).join('|  ');
            s = str.slice(pos, pos + 20);
            s = (str.length - pos) + '(' + s + ')';
            s = s.replace(/[^\x20-\x7e]/gm, function (c) {
                var h = c.charCodeAt(0).toString(16);
                return ['', '\\x0', '\\x', '\\u0', '\\u'][h.length] + h;
            });

            p = i + self + ' :: ' + s;

            console.log(p);
            indent++;
            r = self.exec(str, pos);
            indent--;
            console.log(p, '=>', (r ? r.res : 'null'));
            return r;
        });
    };
})();
