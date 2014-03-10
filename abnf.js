// ABNF (RFC 5234) syntax of LL(k) grammars.
// Exports LLKP.ABNF class.
// Depends on `core.then` module.

(function () {
    'use strict';

    var core = typeof window != typeof void 0 ?
        window.LLKP.Core : // for browsers
        (require('./core.then'), require('./core')); // for Node

    var Pattern = core.Pattern;
    var txt = core.txt;
    var rgx = core.rgx;
    var opt = core.opt;
    var exc = core.exc;
    var any = core.any;
    var seq = core.seq;
    var rep = core.rep;

    function numstr(prefix, regex, radix) {
        var num = rgx(regex).parseInt(radix);
        var rng = seq(num, txt('-'), num).map({ min: 0, max: 2 });
        var chr = any(rng, num.as('num'));
        return seq(txt(prefix), rep(chr, txt('.'), 1)).select(1);
    }

    function hs(n) {
        var s = n.toString(16);
        return ['', '\\x0', '\\x', '\\u0', '\\u'][s.length] + s;
    }

    function str(string) {
        var c = string.map(function (s) {
            return 'num' in s ? hs(s.num) : hs(s.min) + '-' + hs(s.max);
        });

        return rgx(new RegExp('[' + c.join('][') + ']'));
    }

    function quoted(lq, rq) {
        var regexp = new RegExp(lq + '[\\x20-\\x7E]*?' + rq);
        return rgx(regexp).then(function (s) { return s.slice(+1, -1) });
    }

    function ABNF(definition, rules) {
        var refs = {};

        function parse(abnf) {
            var r = ABNF.pattern.exec(abnf);
            if (r) return r;
            throw new SyntaxError('Invalid ABNF rule: ' + abnf);
        }

        function compile(ast) {
            if ('seq' in ast) return buildseq(ast);
            if ('any' in ast) return any.apply(null, ast.any.map(compile));
            if ('rep' in ast) return buildrep(ast);
            if ('opt' in ast) return opt(compile(ast.opt));
            if ('str' in ast) return str(ast.str);
            if ('txt' in ast) return txt(ast.txt);
            if ('rgx' in ast) return rgx(new RegExp(ast.rgx));
            if ('exc' in ast) return exc.apply(null, ast.exc.map(compile));
            if ('ref' in ast) return ref(ast.ref);
            if ('sel' in ast) return compile(ast.sel).select(ast.key);
        }

        function build(definition, name) {
            if (definition instanceof RegExp)
                return rgx(definition);

            if (definition instanceof Function)
                return new Pattern(name, definition);

            if (definition instanceof Pattern)
                return definition;

            return compile(parse(definition + ''));
        }

        function buildseq(ast) {
            var p = seq.apply(null, ast.seq.map(compile));
            return ast.map ? p.map(ast.map) : p;
        }

        function buildrep(ast) {
            var p = rep(compile(ast.rep), ast.sep && compile(ast.sep), ast.min, ast.max);
            return ast.key && ast.val ? p.join(ast.key, ast.val) : p;
        }

        function ref(name) {
            if (refs[name])
                return refs[name];

            refs[name] = null;

            return new Pattern(name, function (str, pos) {
                refs[name] = refs[name] || build(rules[name], name);
                return refs[name].exec(str, pos);
            });
        }

        function init(self) {
            var pattern, name;

            if (rules instanceof Function)
                rules.call(rules = {}, build);
            else
                rules = Object.create(rules || {});

            for (name in ABNF.rules)
                if (name in rules)
                    throw new SyntaxError('Rule name is reserved: ' + name);
                else
                    rules[name] = ABNF.rules[name];

            pattern = build(definition);

            for (name in refs)
                if (!rules[name])
                    throw new SyntaxError('Rule is not defined: ' + name);

            Pattern.call(self, pattern + '', pattern.exec);
        }

        if (this instanceof ABNF)
            init(this);
        else
            return new ABNF(definition, rules);
    }

    ABNF.prototype = Pattern.prototype;

    ABNF.pattern = (function () {
        var rules = {};

        function ref(name) {
            return rules[name] || new Pattern(name, function (str, pos) {
                return rules[name].exec(str, pos);
            });
        }

        rules.hexstr = numstr('x', /[0-9a-f]+/i, 16);
        rules.decstr = numstr('d', /[0-9]+/, 10);
        rules.binstr = numstr('b', /[0-1]+/, 2);

        rules.lbl = rgx(/[a-z][a-z0-9_]*:/i).slice(0, -1);
        rules.sel = rgx(/\.[a-z0-9]+/i).slice(1);
        rules.key = rgx(/[a-z0-9_]+/i);

        rules.quantifier = any(
            seq(rgx(/\d*/), txt('*'), rgx(/\d*/)).then(function (r) { return { min: +r[0] || 0, max: +r[2] || +Infinity } }),
            rgx(/\d+/).then(function (r) { return { min: +r, max: +r } }));

        rules.join = seq(txt('<'), ref('key'), rgx(/\s*:\s*/), ref('key'), txt('>')).map({ key: 1, val: 3 });

        rules.rep = any(
            seq(ref('quantifier'), opt(ref('sep')), opt(ref('join')), ref('element')).then(function (r) {
                return {
                    rep: r[3],
                    sep: r[1],
                    min: r[0].min,
                    max: r[0].max,
                    key: r[2] && r[2].key,
                    val: r[2] && r[2].val
                };
            }),
            ref('element'));

        rules.exc = seq(ref('rep'), opt(seq(rgx(/\s*~\s*/), ref('rep'))))
            .then(function (r) { return r[1] ? { exc: [r[0], r[1][1]] } : r[0] });

        rules.seq = rep(seq(opt(ref('lbl')), ref('exc')), rgx(/\s*/))
            .then(function (r) {
                var i, m, s = [];

                for (i = 0; i < r.length; i++) {
                    s.push(r[i][1]);
                    if (r[i][0]) {
                        m = m || {};
                        m[r[i][0]] = i;
                    }
                }

                return s.length == 1 && !m ? s[0] : { seq: s, map: m };
            });

        rules.any = rep(ref('seq'), rgx(/\s*\/\s*/))
            .then(function (r) { return r.length == 1 ? r[0] : { any: r } });

        rules.sep = seq(rgx(/\s*\{\s*/), ref('any'), rgx(/\s*\}\s*/)).select(1);
        rules.grp = seq(rgx(/\s*\(\s*/), ref('any'), rgx(/\s*\)\s*/)).select(1);
        rules.opt = seq(rgx(/\s*\[\s*/), ref('any'), rgx(/\s*\]\s*/)).select(1).as('opt');

        rules.sgr = seq(any(ref('grp'), ref('opt')), opt(ref('sel')))
            .then(function (r) { return !r[1] ? r[0] : { sel: r[0], key: r[1] } });

        rules.element = any(
            any(quoted('"', '"'), quoted("'", "'")).as('txt'),
            quoted('`', '`').as('rgx'),
            rgx(/[a-zA-Z][a-zA-Z0-9\-]*/).as('ref'),
            seq(txt('%'), any(ref('hexstr'), ref('decstr'), ref('binstr'))).select(1).as('str'),
            ref('sgr'),
            seq(txt('?'), ref('element')).select(1).as('opt'));

        return ref('any');
    })();

    // Predefined ABNF rules taken from RFC 5234.
    // http://tools.ietf.org/html/rfc5234#appendix-B.1
    ABNF.rules = {
        ALPHA: '%x41-5A / %x61-7A', // A-Z / a-z
        BIT: '"0" / "1"',
        CHAR: '%x01-7F', // any 7-bit US-ASCII character, excluding NUL
        CR: '%x0D', // carriage return
        CRLF: 'CR LF', // Internet standard newline
        CTL: '%x00-1F / %x7F', // controls
        DIGIT: '%x30-39', // 0-9
        DQUOTE: '%x22', // " (Double Quote)
        HEXDIG: 'DIGIT / "A" / "B" / "C" / "D" / "E" / "F"',
        HTAB: '%x09', // horizontal tab
        LF: '%x0A', // linefeed
        LWSP: '*(WSP / CRLF WSP)', // linear-white-space
        OCTET: '%x00-FF',  // 8 bits of data
        SP: '%x20',
        VCHAR: '%x21-7E', // visible (printing) characters
        WSP: 'SP / HTAB' // white space
    };

    if (typeof module != typeof void 0) // for Node
        module.exports = ABNF;

    if (typeof window != typeof void 0) // for browsers
        window.LLKP.ABNF = ABNF;
})();
