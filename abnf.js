// ABNF (RFC 5234) syntax of LL(k) grammars.
// Exports LLKP.ABNF class.
// Depends on `core.then` module.

!function () {
    'use strict';

    var core = typeof window != typeof void 0 ?
        window.LLKP.Core :
        (require('./core.then'), require('./core'));

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
            if ('rep' in ast) return rep(compile(ast.rep), ast.sep && compile(ast.sep), ast.min, ast.max);
            if ('opt' in ast) return opt(compile(ast.opt));
            if ('str' in ast) return str(ast.str);
            if ('txt' in ast) return txt(ast.txt);
            if ('rgx' in ast) return rgx(new RegExp(ast.rgx));
            if ('chr' in ast) return rgx(/[\u0000-\uffff]/);
            if ('exc' in ast) return exc.apply(null, ast.exc.map(compile));
            if ('ref' in ast) return ref(ast.ref);
        }

        function build(definition, name) {
            if (definition instanceof RegExp)
                return rgx(definition);

            if (definition instanceof Function)
                return new Pattern(name || definition, definition);

            if (definition instanceof Pattern)
                return definition;

            return compile(parse(definition + ''));
        }

        function buildseq(ast) {
            var p = seq.apply(null, ast.seq.map(compile));
            var m = ast.map;
            return !m ? p : p.map(m);
        }

        function ref(name) {
            return (refs[name] = refs[name]) || new Pattern(name, function (str, pos) {
                return refs[name].exec(str, pos);
            });
        }

        function init(self) {
            var pattern, name;

            if (rules instanceof Function)
                rules.call(rules = {}, build);

            for (name in rules)
                refs[name] = build(rules[name], name);

            pattern = build(definition);

            for (name in refs)
                if (!refs[name])
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

        rules.quantifier = any(
            seq(rgx(/\d*/), txt('*'), rgx(/\d*/)).then(function (r) { return { min: +r[0] || 0, max: +r[2] || +Infinity } }),
            rgx(/\d+/).then(function (r) { return { min: +r, max: +r } }));

        rules.rep = any(
            seq(ref('quantifier'), opt(ref('sep')), ref('element'))
                .then(function (r) { return { rep: r[2], sep: r[1], min: r[0].min, max: r[0].max } }),
            ref('element'));

        rules.exc = seq(ref('rep'), opt(seq(rgx(/\s*~\s*/), ref('rep'))))
            .then(function (r) { return r[1] ? { exc: [r[0], r[1][1]] } : r[0] });

        rules.lbl = rgx(/[a-z][a-z0-9_]*:/i).slice(0, -1);

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

        rules.element = any(
            any(quoted('"', '"'), quoted("'", "'"), quoted('<', '>')).as('txt'),
            quoted('`', '`').as('rgx'),
            rgx(/[a-zA-Z][a-zA-Z0-9\-]*/).as('ref'),
            seq(txt('%'), any(ref('hexstr'), ref('decstr'), ref('binstr'))).select(1).as('str'),
            seq(rgx(/\s*\(\s*/), ref('any'), rgx(/\s*\)\s*/)).select(1),
            seq(rgx(/\s*\[\s*/), ref('any'), rgx(/\s*\]\s*/)).select(1).as('opt'),
            seq(txt('?'), ref('element')).select(1).as('opt'),
            txt('.').as('chr'));

        return ref('any');
    })();

    if (typeof module != typeof void 0) // for Node
        module.exports = ABNF;

    if (typeof window != typeof void 0) // for browsers
        window.LLKP.ABNF = ABNF;
}(); // jshint ignore:line
