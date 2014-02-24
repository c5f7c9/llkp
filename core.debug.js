// Debugging extensions for parsing functions.
// Installs debugging methods to Pattern.prototype.

(function () {
    'use strict';

    var Pattern = typeof window != typeof void 0 ?
        window.LLKP.Core.Pattern :
        require('./core').Pattern;

    var indent = 1;

    Pattern.prototype.watch = function (alias) {
        var self = this;
        return new Pattern(alias || self + '', function (str, pos) {
            var i, s, r;

            i = new Array(indent).join('|  ');
            s = '"' + str.slice(pos, 20).replace(/[\x00-\x1f]/gm, function (c) {
                var n = c.charCodeAt(0);
                return n < 0x10 ? '\\x0' + n.toString(16) :
                    n < 0x100 ? '\\x' + n.toString(16) :
                    n < 0x1000 ? '\\u0' + n.toString(16) :
                    '\\u' + n.toString(16);
            }) + '"';

            console.log(i + self, ':', s);
            indent++;
            r = self.exec(str, pos);
            indent--;
            console.log(i + self, ':', s, '=>', (r ? r.res : 'null'));
            return r;
        });
    };
})();
