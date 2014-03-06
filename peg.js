// PEG syntax of LL(k) grammars.
// Exports LLKP.PEG class.
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

    function PEG(definition, rules) {
        var refs = {};

        function parse(rule) {
            var r = PEG.pattern.exec(rule);
            if (r) return r;
            throw new SyntaxError('Invalid PEG rule: ' + rule);
        }

        function compile(ast) {
            if ('ref' in ast) return ref(ast.ref);
            if ('txt' in ast) return txt(ast.txt);
            if ('rgx' in ast) return rgx(new RegExp(ast.rgx));
            if ('opt' in ast) return opt(compile(ast.opt));
            if ('not' in ast) return not(compile(ast.not));
            if ('def' in ast) return compile_def(ast);
            if ('seq' in ast) return compile_seq(ast.seq);
            if ('any' in ast) return compile_alt(ast.any);
            if ('sep' in ast) return compile_rep(ast);
            if ('exc' in ast) return exc(compile(ast.exc.lhs), compile(ast.exc.rhs));
        }

        function compile_rep(ast) {
            return rep(compile(ast.rep), ast.sep && compile(ast.sep), ast.min);
        }

        function compile_def(ast) {
            var p = compile(ast.def);
            return !ast.key ? p : p.select(ast.key);
        }

        function compile_alt(asts) {
            var p = asts.map(compile);
            return p.length > 1 ? any.apply(0, p) : p[0];
        }

        function compile_seq(asts) {
            var m, p = asts.map(compile);

            asts.forEach(function (ast, i) {
                if ('lbl' in ast) {
                    m = m || {};
                    m[ast.lbl] = i;
                }
            });

            return m ? seq.apply(0, p).map(m) : p.length > 1 ? seq.apply(0, p) : p[0];
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

        if (this instanceof PEG)
            init(this);
        else
            return new PEG(definition, rules);
    }

    PEG.pattern = compose('def', function ($) {
        this.alt = rep($('seq'), rgx(/\s+\/\s+/)).as('any');
        this.seq = rep(any($('exc'), $('trm')), rgx(/\s+/)).as('seq');
        this.exc = seq($('trm'), rgx(/\s+~\s+/), $('trm')).map({ lhs: 0, rhs: 2 }).as('exc');
        this.atm = any($('txt'), $('grp'), $('chr'), $('ref'));
        this.txt = any(str('"', '"'), str("'", "'")).as('txt');
        this.chr = str('[', ']').text().as('rgx');
        this.ref = rgx(/[a-z]+/i).as('ref');
        this.trm = any(
            seq($('lbl'), txt(':'), $('trm')).then(function (r) { r[2].lbl = r[0]; return r[2]; }),
            seq(txt('&'), $('trm')).select(1).as('not').as('not'),
            seq(txt('!'), $('trm')).select(1).as('not'),
            seq($('atm'), txt('?')).select(0).as('opt'),
            seq($('atm'), $('qtf')).then(function (r) { r[1].rep = r[0]; return r[1]; }),
            $('atm'));
        this.grp = seq(txt('('), $('def'), txt(')'), opt(seq(txt('.'), $('lbl')).select(1))).map({ def: 1, key: 3 });
        this.qtf = seq(opt($('sep')), any(txt('+').make(1), txt('*').make(0))).map({ sep: 0, min: 1 });
        this.sep = seq(txt('<'), $('def'), txt('>')).select(1);
        this.lbl = rgx(/[a-z0-9]+/i);
        this.def = $('alt');
    });

    PEG.prototype = Pattern.prototype;

    function compose(name, define) {
        var rules = {};

        define.call(rules, function (name) {
            return rules[name] || new Pattern(name, function (str, pos) {
                return rules[name].exec(str, pos);
            });
        });

        return rules[name];
    }

    function str(lq, rq) {
        var chr = any(
            seq(txt('\\'), txt(lq)).select(1),
            seq(txt('\\'), txt(rq)).select(1),
            exc(rgx(/[\u0000-\uffff]/), txt(rq)));

        return seq(txt(lq), opt(rep(chr), []).merge(), txt(rq)).select(1);
    }

    function not(pattern) {
        return new Pattern('!' + pattern, function (str, pos) {
            return !pattern.exec(str, pos) && { res: void 0, end: pos };
        });
    }

    if (typeof module != typeof void 0)
        module.exports = PEG; // for Node
    
    if (typeof window != typeof void 0)
        window.LLKP.PEG = PEG; // for browsers
})();
