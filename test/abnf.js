var assert = require('assert');
var ABNF = require('../abnf');

suite('ABNF', function () {
    'use strict';

    suite('toString', function () {
        test('text', function () {
            var p = new ABNF('"123"');
            assert.equal(p, '"123"');
        });
    });

    test('instanceof', function () {
        var p = new ABNF('"111"');
        assert(p instanceof ABNF);
    });

    suite('BasicParsing', function () {
        function chk(abnf, text, expected) {
            return function () {
                var pattern = abnf instanceof ABNF ? abnf : new ABNF(abnf);
                var r = pattern.exec(text);

                assert.deepEqual(r, expected);
            };
        }

        test('1', chk('""', '', ''));
        test('2', chk('"abc"', 'abc', 'abc'));
        test('3', chk('"abc" "123" "xyz"', 'abc123xyz', ['abc', '123', 'xyz']));
        test('4', chk('""', 'a', null));
        test('5', chk('"123" "" "" ""', '123', ['123', '', '', '']));
        test('6', chk('"" "" "" "123"', '123', ['', '', '', '123']));
        test('7', chk('"123" "" "456"', '123456', ['123', '', '456']));
        test('8', chk('"123"', '456', null));
        test('9', chk('"123"', '1234', null));
        test('10', chk('"qwerty"', 'qwerty', 'qwerty'));
        test('11', chk('""', '', ''));
        test('12', chk('"qqq"', 'qqq www', null));
        test('13', chk('1*{" "}("abc" / <def> / \'ghi\')', 'abc ghi def', ['abc', 'ghi', 'def']));
        test('14', chk('("abc" "123") "456"', 'abc123456', [['abc', '123'], '456']));
        test('15', chk('"123" "abc" / "123" "def"', '123def', ['123', 'def']));
        test('16', chk('"qq" "ww" "rr"', 'qqwwrr', ['qq', 'ww', 'rr']));
        test('17', chk('"qq" "ww" "rr"', 'qqrrww', null));
        test('18', chk('*("1" / "2" / "3" / "4")', '4321', ['4', '3', '2', '1']));
        test('19', chk('*?("1" / "2" / "3") "45"', '12345', [['1', '2', '3'], '45']));

        test('20', function () {
            var pattern = new ABNF('"Q" PLUS "Q" / "W"', { 'PLUS': /\s*\+\s*/ });
            assert.equal(pattern.exec('W'), 'W');
            assert.deepEqual(pattern.exec('Q + Q'), ['Q', ' + ', 'Q']);
        });

        test('21', chk('"q" / "w" / "r"', 'q', 'q'));
        test('22', chk('"q" / "w" / "r"', 'w', 'w'));
        test('23', chk('"q" / "w" / "r"', 'r', 'r'));
        test('24', chk('"q" / "w" / "r"', 't', null));
        test('25', chk('"q" "w" / "v" "t"', 'qw', ['q', 'w']));
        test('26', chk('"q" "w" / "v" "t"', 'vt', ['v', 't']));
        test('27', chk('"q" "w" / "v" "t"', 'qt', null));
        test('28', chk('?"abc" "def"', 'def', [void 0, 'def']));
        test('29', chk('?"a"', 'a', 'a'));
        test('30', chk('?"a"', '', void 0));
        test('31', chk('?"a" "b"', 'b', [void 0, 'b']));
        test('32', chk('"123" ?"456" "789" ?"abc"', '123789', ['123', void 0, '789', void 0]));
        test('33', chk('??"abc"', 'abc', 'abc'));
        test('34', chk('??"abc" "def"', 'def', [void 0, 'def']));
        test('35', chk('"abc" ??????????????????????"123"', 'abc', ['abc', void 0]));
        test('36', chk('*("e" "f" / ?("a" "b" / "c" "d"))', 'efef', [['e', 'f'], ['e', 'f']]));
        test('37', chk('["1" "2"]', '12', ['1', '2']));
        test('38', chk('["1" "2"]', '', void 0));
        test('39', chk('["1" "2"] "3" "4"', '34', [void 0, '3', '4']));
        test('40', chk('*(["1" "2"] ["3" "4"])', '3412', [[void 0, ['3', '4']], [['1', '2'], void 0]]));
        test('41', chk('[<abc>]', 'abc', 'abc'));
        test('42', chk('[<abc> / <def>]', 'def', 'def'));
        test('43', chk('?"qqq"', 'qqq', 'qqq'));
        test('44', chk('?"qqq"', '', void 0));
        test('45', chk('[(<https>/<http>) <:>] <//>', 'http://', [['http', ':'], '//']));
        test('46', chk('%x31', '1', '1'));
        test('47', chk('%x0', '\u0000', '\u0000'));
        test('48', chk('%x00000000000', '\u0000', '\u0000'));
        test('49', chk('1*%x30-39', '17628', ['1', '7', '6', '2', '8']));
        test('50', chk('1*%x00-ff', '123', ['1', '2', '3']));
        // that's a weird test, but it passes somehow
        test('51', chk('1*%x0-ffffffff', '\u1234\u3456\u4567', ['\u1234', '\u3456', '\u4567']));
        test('52', chk('%x30 %x31 %x32', '012', ['0', '1', '2']));
        test('53', chk('*%x30-39 *%x61-7a', '123abc', [['1', '2', '3'], ['a', 'b', 'c']]));
        test('54', chk('%x123', 'q', null));
        test('55', chk('%x30-39', '5', '5'));
        test('56', chk('%x30-39', 'Q', null));
        test('57', chk('%x30', '0', '0'));
        test('58', chk('%x30', '1', null));
        test('59', chk('%d48-57', '7', '7'));
        test('60', chk('%d48-57', 'Q', null));
        test('61', chk('%d49', '1', '1'));
        test('62', chk('%d49', '2', null));
        test('63', chk('%b110000-111001', '8', '8'));
        test('64', chk('%b110000-111001', 'E', null));
        test('65', chk('%b110001', '1', '1'));
        test('66', chk('%b110001', '2', null));
        test('67', chk('.', '.', '.'));
        test('68', chk('.', '', null));
        test('69', chk('.', '11', null));
        test('70', chk('...', '123', ['1', '2', '3']));
        test('71', chk('2*5.', '12345', ['1', '2', '3', '4', '5']));
        test('72', chk('1*.', '', null));
        test('73', chk('3*.', 'ab', null));
        test('74', chk('2*3(3*5.)', '123456789', [['1', '2', '3', '4', '5'], ['6', '7', '8', '9']]));
        test('75', chk('2*3(6*7.)', '123456789', null));
        test('76', chk('.', 'Q', 'Q'));
        test('77', chk('...', '123', ['1', '2', '3']));
        test('78', chk('*.', '', []));
        test('79', chk('1*.', '12345', ['1', '2', '3', '4', '5']));
        test('80', chk('1*.', '', null));
        test('81', chk('<A> ~ <B>', 'A', 'A'));
        test('82', chk('<A> ~ <B>', 'B', null));
        test('83', chk('. ~ <W>', '5', '5'));
        test('84', chk('. ~ <W>', 'W', null));
        test('85', chk('*(. ~ <">)', '123', ['1', '2', '3']));
        test('86', chk('*{<">}(*(. ~ <">))', '123"456', [['1', '2', '3'], ['4', '5', '6']]));
        test('87', chk('<"> *(<`"> / . ~ <">) <">', '"123"', ['"', ['1', '2', '3'], '"']));
        test('88', chk('<"> *(<`"> / . ~ <">) <">', '"1`"23"', ['"', ['1', '`"', '2', '3'], '"']));
        test('89', chk('<"> *(<`"> / . ~ <">) <">', '"123', null));
        test('90', chk('. ~ (<A> / <B> / <C>)', 'A', null));
        test('91', chk('. ~ (<A> / <B> / <C>)', 'B', null));
        test('92', chk('. ~ (<A> / <B> / <C>)', 'C', null));
        test('93', chk('. ~ (<A> / <B> / <C>)', 'Q', 'Q'));
        test('94', chk('1*{<A> / <B> / <C>}(1*(. ~ (<A> / <B> / <C>)))', '123A456B789C0',
            [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["0"]]));

        test('95', function () {
            var number = new ABNF('?sign 1*digit', {
                'sign': '"+" / "-"',
                'digit': new ABNF('%x30-39')
            });

            assert.deepEqual(number.exec('-123'), ['-', ['1', '2', '3']]);
            assert.deepEqual(number.exec('456'), [void 0, ['4', '5', '6']]);
        });

        test('96', chk('*%x30-39', '12345', ['1', '2', '3', '4', '5']));
        test('97', chk('*%x30-39', '123abc', null));
        test('98', chk('3*%x30-39', '12345', ['1', '2', '3', '4', '5']));
        test('99', chk('3*%x30-39', '12', null));
        test('100', chk('*3%x30-39', '12345', null));
        test('101', chk('*3%x30-39', '123', ['1', '2', '3']));
        test('102', chk('2*3%x30-39', '1', null));
        test('103', chk('2*3%x30-39', '123', ['1', '2', '3']));
        test('104', chk('2*3%x30-39', '12345', null));

        test('105', chk('*(*%x30-39 *%x61-7A)', '123abc456def',
            [[['1', '2', '3'], ['a', 'b', 'c']],
             [['4', '5', '6'], ['d', 'e', 'f']]]));

        test('106', chk('*"q"', '', []));
        test('107', chk('*"q"', 'qqq', ['q', 'q', 'q']));
        test('108', chk('*"q"', 'www', null));
        test('109', chk('2*"1"', '', null));
        test('110', chk('2*"1"', '1', null));
        test('111', chk('2*"1"', '11', ['1', '1']));
        test('112', chk('2*"1"', '11111', ['1', '1', '1', '1', '1']));
        test('113', chk('2*"1"', '2222', null));
        test('114', chk('*2"1"', '', [], 0));
        test('115', chk('*2"1"', '1', ['1']));
        test('116', chk('*2"1"', '11', ['1', '1']));
        test('117', chk('*2"1"', '111', null));
        test('118', chk('*2"1"', '2222', null));
        test('119', chk('2*3"1"', '', null));
        test('120', chk('2*3"1"', '1', null));
        test('121', chk('2*3"1"', '11', ['1', '1']));
        test('122', chk('2*3"1"', '111', ['1', '1', '1']));
        test('123', chk('2*3"1"', '1111', null));
        test('124', chk('2*3"1"', '222', null));

        suite('RepetitionWithASeparator', function () {
            function chk2(abnf, text, expected) {
                return function () {
                    var pattern = new ABNF(abnf, {
                        'num': new ABNF(/\d+/).then(function (str) { return +str }),
                        'var': /[a-zA-Z]\w+/
                    });

                    chk(pattern, text, expected);
                }
            };

            test(1, chk2('*{";"}num', '123', [123]));
            test(2, chk2('*{";"}num ";" var', '123;abc', [[123], ';', 'abc']));
            test(3, chk2('*3{";"}num ";" num', '123;456;789;111', [[123, 456, 789], ';', 111]));
            test(4, chk2('*{*%x20 ";" *%x20}num', '123;  456  ;  789', [123, 456, 789]));
            test(5, chk2('*{";"}(2{"="}num)', '11=22;33=44;55=66', [[11, 22], [33, 44], [55, 66]]));
            test(6, chk2('1*{";"}%x30-39', '1;2;3;4;5', ['1', '2', '3', '4', '5']));
            test(7, chk2('1*{";"}%x30-39 ";" 1*"A"', '1;2;3;AAA', [['1', '2', '3'], ';', ['A', 'A', 'A']]));
        });

        suite('ExactRepetition', function () {
            var p = new ABNF('5digit', { 'digit': '%x30-39' });

            test(1, chk(p, '12345', ['1', '2', '3', '4', '5']));
            test(2, chk(p, '1234', null));
            test(3, chk(p, '123456', null));

            test(4, chk('3%x30-39', '', null));
            test(5, chk('3%x30-39', 'qqq', null));
            test(6, chk('3%x30-39', '123', ['1', '2', '3']));
            test(7, chk('3%x30-39', '12', null));
            test(8, chk('3%x30-39', '1234', null));
        });
    });

    suite('Usage', function () {
        test('New', function () {
            var p = new ABNF('1*digit', { 'digit': '%x30-39' });
            var r = p.exec('123');

            assert.deepEqual(r, ['1', '2', '3']);
            assert(p instanceof ABNF);
        });

        test('CustomPattern', function () {
            var p = new ABNF('1*{";"}number', {
                'number': function (str, pos) {
                    var end = pos;
                    while (/[0-9]/.test(str.charAt(end)))
                        end++;
                    return { res: +str.slice(pos, end), end: end };
                }
            });

            var s = '123;4567;8;90';
            var r = p.exec(s);

            assert.deepEqual(r, [123, 4567, 8, 90]);
        });

        test('NamedRules', function () {
            var p = new ABNF('1*{1*wsp}number', function (rule) {
                this.wsp = /\x20/;
                this.number = rule('1*digit').merge().then(function (r) { return +r });
                this.digit = /[0-9]/;
            });

            assert.deepEqual(
                p.exec('123   456  789'),
                [123, 456, 789]);
        });

        test('UndefinedRule', function () {
            assert.throws(
                function () { return new ABNF('name "=" value') },
                'SyntaxError: Rule is not defined: name');
        });
    });

    suite('Transforms', function () {
        function check(pattern, samples) {
            var input, output, r;

            for (input in samples) {
                output = samples[input];
                r = pattern.exec(input);
                assert.deepEqual(r, output);
            }
        }

        test('CustomOuter', function () {
            var p = new ABNF('1*%x30-39').then(function (r) { return +r.join('') });
            check(p, {
                '123': 123,
                '000': 0,
                'abc': null
            });
        });

        test('CustomInner', function () {
            var p = new ABNF('1*digit', function (rule) {
                this.digit = rule('%x30-39').then(function (r) {
                    return String.fromCharCode('A'.charCodeAt(0) + r.charCodeAt(0) - '0'.charCodeAt(0));
                });
            }).merge();

            check(p, {
                '123': 'BCD',
                '000': 'AAA',
                'abc': null
            });
        });

        test('Text', function () {
            var p = new ABNF('1*{";"}attr', {
                attr: new ABNF('token "=" token', { token: /\w+/ }).text(),
            });

            check(p, {
                'a=b;c=d': ['a=b', 'c=d'],
                'q=p': ['q=p'],
                'ww': null,
                '': null
            });

            check(new ABNF('?"qqq"').text(), {
                '': '',
                'qqq': 'qqq'
            });
        });

        test('Flatten', function () {
            var p = new ABNF('expr', function (rule) {
                this.expr = rule('"(" *{sep}(num / name / expr) ")"').select(1);
                this.num = rule(/\d+/).then(function (r) { return +r });
                this.name = /[a-zA-Z]+/;
                this.sep = /\s*,\s*/;
            });

            check(p.flatten(), {
                '()': [],
                '(1)': [1],
                '(1, 2, 3)': [1, 2, 3],
                '(1, 2, (3, 4), (5, 6, 7), 8)': [1, 2, 3, 4, 5, 6, 7, 8],
                '((1), (2, (3, (4, (5, 6, 7), (), ())), 8, 9))': [1, 2, 3, 4, 5, 6, 7, 8, 9],
                '(add, 2, (sub, (4, (f, (4, 3, 1, (sin, 4), (cos, 5), ())))))': ['add', 2, 'sub', 4, 'f', 4, 3, 1, 'sin', 4, 'cos', 5],
                '(((': null,
                '(sin 5)': null
            });
        });

        test('As', function () {
            check(new ABNF('1*%x30-39').as('num'), {
                '123': { num: ['1', '2', '3'] },
                'qwe': null
            });
        });

        test('Merge', function () {
            check(new ABNF('*%x30-39').merge(), {
                '123': '123',
                '': '',
                'qwe': null
            });

            check(new ABNF('"aaa" ?"bbb" "ccc"').merge(), {
                'aaaccc': 'aaaccc',
                'aaabbbccc': 'aaabbbccc',
                'q': null
            });
        });

        test('Join', function () {
            var p = new ABNF('1*{";"}attr', {
                attr: new ABNF('key "=" val', {
                    key: /\w+/,
                    val: new ABNF(/\d+/).then(function (r) { return +r })
                }).map({ k: 0, v: 2 })
            }).join('k', 'v');

            check(p, {
                'a=1': { a: 1 },
                'a=1;b=2': { a: 1, b: 2 },
                'a=1;a=2': { a: 2 }, // a=1 was overriden
                'a=1;b=2;c=3': { a: 1, b: 2, c: 3 },
                'qqq=': null,
                '': null,
                '=222': null,
                'a=1;b': null
            });
        });

        suite('Select', function () {
            test('SingleByIndex', function () {
                var p = ABNF('1*{" "}(1*%x30-39)');

                check(p.select(1), {
                    '123 456 789': ['4', '5', '6'],
                    '123': undefined,
                    '': null
                });
            });

            test('NamedMapping', function () {
                var p = ABNF('*{";"}num', {
                    num: ABNF(/\d+/).parseInt()
                });

                check(p.map({ a: 0, b: 1, c: 2 }), {
                    '1;2;3': { a: 1, b: 2, c: 3 },
                    '1': { a: 1, b: undefined, c: undefined },
                    'aaa': null
                });
            });
        });
    });

    suite('Extras', function () {
        suite('QuotedString', function () {
            var qsp;

            setup(function () {
                qsp = ABNF('<"> *(escaped / . ~ <">) <">', {
                    escaped: ABNF('%x5c .').select(1)
                }).select(1).merge();
            });

            test('Empty', function () {
                assert.equal(qsp.exec('""'), '');
            });

            test('Simple', function () {
                assert.equal(qsp.exec('"qwerty"'), 'qwerty');
            });

            test('Escaped', function () {
                assert.equal(qsp.exec('"abc\\"123\\"def"'), 'abc"123"def');
            });
        });

        suite('ArithmeticExpression', function () {
            var Expression;

            setup(function () {
                Expression = function (text) {
                    return Expression.pattern.exec(text + '');
                }

                Expression.pattern = ABNF('expr', function (rule) {
                    this['expr'] = rule('?un-op term *(bin-op term) wsp');
                    this['un-op'] = rule('wsp (<+> / <->) wsp').select(1);
                    this['bin-op'] = rule('wsp (<+> / <-> / <*> / </> / <^>) wsp').select(1);
                    this['term'] = rule('diff-term / norm-term');
                    this['norm-term'] = rule('number / func-call / var-name / group');
                    this['diff-term'] = rule('norm-term 1*diff').select({ expr: 0, diff: 1 });
                    this['diff'] = rule('<\'> var-name').select(1);
                    this['number'] = rule(/\d+(\.\d+)?/).then(parseFloat);
                    this['func-call'] = rule('func-name func-diff wsp term').select({ func: 0, diff: 1, arg: 3 });
                    this['func-diff'] = rule(/'*/).then(function (r, s) { return s.length }),
                    this['var-name'] = /[a-z]+/;
                    this['func-name'] = /[a-z]+/;
                    this['group'] = rule('<(> expr <)>').select(1);
                    this['wsp'] = /\s*/;
                });
            });

            test('Parsing', function () {
                assert(Expression('1 + 2 - 4*5/7 - 9 + 11'));
                assert(Expression('-11 + 22'));
                assert(Expression('12.345*(-11.22 + 33.44)'));
                assert(Expression('sin(11.22)'));
                assert(Expression('sin(pi/4) - cos(pi/2)'));
                assert(Expression('f(g(h(x)))'));
                assert(Expression('sin cos x + cos sin y / 2'));
                assert(Expression('-1 + 33^22*2^3^4 - 4*5/7 - 9 + 11'));
                assert(Expression("sin x'x + sin(x)'x + (sin x)'x"));
                assert(Expression("(x + y)'x + (cos(x)/sin(z))'y"));
                assert(Expression("(sin(x*y*z))'x'y'z"));
                assert(Expression("sin''z * cos'(y*x)"));
            });
        });

        suite('URI', function () {
            var URI;

            setup(function () {
                URI = function (text) {
                    var part, ast, r;

                    if (!(this instanceof URI))
                        return new URI(text);

                    r = URI.pattern.exec(text);
                    if (!r) throw new SyntaxError('Invalid URI: ' + text);

                    ast = r;

                    function bind(name) {
                        return function (value) {
                            return arguments.length == 0 ? ast[name] : (ast[name] = value, this)
                        };
                    }

                    this.scheme = bind('scheme');
                    this.user = bind('user');
                    this.host = bind('host');
                    this.port = bind('port');
                    this.path = bind('path');
                    this.query = bind('query');
                    this.hash = bind('hash');
                }

                URI.prototype.toString = function () {
                    function prefixed(prefix, value) { return value ? prefix + value : '' }

                    var authority = (!this.user() ? '' : this.user() + '@') + (this.host() || '') + prefixed(':', this.port());

                    return (this.scheme() ? this.scheme() + ':' : '') +
                        prefixed('//', authority) + this.path() +
                        prefixed('?', this.query()) +
                        prefixed('#', this.hash());
                };

                URI.pattern = ABNF('[scheme ":"] ["//" [user "@"] host [":" port]] path ["?" query] ["#" hash]', function (rule) {
                    this.query = /[^#]*/;
                    this.scheme = /[a-zA-Z][\w+-.]*/;
                    this.host = /[^:/?#]*/;
                    this.path = /[^?#]*/;
                    this.user = /[^@]*/;
                    this.port = /\d*/;
                    this.hash = /.*/;
                }).then(function (r) {
                    return {
                        scheme: r[0] && r[0][0],
                        user: r[1] && r[1][1] && r[1][1][0],
                        host: r[1] && r[1][2],
                        port: r[1] && r[1][3] && r[1][3][1],
                        path: r[2],
                        query: r[3] && r[3][1],
                        hash: r[4] && r[4][1]
                    };
                });
            });

            test('ChangeURI', function () {
                var uri = URI('https://lync.contoso.com:443/ucwa/me?context=123');

                assert.equal(uri, 'https://lync.contoso.com:443/ucwa/me?context=123');
                assert.equal(uri.scheme('http'), 'http://lync.contoso.com:443/ucwa/me?context=123');
                assert.equal(uri.host('contoso'), 'http://contoso:443/ucwa/me?context=123');
                assert.equal(uri.port(''), 'http://contoso/ucwa/me?context=123');
                assert.equal(uri.path(''), 'http://contoso?context=123');
                assert.equal(uri.hash('abcdef'), 'http://contoso?context=123#abcdef');
            });

            test('QueryOnly', function () {
                assert.equal(URI('?message=how are you?').query(), 'message=how are you?');
            });

            test('PathWithQuery', function () {
                var str = '/ucwa/oauth/v1/applications/11612396973/people/contacts?groupId=qwerty=';
                var uri = URI(str);
                assert.equal(uri, '/ucwa/oauth/v1/applications/11612396973/people/contacts?groupId=qwerty=');
                assert.equal(uri.path(), '/ucwa/oauth/v1/applications/11612396973/people/contacts');
                assert.equal(uri.query(), 'groupId=qwerty=');
            });

            test('rel=user', function () {
                var uri = URI('https://contoso.com/Autodiscover/AutodiscoverService.svc/root/oauth/user?originalDomain=contoso.com');

                assert.equal(uri.scheme(), 'https');
                assert.equal(uri.host(), 'contoso.com');
                assert.equal(uri.path(), '/Autodiscover/AutodiscoverService.svc/root/oauth/user');
                assert.equal(uri.query(), 'originalDomain=contoso.com');

                uri.query('');
                uri.scheme(null);
                uri.port(81);
                uri.hash('tag');

                assert.equal(uri, '//contoso.com:81/Autodiscover/AutodiscoverService.svc/root/oauth/user#tag');
            });

            test('FTP', function () {
                var str = 'ftp://cnn.example.com&story=breaking_news@10.0.0.1/top_story.htm';
                var uri = URI(str);

                assert.equal(uri, str);
                assert.equal(uri.scheme(), 'ftp');
                assert.equal(uri.user(), 'cnn.example.com&story=breaking_news');
                assert.equal(uri.host(), '10.0.0.1');
                assert.equal(uri.path(), '/top_story.htm');

                assert.equal(uri.user(''), 'ftp://10.0.0.1/top_story.htm');
            });

            test('DataURI', function () {
                var str = 'data:text/plain;charset="utf-8";tag=123;base64,72364728';
                var uri = URI(str);

                assert.equal(uri, str);
            });
        });

        suite('Data-URL', function () {
            var DataURL;

            setup(function () {
                DataURL = function (text) {
                    if (!(this instanceof DataURL))
                        return new DataURL(text);

                    var r = DataURL.pattern.exec(text);
                    if (!r) throw new SyntaxError('Invalid data URL: ' + text);

                    this.mime = function () { return r.mime || '' };
                    this.data = function () { return r.data || '' };
                }

                DataURL.decodeData = function (data) {
                    return decodeURIComponent(data.replace(/\+/g, '%20'));
                };

                DataURL.encodeData = function (data) {
                    return encodeURIComponent(data).replace(/%20/g, '+');
                };

                DataURL.pattern = ABNF('data-url', function (rule) {
                    this['data-url'] = rule('scheme ?wsp ?mime ?wsp attributes ?wsp "," ?wsp data').map({ mime: 2, attrs: 4, data: 8 });
                    this['attributes'] = rule('*attr').join('akey', 'aval');
                    this['attr'] = rule('?wsp ";" ?wsp token ?attr-val').map({ akey: 3, aval: 4 });
                    this['attr-val'] = rule('?wsp "=" ?wsp (token / str)').select(3);
                    this['str'] = rule('<"> *(escaped / . ~ <">) <">').select(1).merge();
                    this['escaped'] = rule('%x5c .').select(1);
                    this['scheme'] = /\s*data\s*:\s*/;
                    this['token'] = /[^=;,"]+/;
                    this['wsp'] = /\s+/;
                    this['mime'] = /[-\w]+\/[-\w]+/;
                    this['data'] = rule(/.*/).then(DataURL.decodeData);
                });
            });

            test('Empty', function () {
                var uri = DataURL('data:,');
                assert.equal(uri.mime(), '');
                assert.equal(uri.data(), '');
            });

            test('Message', function () {
                var du = DataURL('data:text/plain;charset=utf-8,how+are+you%3F');
                assert.equal(du.mime(), 'text/plain');
                assert.equal(du.data(), 'how are you?');
            });

            test('QuotedAttr', function () {
                var du = DataURL('data:;charset="utf-8",how+are+you%3F');
                assert.equal(du.data(), 'how are you?');
            });

            test('EmptyQuotedAttr', function () {
                var du = DataURL('data:;charset="",how+are+you%3F');
                assert.equal(du.data(), 'how are you?');
            });

            test('QuotedAttrWithEscapedQuotes', function () {
                var du = DataURL('data:;charset="abc \\" def",how+are+you%3F');
                assert.equal(du.data(), 'how are you?');
            });

            test('QuotedAttrWithEscapedBackslash', function () {
                var du = DataURL('data:;charset="abc \\\\ def",how+are+you%3F');
                assert.equal(du.data(), 'how are you?');
            });

            test('AttrsWithoutValue', function () {
                var du = DataURL('data:;charset;base64,how+are+you%3F');
                assert.equal(du.data(), 'how are you?');
            });

            test('ExtraSpaces', function () {
                var du = DataURL('   data   :   text/html ;  charset  =   utf-8  ;   base64   ,how+are+you%3F');
                assert.equal(du.mime(), 'text/html');
                assert.equal(du.data(), 'how are you?');
            });

            test('SDP', function () {
                var uri = DataURL('data:application/sdp;charset=utf-8;es="";tag="1\\"2\\\\3";base64,how+are+you%3f');
                assert.equal(uri.mime(), 'application/sdp');
                assert.equal(uri.data(), 'how are you?');
            });
        });

        suite('WWW-Auth', function () {
            var WWWAuth;

            setup(function () {
                WWWAuth = function (text) {
                    var r = WWWAuth.pattern.exec(text + '');
                    if (r) return r;
                    throw new SyntaxError('Invalid WWW-Authenticate header:\n' + text);
                };

                WWWAuth.pattern = ABNF('www-auth', function (rule) {
                    this['www-auth'] = rule('*{ch-sep}challenge').join('name', 'attrs');
                    this['challenge'] = rule('name wsp attributes').map({ name: 0, attrs: 2 });
                    this['attributes'] = rule('*{attr-sep}(name eq (name / quoted-str))').join(0, 2);
                    this['name'] = /[^,;="'\s]+/;
                    this['ch-sep'] = /[,\s]*/;
                    this['attr-sep'] = /\s*,\s*/;
                    this['wsp'] = /\s*/;
                    this['eq'] = /\s*=\s*/;
                    this['quoted-str'] = rule('<"> *(escaped-char / . ~ <">) <">').select(1).merge();
                    this['escaped-char'] = rule('%x5c .').select(1);
                });
            });

            test('Sample', function () {
                var auth = WWWAuth('Digest username="Mufasa", realm="testrealm@host.com",nonce="12",uri="/dir/index.html",qop=auth,nc=2,cnonce="3",response="44",opaque="55"' +
                    'Basic realm="testrealm@host.com",nonce="12",uri="/dir/index.html",qop=auth,nc=2,cnonce="3",response="44",opaque="55", NTLM, Negotiate');

                assert.equal(auth.Digest.username, 'Mufasa');
                assert.equal(auth.Digest.realm, 'testrealm@host.com');
                assert.equal(auth.Basic.realm, 'testrealm@host.com');
                assert(auth.NTLM);
                assert(auth.Negotiate);
            });
        });

        test('ABNF', function () {
            // this is what needs to be parsed (ABNF of ABNF taken from RFC 5234)
            var s =
                'rulelist       =   1*( rule / (*c-wsp c-nl) )' + '\n' +
                'rule           =  rulename defined-as elements c-nl' + '\n' +
                'rulename       =  ALPHA *(ALPHA / DIGIT / "-")' + '\n' +
                'defined-as     =  *c-wsp ("=" / "=/") *c-wsp' + '\n' +
                'elements       =  alternation *c-wsp' + '\n' +
                'c-wsp          =  WSP / (c-nl WSP)' + '\n' +
                'c-nl           =  comment / CRLF' + '\n' +
                'comment        =  ";" *(WSP / VCHAR) CRLF' + '\n' +
                'alternation    =  concatenation *(*c-wsp "/" *c-wsp concatenation)' + '\n' +
                'concatenation  =  repetition *(1*c-wsp repetition)' + '\n' +
                'repetition     =  [repeat] element' + '\n' +
                'repeat         =  1*DIGIT / (*DIGIT "*" *DIGIT)' + '\n' +
                'element        =  rulename / group / option / char-val / num-val / prose-val' + '\n' +
                'group          =  "(" *c-wsp alternation *c-wsp ")"' + '\n' +
                'option         =  "[" *c-wsp alternation *c-wsp "]"' + '\n' +
                'char-val       =  DQUOTE *(%x20-21 / %x23-7E) DQUOTE' + '\n' +
                'num-val        =  "%" (bin-val / dec-val / hex-val)' + '\n' +
                'bin-val        =  "b" 1*BIT [ 1*("." 1*BIT) / ("-" 1*BIT) ]' + '\n' +
                'dec-val        =  "d" 1*DIGIT [ 1*("." 1*DIGIT) / ("-" 1*DIGIT) ]' + '\n' +
                'hex-val        =  "x" 1*HEXDIG [ 1*("." 1*HEXDIG) / ("-" 1*HEXDIG) ]' + '\n' +
                'prose-val      =  "<" *(%x20-3D / %x3F-7E) ">"' + '\n' +
                'ALPHA          =  %x41-5A / %x61-7A' + '\n' +
                'BIT            =  "0" / "1"' + '\n' +
                'CHAR           =  %x01-7F' + '\n' +
                'CR             =  %x0D' + '\n' +
                'CRLF           =  CR LF' + '\n' +
                'CTL            =  %x00-1F / %x7F' + '\n' +
                'DIGIT          =  %x30-39' + '\n' +
                'DQUOTE         =  %x22' + '\n' +
                'HEXDIG         =  DIGIT / "A" / "B" / "C" / "D" / "E" / "F"' + '\n' +
                'HTAB           =  %x09' + '\n' +
                'LF             =  %x0A' + '\n' +
                'LWSP           =  *(WSP / CRLF WSP)' + '\n' +
                'OCTET          =  %x00-FF' + '\n' +
                'SP             =  %x20' + '\n' +
                'VCHAR          =  %x21-7E' + '\n' +
                'WSP            =  SP / HTAB';

            // this is the parser
            var p = ABNF('ABNF', function (rule) {
                this['ABNF'] = rule('1*{%x0a}rule-def').join('name', 'def');
                this['rule-def'] = rule('rule-name *wsp "=" *wsp alternation').map({ name: 0, def: 4 });
                this['rule-name'] = /[a-zA-Z][\w-]*\w/;
                this['alternation'] = rule('1*{*wsp "/" *wsp}concatenation').then(function (r) { return r.length > 1 ? { alt: r } : r[0] });
                this['concatenation'] = rule('1*{1*wsp}(repetition / element)').then(function (r) { return r.length > 1 ? { con: r } : r[0] });
                this['repetition'] = rule('repeat *wsp element').then(function (r) { return { min: r[0].min, max: r[0].max, rep: r[2] } });
                this['repeat'] = rule('min-max / exact');
                this['min-max'] = rule('?number "*" ?number').map({ min: 0, max: 2 });
                this['exact'] = rule('number').map({ min: 0, max: 0 });
                this['number'] = rule(/\d+/).parseInt(10);
                this['element'] = rule('rule-ref / group / option / char-val / num-val');
                this['rule-ref'] = rule('rule-name').as('ref');
                this['group'] = rule('"(" *wsp alternation *wsp ")"').select(2);
                this['option'] = rule('"[" *wsp alternation *wsp "]"').select(2).as('opt');
                this['char-val'] = rule('<"> *(%x20-21 / %x23-7e) <">').select(1).merge().as('str');
                this['num-val'] = rule('"%" (bin-val / dec-val / hex-val)').select(1);
                this['bin-val'] = rule('"b" bin-num ["-" bin-num]').then(function (r) { return { min: r[1], max: r[2] && r[2][1] } });
                this['dec-val'] = rule('"d" dec-num ["-" dec-num]').then(function (r) { return { min: r[1], max: r[2] && r[2][1] } });
                this['hex-val'] = rule('"x" hex-num ["-" hex-num]').then(function (r) { return { min: r[1], max: r[2] && r[2][1] } });
                this['bin-num'] = rule(/[0-1]+/).parseInt(2);
                this['dec-num'] = rule(/[0-9]+/).parseInt(10);
                this['hex-num'] = rule(/[0-9a-fA-F]+/).parseInt(16);
                this['wsp'] = rule('%x20');
            });

            // this is an AST that the parser is expected to produce
            var r = {
                rulelist: {
                    min: 1,
                    max: undefined,
                    rep: {
                        alt: [{ ref: 'rule' },
                              {
                                  con: [{ min: undefined, max: undefined, rep: { ref: 'c-wsp' } },
                                     { ref: 'c-nl' }]
                              }]
                    }
                },
                rule: {
                    con: [{ ref: 'rulename' },
                          { ref: 'defined-as' },
                          { ref: 'elements' },
                          { ref: 'c-nl' }]
                },
                rulename: {
                    con: [{ ref: 'ALPHA' },
                          {
                              min: undefined,
                              max: undefined,
                              rep: { alt: [{ ref: 'ALPHA' }, { ref: 'DIGIT' }, { str: '-' }] }
                          }]
                },
                'defined-as': {
                    con: [{ min: undefined, max: undefined, rep: { ref: 'c-wsp' } },
                          { alt: [{ str: '=' }, { str: '=/' }] },
                          { min: undefined, max: undefined, rep: { ref: 'c-wsp' } }]
                },
                elements: {
                    con: [{ ref: 'alternation' },
                          { min: undefined, max: undefined, rep: { ref: 'c-wsp' } }]
                },
                'c-wsp': { alt: [{ ref: 'WSP' }, { con: [{ ref: 'c-nl' }, { ref: 'WSP' }] }] },
                'c-nl': { alt: [{ ref: 'comment' }, { ref: 'CRLF' }] },
                comment: {
                    con: [{ str: ';' },
                          {
                              min: undefined,
                              max: undefined,
                              rep: { alt: [{ ref: 'WSP' }, { ref: 'VCHAR' }] }
                          },
                          { ref: 'CRLF' }]
                },
                alternation: {
                    con: [{ ref: 'concatenation' },
                          {
                              min: undefined,
                              max: undefined,
                              rep: {
                                  con: [{ min: undefined, max: undefined, rep: { ref: 'c-wsp' } },
                                        { str: '/' },
                                        { min: undefined, max: undefined, rep: { ref: 'c-wsp' } },
                                        { ref: 'concatenation' }]
                              }
                          }]
                },
                concatenation: {
                    con: [{ ref: 'repetition' },
                          {
                              min: undefined,
                              max: undefined,
                              rep: {
                                  con: [{ min: 1, max: undefined, rep: { ref: 'c-wsp' } },
                                        { ref: 'repetition' }]
                              }
                          }]
                },
                repetition: { con: [{ opt: { ref: 'repeat' } }, { ref: 'element' }] },
                repeat: {
                    alt: [{ min: 1, max: undefined, rep: { ref: 'DIGIT' } },
                          {
                              con: [{ min: undefined, max: undefined, rep: { ref: 'DIGIT' } },
                                 { str: '*' },
                                 { min: undefined, max: undefined, rep: { ref: 'DIGIT' } }]
                          }]
                },
                element: {
                    alt: [{ ref: 'rulename' },
                          { ref: 'group' },
                          { ref: 'option' },
                          { ref: 'char-val' },
                          { ref: 'num-val' },
                          { ref: 'prose-val' }]
                },
                group: {
                    con: [{ str: '(' },
                          { min: undefined, max: undefined, rep: { ref: 'c-wsp' } },
                          { ref: 'alternation' },
                          { min: undefined, max: undefined, rep: { ref: 'c-wsp' } },
                          { str: ')' }]
                },
                option: {
                    con: [{ str: '[' },
                          { min: undefined, max: undefined, rep: { ref: 'c-wsp' } },
                          { ref: 'alternation' },
                          { min: undefined, max: undefined, rep: { ref: 'c-wsp' } },
                          { str: ']' }]
                },
                'char-val': {
                    con: [{ ref: 'DQUOTE' },
                          {
                              min: undefined,
                              max: undefined,
                              rep: { alt: [{ min: 32, max: 33 }, { min: 35, max: 126 }] }
                          },
                          { ref: 'DQUOTE' }]
                },
                'num-val': {
                    con: [{ str: '%' },
                          { alt: [{ ref: 'bin-val' }, { ref: 'dec-val' }, { ref: 'hex-val' }] }]
                },
                'bin-val': {
                    con: [{ str: 'b' },
                          { min: 1, max: undefined, rep: { ref: 'BIT' } },
                          {
                              opt: {
                                  alt: [{
                                      min: 1,
                                      max: undefined,
                                      rep: {
                                          con: [{ str: '.' },
                                                { min: 1, max: undefined, rep: { ref: 'BIT' } }]
                                      }
                                  },
                                          {
                                              con: [{ str: '-' },
                                                 { min: 1, max: undefined, rep: { ref: 'BIT' } }]
                                          }]
                              }
                          }]
                },
                'dec-val': {
                    con: [{ str: 'd' },
                          { min: 1, max: undefined, rep: { ref: 'DIGIT' } },
                          {
                              opt: {
                                  alt: [{
                                      min: 1,
                                      max: undefined,
                                      rep: {
                                          con: [{ str: '.' },
                                                { min: 1, max: undefined, rep: { ref: 'DIGIT' } }]
                                      }
                                  },
                                          {
                                              con: [{ str: '-' },
                                                 { min: 1, max: undefined, rep: { ref: 'DIGIT' } }]
                                          }]
                              }
                          }]
                },
                'hex-val': {
                    con: [{ str: 'x' },
                          { min: 1, max: undefined, rep: { ref: 'HEXDIG' } },
                          {
                              opt: {
                                  alt: [{
                                      min: 1,
                                      max: undefined,
                                      rep: {
                                          con: [{ str: '.' },
                                                { min: 1, max: undefined, rep: { ref: 'HEXDIG' } }]
                                      }
                                  },
                                          {
                                              con: [{ str: '-' },
                                                 { min: 1, max: undefined, rep: { ref: 'HEXDIG' } }]
                                          }]
                              }
                          }]
                },
                'prose-val': {
                    con: [{ str: '<' },
                          {
                              min: undefined,
                              max: undefined,
                              rep: { alt: [{ min: 32, max: 61 }, { min: 63, max: 126 }] }
                          },
                          { str: '>' }]
                },
                ALPHA: { alt: [{ min: 65, max: 90 }, { min: 97, max: 122 }] },
                BIT: { alt: [{ str: '0' }, { str: '1' }] },
                CHAR: { min: 1, max: 127 },
                CR: { min: 13, max: undefined },
                CRLF: { con: [{ ref: 'CR' }, { ref: 'LF' }] },
                CTL: { alt: [{ min: 0, max: 31 }, { min: 127, max: undefined }] },
                DIGIT: { min: 48, max: 57 },
                DQUOTE: { min: 34, max: undefined },
                HEXDIG: {
                    alt: [{ ref: 'DIGIT' },
                          { str: 'A' },
                          { str: 'B' },
                          { str: 'C' },
                          { str: 'D' },
                          { str: 'E' },
                          { str: 'F' }]
                },
                HTAB: { min: 9, max: undefined },
                LF: { min: 10, max: undefined },
                LWSP: {
                    min: undefined,
                    max: undefined,
                    rep: { alt: [{ ref: 'WSP' }, { con: [{ ref: 'CRLF' }, { ref: 'WSP' }] }] }
                },
                OCTET: { min: 0, max: 255 },
                SP: { min: 32, max: undefined },
                VCHAR: { min: 33, max: 126 },
                WSP: { alt: [{ ref: 'SP' }, { ref: 'HTAB' }] }
            };

            assert.deepEqual(p.exec(s), r);
        });

        suite('Pairs', function () {
            test('A', function () {
                var pattern = ABNF('1*{","}pair', {
                    'pair': 'name "=" value',
                    'name': /[a-zA-Z][a-zA-Z0-9\-]+/,
                    'value': /[\w\-]+/
                });

                var results = pattern.exec('charset=utf-8,tag=123,doc-type=html');

                assert.deepEqual(results, [
                    ['charset', '=', 'utf-8'],
                    ['tag', '=', '123'],
                    ['doc-type', '=', 'html']
                ]);
            });

            test('B', function () {
                var pattern = ABNF('1*{","}pair', function (rule) {
                    this['name'] = /[a-zA-Z][a-zA-Z0-9\-]+/;
                    this['value'] = /[\w\-]+/;
                    this['pair'] = rule('name "=" value').map({ name: 0, value: 2 });
                });

                var results = pattern.exec('charset=utf-8,tag=123,doc-type=html');

                assert.deepEqual(results, [
                    { name: 'charset', value: 'utf-8' },
                    { name: 'tag', value: '123' },
                    { name: 'doc-type', value: 'html' }
                ]);
            });
        });

        test('JSON', function () {
            // The ABNF grammar of JSON was taken from RFC 4627.
            var pattern = ABNF('object / array', function (rule) {
                this['object'] = rule('<{> members <}>').select(1);
                this['members'] = rule('*{","}(string ":" value)').join(0, 2);
                this['array'] = rule('<[> *{","}value <]>').select(1);
                this['value'] = rule('object / array / number / string / false / true / null');
                this['false'] = rule('<false>').then(function () { return false });
                this['true'] = rule('<true>').then(function () { return true });
                this['null'] = rule('<null>').then(function () { return null });
                this['number'] = rule(/\-?\d+(\.\d+)?(e[+-]?\d+)?/).then(function (r, s) { return +s });
                this['string'] = rule('<"> *char <">').select(1).merge();
                this['char'] = rule('unescaped / escaped / encoded');
                this['unescaped'] = rule('%x20-21 / %x23-5b / %x5d-10FFFF');
                this['escaped'] = rule('%x5c (<"> / %x5c / "/" / "b" / "f" / "n" / "r" / "t" / "u")').select(1);
                this['encoded'] = rule(/\\u[a-fA-F0-9]{4}/).then(function (r, s) { return String.fromCharCode(+s.slice(2)) });
            });

            var source = [1, -2.34e-17, "123\r\n\u005c01234", false, true, null, [1, 2], {
                "a\u1234bc": [],
                "b": {},
                "c": [{}, {}]
            }];

            var string = JSON.stringify(source);
            var parsed = pattern.exec(string);

            assert(parsed);
        });

        test('XML', function () {
            var s =
                '<root attr-1="value-1" attr-2>' +
                    '<aaa x="1" y="2" z="3">' +
                        '<aaa-1>some text inside aaa-1</aaa-1>' +
                        '<aaa-empty p q="2 3 4" r/>' +
                    '</aaa>' +
                    '<empty-tag/>' +
                    '<empty-tag-with-attr attr-1/>' +
                    '<w1><w2><w3></w3></w2></w1>' +
                '</root>';

            // this is a simplified grammar of XML:
            var p = ABNF('node', function (rule) {
                this['node'] = rule('normal-node / empty-node');
                this['empty-node'] = rule('"<" name ?wsp ?attrs "/>"').map({ name: 1, attrs: 3 });
                this['normal-node'] = rule('"<" name ?wsp ?attrs ">" *(node / text) "</" name ">"')
                    .then(function (r) {
                        if (r[1] == r[7]) return r;
                        throw new SyntaxError('Invalid XML: ' + r[7] + ' does not match ' + r[1]);
                    })
                    .map({ name: 1, attrs: 3, subnodes: 5 });
                this['attrs'] = rule('1*{wsp}attr').join('name', 'value');
                this['value'] = rule('"=" str').select(1);
                this['attr'] = rule('name ?value').map({ name: 0, value: 1 });
                this['str'] = rule('<"> *(escaped / . ~ <">) <">').select(1).merge();
                this['escaped'] = rule('%x5c .').select(1);
                this['text'] = /[^<>]+/;
                this['name'] = /[a-zA-Z\-0-9\:]+/;
                this['wsp'] = /[\x00-\x20]+/;
            });

            assert.throws(
                function () { p.exec('<abc>123</def>') },
                'SyntaxError: Invalid XML: def does not match abc');

            assert.deepEqual(p.exec('<abc>123</abc>'), { name: 'abc', attrs: undefined, subnodes: ['123'] });

            var r = {
                name: 'root',
                attrs: { 'attr-1': 'value-1', 'attr-2': undefined },
                subnodes: [
                    {
                        name: 'aaa',
                        attrs: { x: '1', y: '2', z: '3' },
                        subnodes: [
                            {
                                name: 'aaa-1',
                                attrs: undefined,
                                subnodes: ['some text inside aaa-1']
                            },
                           {
                               name: 'aaa-empty',
                               attrs: { p: undefined, q: '2 3 4', r: undefined }
                           }
                        ]
                    },
                   { name: 'empty-tag', attrs: undefined },
                   { name: 'empty-tag-with-attr', attrs: { 'attr-1': undefined } },
                   {
                       name: 'w1',
                       attrs: undefined,
                       subnodes: [{
                           name: 'w2',
                           attrs: undefined,
                           subnodes: [{ name: 'w3', attrs: undefined, subnodes: [] }]
                       }]
                   }]
            };

            assert.deepEqual(p.exec(s), r);
        });

        test('SimpleXML', function () {
            var xmlp = ABNF('node', function (compile) {
                this.node = compile('open *(node / text) close').map({ tag: 0, nodes: 1 });
                this.open = compile('"<" name ">"').select(1);
                this.close = compile('"</" name ">"').select(1);
                this.name = /[^<>/]+/;
                this.text = /[^<>/]+/;
            });

            assert.deepEqual(xmlp.exec('<a><b>123</b><c>456</c></a>'), {
                tag: 'a', nodes: [
                    { tag: 'b', nodes: ['123'] },
                    { tag: 'c', nodes: ['456'] }
                ]
            });
        });

        test('UTF-8', function () {
            // this parser reads a string in which every character represents a byte
            // of a UTF-8 string and returns an array of unicode code-points
            var p = ABNF('1*char', function (rule) {
                this.char = rule('chr1 0byte / chr2 1byte / chr3 2byte / chr4 3byte / chr5 4byte').flatten().then(decode);
                this.byte = dint('%b10000000-10111111', 6);
                this.chr1 = dint('%b00000000-01111111', 7);
                this.chr2 = dint('%b11000000-11011111', 5);
                this.chr3 = dint('%b11100000-11101111', 4);
                this.chr4 = dint('%b11110000-11110111', 3);
                this.chr5 = dint('%b11111000-11111011', 2);

                function dint(abnf, bits) {
                    var mask = (1 << (bits + 1)) - 1;
                    return rule(abnf).then(function (r) {
                        return r.charCodeAt(0) & mask;
                    });
                }

                function decode(n) {
                    return n.length == 1 ? n[0] : n[n.length - 1] + 64 * decode(n.slice(0, -1));
                }
            });

            assert.deepEqual( // "A<NOT IDENTICAL TO><ALPHA>."
                p.exec('\x41\xE2\x89\xA2\xCE\x91\x2E'),
                [0x0041, 0x2262, 0x0391, 0x002E]);

            assert.deepEqual( // the Hangul characters for the Korean word "hangugo"
                p.exec('\xED\x95\x9C\xEA\xB5\xAD\xEC\x96\xB4'),
                [0xD55C, 0xAD6D, 0xC5B4]);

            assert.deepEqual( // the Han characters for the Japanese word "nihongo"
                p.exec('\xE6\x97\xA5\xE6\x9C\xAC\xE8\xAA\x9E'),
                [0x65E5, 0x672C, 0x8A9E]);

            assert.deepEqual( // the Cyrillic characters for the Russian phrase "Kak dela?"
                p.exec('\xD0\x9A\xD0\xB0\xD0\xBA\x20\xD0\xB4\xD0\xB5\xD0\xBB\xD0\xB0\x3F'),
                [1050, 1072, 1082, 32, 1076, 1077, 1083, 1072, 63]);
        });

        test('UTF-16', function () {
            // this parser reads a string in which every character represents a word (16 bits)
            // of a UTF-16 string and returns an array of unicode code-points
            var p = ABNF('1*(chr1 / chr2)', {
                chr1: ABNF('%x0000-d7ff / %xe000-ffff').then(function (s) {
                    return s.charCodeAt(0);
                }),
                chr2: ABNF('%xd800-dbff %xdc00-dfff').then(function (_, s) {
                    var w1 = s.charCodeAt(0) & 1023;
                    var w2 = s.charCodeAt(1) & 1023;
                    return 0x10000 + (w1 << 10) + w2;
                })
            });

            assert.deepEqual( // "<THE RA HIEROGLYPH>=Ra"
                p.exec('\uD808\uDF45\u003D\u0052\u0061'),
                [0x12345, 61, 82, 97]);

            assert.deepEqual( // "<MUSICAL SYMBOL G CLEF>"
                p.exec('\uD834\uDD1E'),
                [0x1D11E]);

            assert.deepEqual( // "<PRIVATE USE CHARACTER-10FFFD (last Unicode code point)>"
                p.exec('\uDBFF\uDFFD'),
                [0x10FFFD]);

            assert.deepEqual(
                p.exec('How are you?'),
                [72, 111, 119, 32, 97, 114, 101, 32, 121, 111, 117, 63]);

            assert.deepEqual( // the Cyrillic characters for the Russian phrase "Kak dela?"
                p.exec('\u041a\u0430\u043a\u0020\u0434\u0435\u043b\u0430\u003f'),
                [1050, 1072, 1082, 32, 1076, 1077, 1083, 1072, 63]);
        });
    });
});