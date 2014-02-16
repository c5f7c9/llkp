// LL(k) core parsing functions and combinators.

(function () {
    'use strict';

    function Pattern(name, exec) {
        this.name = name;
        this.exec = exec;
    }

    Pattern.prototype = {
        toString: function () {
            return this.name;
        },

        then: function (transform) {
            var exec = this.exec;
            return new Pattern(this.name, function (str) {
                var r = exec(str);
                return r && fps(transform(r[0], str), r.end);
            });
        },

        select: function (index) {
            return this.then(function (r) {
                return r[index];
            });
        }
    };

    // final parsing state
    function fps(res, end) {
        var out = [res];
        out.end = end;
        return out;
    }

    // parses a known text
    function txt(text) {
        return new Pattern('"' + text.replace(/"/gm, '\\"') + '"', function (str) {
            if (str.substr(0, text.length) == text)
                return fps(text, text.length);
        });
    }

    // parses a regular expression
    function rgx(regexp) {
        return new Pattern(regexp + '', function (str) {
            var r = regexp.exec(str);
            if (r && !r.index) // regex must match at the beginning, so index must be 0
                return fps(r[0], r[0].length);
        });
    }

    // parses an optional pattern
    function opt(pattern, defval) {
        return new Pattern(pattern + '?', function (str) {
            return pattern.exec(str) || fps(defval, 0);
        });
    }

    // parses a pattern if it doesn't match another pattern
    function exc(pattern, except) {
        return new Pattern(pattern + ' ~ ' + except, function (str) {
            return !except.exec(str) && pattern.exec(str);
        });
    }

    // parses any of the given patterns
    function any(/* patterns... */) {
        var patterns = [].slice.call(arguments, 0);
        return new Pattern('(' + patterns.join(' | ') + ')', function (str) {
            var r, i;
            for (i = 0; i < patterns.length && !r; i++)
                r = patterns[i].exec(str);
            return r;
        });
    }

    // parses a sequence of patterns
    function seq(/* patterns... */) {
        var patterns = [].slice.call(arguments, 0);
        return new Pattern('(' + patterns.join(' ') + ')', function (str) {
            var i, r, n = 0, a = [];

            for (i = 0; i < patterns.length; i++) {
                r = patterns[i].exec(str.slice(n));
                if (!r) return;
                a.push(r[0]);
                n += r.end;
            }

            return fps(a, n);
        });
    }

    // parses a (separated) repetition of a pattern
    function rep(pattern, separator) {
        var separated = separator ? seq(separator, pattern).select(1) : pattern;
        return new Pattern(pattern + '*' + (separator ? ':' + separator : ''), function (str) {
            var a = [], n = 0, r = pattern.exec(str);

            while (r && r.end > 0) {
                a.push(r[0]);
                n += r.end;
                r = separated.exec(str.slice(n));
            }

            return a.length > 0 && fps(a, n);
        });
    }

    (function () {
        var exports = {
            Pattern: Pattern, // to allow extending Pattern.prototype
            txt: txt,
            rgx: rgx,
            opt: opt,
            exc: exc,
            any: any,
            seq: seq,
            rep: rep
        };

        if (typeof module != typeof void 0)
            module.exports = exports;

        if (typeof window != typeof void 0)
            window.LLParserCore = exports;
    })();
})();
