// ABNF (RFC 5234) syntax of LL(k) grammars.
// Exports LLKP.ABNF class.

(function () {
    'use strict';

    var core = typeof window != typeof void 0 ?
        window.LLKP.Core :
        require('./core.then');

    var Pattern = core.Pattern;
    var txt = core.txt;
    var rgx = core.rgx;
    var opt = core.opt;
    var exc = core.exc;
    var any = core.any;
    var seq = core.seq;
    var rep = core.rep;

    function numval(prefix, regex, radix) {
        var num = rgx(regex).parseInt(radix);
        return any(
            seq(txt(prefix), num, txt('-'), num).map({ min: 1, max: 3 }),
            seq(txt(prefix), num).map({ min: 1, max: 1 }));
    }

    function rng(min, max) {
        var name = '%x' + min.toString(16) + '-' + max.toString(16);
        return new Pattern(name, function (str, pos) {
            var c = str.charAt(pos);
            var n = str.charCodeAt(pos);
            return n >= min && n <= max ? { res: c, end: pos + 1 } : null;
        });
    }

    function quoted(lq, rq) {
        var regexp = new RegExp(lq + '[\\x20-\\x7E]*?' + rq);
        return rgx(regexp).then(function (s) { return s.slice(+1, -1) });
    }

    function chr() {
        return new Pattern('.', function (str, pos) {
            return pos < str.length ? { res: str.charAt(pos), end: pos + 1 } : null;
        });
    }

    function ABNF(definition, rules) {
        var refs = {};

        function parse(abnf) {
            var r = ABNF.pattern.exec(abnf);
            if (r) return r;
            throw new SyntaxError('Invalid ABNF rule: ' + abnf);
        }

        function compile(ast) {
            if ('seq' in ast) return seq.apply(null, ast.seq.map(compile));
            if ('any' in ast) return any.apply(null, ast.any.map(compile));
            if ('rep' in ast) return rep(compile(ast.rep), ast.sep && compile(ast.sep), ast.min, ast.max);
            if ('opt' in ast) return opt(compile(ast.opt));
            if ('rng' in ast) return rng(ast.rng.min, ast.rng.max);
            if ('txt' in ast) return txt(ast.txt);
            if ('chr' in ast) return chr();
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

    ABNF.pattern = function () {
        var rules = {};

        function ref(name) {
            return rules[name] || new Pattern(name, function (str, pos) {
                return rules[name].exec(str, pos);
            });
        }

        // bin-val = "b" 1*("0" / "1") ["-" 1*("0" / "1")]
        rules.hexval = numval('x', /[0-9a-fA-F]+/, 16);
        rules.decval = numval('d', /[0-9]+/, 10);
        rules.binval = numval('b', /[0-1]+/, 2);

        // repeat = *digit "*" *digit / 1*digit
        rules.repeat = any(
            seq(rgx(/\d*/), txt('*'), rgx(/\d*/)).then(function (r) { return { min: +r[0] || 0, max: +r[2] || +Infinity } }),
            rgx(/\d+/).then(function (r) { return { min: +r, max: +r } }));

        // repetition = repeat [separator] element / element
        rules.repetition = any(
            seq(ref('repeat'), opt(ref('separator')), ref('element'))
                .then(function (r) { return { rep: r[2], sep: r[1], min: r[0].min, max: r[0].max } }),
            ref('element'));

        // exclusion = repetition ["~" repetition] ; this is an extension to ABNF
        rules.exclusion = seq(ref('repetition'), opt(seq(rgx(/\s*~\s*/), ref('repetition'))))
            .then(function (r) { return r[1] ? { exc: [r[0], r[1][1]] } : r[0] });

        // concatenation = exclusion *(" " exclusion)
        rules.concatenation = rep(ref('exclusion'), rgx(/\s*/))
            .then(function (r) { return r.length == 1 ? r[0] : { seq: r } });

        // alternation = concatenation *("/" concatenation)
        rules.alternation = rep(ref('concatenation'), rgx(/\s*\/\s*/))
            .then(function (r) { return r.length == 1 ? r[0] : { any: r } });

        // separator = "{" alternation "}" ; this is an extension to ABNF
        rules.separator = seq(rgx(/\s*\{\s*/), ref('alternation'), rgx(/\s*\}\s*/)).select(1);

        // element = char-val / rule-name / num-val / group / option / single-option / single-char
        rules.element = any(
            // char-val = "..." / '...' / <...> ; last two are extensions to ABNF
            any(quoted('"', '"'), quoted("'", "'"), quoted('<', '>')).as('txt'),
            // rule-name = ...
            rgx(/[a-zA-Z][a-zA-Z0-9\-]*/).as('ref'),
            // num-val = "%" (hex-val / dec-val / bin-val)
            seq(txt('%'), any(ref('hexval'), ref('decval'), ref('binval'))).select(1).as('rng'),
            // group = "(" alternation ")"
            seq(rgx(/\s*\(\s*/), ref('alternation'), rgx(/\s*\)\s*/)).select(1),
            // option = "[" alternation "]"
            seq(rgx(/\s*\[\s*/), ref('alternation'), rgx(/\s*\]\s*/)).select(1).as('opt'),
            // single-option = "?" element ; this is an extension to ABNF
            seq(txt('?'), ref('element')).select(1).as('opt'),
            // single-char = "." ; this is an extension to ABNF
            txt('.').as('chr'));

        return ref('alternation');
    }();

    if (typeof module != typeof void 0) // for Node
        module.exports = ABNF;

    if (typeof window != typeof void 0) // for browsers
        window.LLKP.ABNF = ABNF;
})();
