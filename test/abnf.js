var assert = require('assert');
var ABNF = require('../abnf');

function forEach(dict, fn) {
    for (var key in dict)
        fn(dict[key], key);
}

function ptest(pattern, samples) {
    var rules = {
        'num': ABNF(/\d+/).parseInt(),
        'var': /[a-zA-Z]\w+/
    };

    if (arguments.length == 3) {
        rules = arguments[1];
        samples = arguments[2];
    }

    forEach(samples, function (expectedResult, input) {
        var testName = 'ABNF(' + pattern + ').exec(' + input + ') = ' + expectedResult;
        test(testName, function () {
            var result = ABNF(pattern, rules).exec(input);
            assert.deepEqual(result, expectedResult);
        });
    });
}

function psuite(name, patterns) {
    suite(name, function () {
        forEach(patterns, function (samples, pattern) {
            ptest(pattern, samples);
        });
    });
}

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
        psuite('DoubleQuotedText', {
            '""': {
                '': '',
                ' ': null,
                'a': null,
                '\n': null
            },

            '"abc"': {
                'abc': 'abc',
                'ab': null,
                'abcd': null,
                '': null
            },

            '"a" "b"': {
                'ab': ['a', 'b'],
                'a b': null,
                '': null
            }
        });

        psuite('SingleQuotedText', {
            "''": {
                '': '',
                ' ': null,
                'a': null,
                '\n': null
            },

            "'abc'": {
                'abc': 'abc',
                'ab': null,
                'abcd': null,
                '': null
            },

            "'a' 'b'": {
                'ab': ['a', 'b'],
                'a b': null,
                '': null
            }
        });

        psuite('Num', {
            '%x31': {
                '1': '1',
                '2': null,
                '': null
            },

            '%x5A': {
                'Z': 'Z',
                'z': null
            },

            '%x5a': {
                'Z': 'Z',
                'z': null
            },

            '%d49': {
                '1': '1',
                '2': null,
                '': null
            },

            '%b00110001': {
                '1': '1',
                '2': null,
                '': null
            }
        });

        psuite('NumRng', {
            '%x30-39': {
                '1': '1',
                '5': '5',
                '9': '9',
                '0': '0',
                'a': null,
                '@': null,
                '': null
            },

            '%d48-57': {
                '1': '1',
                '5': '5',
                '9': '9',
                '0': '0',
                'a': null,
                '@': null,
                '': null
            },

            '%b00110000-00111001': {
                '1': '1',
                '5': '5',
                '9': '9',
                '0': '0',
                'a': null,
                '@': null,
                '': null
            }
        });

        psuite('NumStr', {
            '%x31.32.33': {
                '123': '123',
                '456': null,
                '124': null,
                '': null
            },

            '%d49.50.51': {
                '123': '123',
                '456': null,
                '124': null,
                '': null
            },

            '%b00110001.00110010.00110011': {
                '123': '123',
                '456': null,
                '124': null,
                '': null
            }
        });

        psuite('NumStrRng', {
            '%x41-5A.61-7A.30-39': {
                'Rh8': 'Rh8',
                'Aa0': 'Aa0',
                'Zz9': 'Zz9',
                '@j7': null,
                'W#8': null,
                'Ws*': null,
                '': null
            },

            '%d65-90.97-122.48-57': {
                'Rh8': 'Rh8',
                'Aa0': 'Aa0',
                'Zz9': 'Zz9',
                '@j7': null,
                'W#8': null,
                'Ws*': null,
                '': null
            },

            '%b1000001-1011010.1100001-1111010.110000-111001': {
                'Rh8': 'Rh8',
                'Aa0': 'Aa0',
                'Zz9': 'Zz9',
                '@j7': null,
                'W#8': null,
                'Ws*': null,
                '': null
            }
        });

        psuite('RegExp', {
            '`\\d+`': {
                '123': '123',
                'asd': null,
                '': null
            },

            '1*{";"}(`[a-z]\\w*` "=" `\\d+`)': {
                'abc=123;def=456;ghi=789': [['abc', '=', '123'], ['def', '=', '456'], ['ghi', '=', '789']],
                'a=1': [['a', '=', '1']],
                '': null,
                '3=4': null
            },

            '`.`': {
                '1': '1',
                '.': '.',
                '\u3245': '\u3245',
                '': null
            },

            '"a" ?`.`': {
                'ab': ['a', 'b'],
                'a': ['a', void 0],
                'b': null,
                '': null
            }
        });

        psuite('Option', {
            '?"a"': {
                'a': 'a',
                '': void 0,
                'b': null
            },

            '??"abc"': {
                'abc': 'abc',
                '': void 0,
                'def': null
            },

            '?"abc" "def"': {
                'def': [void 0, 'def'],
                'abcdef': ['abc', 'def'],
                'qwe': null,
                '': null
            },

            '??"abc" "def"': {
                'def': [void 0, 'def'],
                'abcdef': ['abc', 'def'],
                'abc': null,
                '': null
            },

            '"123" ?"456" "789" ?"abc"': {
                '123789': ['123', void 0, '789', void 0],
                '123456789abc': ['123', '456', '789', 'abc'],
                '': null
            },

            '"abc" ??????????????????????"123"': {
                'abc': ['abc', void 0],
                'abc123': ['abc', '123'],
                '123': null
            }
        });

        psuite('Group', {
            '("abc" "123") "456"': {
                'abc123456': [['abc', '123'], '456'],
                'abc345456': null,
                '': null
            },

            '("abc")': {
                'abc': 'abc',
                'def': null,
                '': null
            }
        });

        psuite('OptionalGroup', {
            '["abc"]': {
                'abc': 'abc',
                '': void 0,
                'def': null
            },

            '["1" "2"]': {
                '12': ['1', '2'],
                '': void 0
            },

            '["1" "2"] "3" "4"': {
                '34': [void 0, '3', '4'],
                '1234': [['1', '2'], '3', '4'],
                '134': null
            },

            '*(["1" "2"] ["3" "4"])': {
                '3412': [[void 0, ['3', '4']], [['1', '2'], void 0]],
                '1234': [[['1', '2'], ['3', '4']]],
                '': [],

                '1': null
            },

            '[("https" / "http") ":"] "//"': {
                'http://': [['http', ':'], '//'],
                'https://': [['https', ':'], '//'],
                'httpss://': null
            }
        });

        psuite('Sequence', {
            '"abc" "123" "xyz"': {
                'abc123xyz': ['abc', '123', 'xyz'],
                'abc123xy9': null,
                'abc 123 xyz': null,
                'abc124xyz': null,
                'def123xyz': null
            },

            '"123" "" "" ""': {
                '123': ['123', '', '', ''],
                '123 ': null,
                '123   ': null,
                ' 123': null,
                '1 2 3': null
            },

            '"" "" "" "123"': {
                '123': ['', '', '', '123'],
                '  123': null,
                '1 2 3': null,
                ' 123 ': null
            },

            '"123" "" "456"': {
                '123456': ['123', '', '456'],
                '123 456': null,
                '123456 ': null,
                '123567': null
            }
        });

        psuite('LabeledSequence', {
            'abc:`\\d+`': {
                '123': { abc: 123 },
                'abc': null
            },

            'w:`[a-z]+` "=" v:`[a-z0-9]+`': {
                'charset=utf8': { w: 'charset', v: 'utf8' },
                'charset = utf8': null
            },

            'w2:`[0-9]+` ";" w_12:`[0-9]+`': {
                '123;456': { w2: 123, w_12: 456 },
                ';': null
            },

            '*{";"}(key:`[a-z]+` "=" val:`[0-9]+`)': {
                'abc=123;def=456;ghi=789': [{ key: 'abc', val: 123 }, { key: 'def', val: 456 }, { key: 'ghi', val: 789 }],
                '': []
            },

            'num:`[0-9]+` / var:`[a-z]+`': {
                '123': { num: 123 },
                'abc': { 'var': 'abc' },
                'ab_23': null
            }
        });

        psuite('Selection', {
            '("x" "y").0': {
                'xy': 'x',
                '12': null
            },

            '("x" "y").1': {
                'xy': 'y',
                '12': null
            },

            '("x" "y").2': {
                'xy': void 0,
                '12': null
            },

            '("=" val:`\\d+`).val': {
                '=123': '123',
                '=0': '0',
                '=a': null
            },

            'key:`\\w+` val:["=" `\\d+`].1': {
                'abc=123': { key: 'abc', val: '123' },
                'abc': { key: 'abc', val: void 0 },
                'abc=': null
            }
        });

        psuite('JoinedRepetition', {
            '*{";"}<0: 2>(`[a-z]+` "=" `[0-9]+`)': {
                '': {},
                'a=1;bc=23;def=456': { a: 1, bc: 23, def: 456 },
                'a=1;b': null
            },

            '*{";"}<key: val>(key:`[a-z]+` val:["=" `[0-9]+`].1)': {
                '': {},
                'a=1;bc=23;def=456': { a: 1, bc: 23, def: 456 },
                'a=1;bc;def=456': { a: 1, bc: void 0, def: 456 },
                'a': { a: void 0 },
                '123=': null
            },
        });

        psuite('Alternation', {
            '1*{" "}("abc" / `def` / \'ghi\')': {
                'abc ghi def': ['abc', 'ghi', 'def'],
                'def ghi': ['def', 'ghi'],
                'abc def ghi': ['abc', 'def', 'ghi'],
                'abc': ['abc'],
                'abc def ihg': null,
                '': null,
            },

            '"123" "abc" / "123" "def"': {
                '123def': ['123', 'def'],
                '123abc': ['123', 'abc'],
                '123qwe': null
            },

            '*("1" / "2" / "3" / "4")': {
                '4321': ['4', '3', '2', '1'],
                '1234': ['1', '2', '3', '4'],
                '1111': ['1', '1', '1', '1'],
                '': [],
                '3245': null
            },

            '"q" / "w" / "r"': {
                'q': 'q',
                'w': 'w',
                'r': 'r',
                't': null,
                '': null
            },

            '*?("1" / "2" / "3") "45"': {
                '12345': [['1', '2', '3'], '45'],
                '45': [[], '45'],
                '11133322245': [['1', '1', '1', '3', '3', '3', '2', '2', '2'], '45'],
                '': null,
                '123': null
            },

            '*("e" "f" / ?("a" "b" / "c" "d"))': {
                'efef': [['e', 'f'], ['e', 'f']],
                '': [],
                'we': null
            }
        });

        psuite('Repetition', {
            '1`.`': {
                'a': ['a'],
                'ab': null
            },

            '4`.`': {
                '1234': ['1', '2', '3', '4'],
                '123': null,
                '': null
            },

            '2*`.`': {
                '123': ['1', '2', '3'],
                '12': ['1', '2'],
                '1': null,
                '': null
            },

            '*4`.`': {
                '1234': ['1', '2', '3', '4'],
                '123': ['1', '2', '3'],
                '1': ['1'],
                '': [],
                '12345': null
            },

            '2*4`.`': {
                '': null,
                '1': null,
                '12': ['1', '2'],
                '123': ['1', '2', '3'],
                '1234': ['1', '2', '3', '4'],
                '12345': null

            },

            '2*3(4*5`.`)': {
                '123456789': [['1', '2', '3', '4', '5'], ['6', '7', '8', '9']],
                '12341234': null
            },

            '*("1" / "2" / "3") *`.`': {
                '123': [['1', '2', '3'], []],
                '123456': [['1', '2', '3'], ['4', '5', '6']]
            },

            '*{";"}num': {
                '123': [123],
                '123;456': [123, 456],
                '1;2;3;4': [1, 2, 3, 4],
                '': [],
                'abc': null
            },

            '*{";"}num ";" var': {
                '123;abc': [[123], ';', 'abc'],
                '123;456;abc': [[123, 456], ';', 'abc'],
                ';abc': [[], ';', 'abc'],
                '': null
            },

            '*3{";"}num ";" num': {
                '123;456;789;111': [[123, 456, 789], ';', 111],
                '1;2;3': null,
                '1;2': null,
                '': null
            },

            '*{*%x20 ";" *%x20}num': {
                '123;  456  ;  789': [123, 456, 789],
                '123': [123],
                '': [],
                '1;2;3': [1, 2, 3],
                'abc': null
            },

            '*{";"}(2{"="}num)': {
                '11=22;33=44;55=66': [[11, 22], [33, 44], [55, 66]],
                '123=345=456': null,
                '1=2=3;4=5=6': null,
                '': [],
                'abc': null
            },

            '1*{";"}%x30-39 ";" 1*"A"': {
                '1;2;3;AAA': [['1', '2', '3'], ';', ['A', 'A', 'A']],
                '': null
            }
        });

        psuite('Exclusion', {
            '"A" ~ "B"': {
                'A': 'A',
                'B': null,
                'C': null,
                '': null
            },

            '"1" ~ "1"': {
                '1': null,
                '2': null,
                '': null
            },

            '%x00-FF ~ "W"': {
                '1': '1',
                'W': null,
                '': null
            },

            '%x00-FF ~ ("A" / "B" / "C")': {
                'A': null,
                'B': null,
                'C': null,
                'D': 'D'
            },

            '*{%x22}(*(%x00-FF ~ %x22))': {
                '123"456': [['1', '2', '3'], ['4', '5', '6']],
                '': []
            },

            '%x22 *(%x60.22 / %x00-FF ~ %x22) %x22': {
                '"123"': ['"', ['1', '2', '3'], '"'],
                '"1`"23"': ['"', ['1', '`"', '2', '3'], '"'],
                '""': ['"', [], '"'],
                '"123': null,
                '"123`"456': null
            },

            '1*{"A" / "B" / "C"}(1*(%x00-FF ~ ("A" / "B" / "C")))': {
                '123A456B789C0': [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["0"]]
            }
        });

        suite('Various', function () {
            ptest('"Q" PLUS "Q" / "W"', {
                'PLUS': /\s*\+\s*/
            }, {
                'W': 'W',
                'Q + Q': ['Q', ' + ', 'Q'],
                'Q+Q': ['Q', '+', 'Q'],
                'Q': null
            });

            ptest('?sign 1*digit', {
                'sign': '"+" / "-"',
                'digit': new ABNF('%x30-39')
            }, {
                '-123': ['-', ['1', '2', '3']],
                '456': [void 0, ['4', '5', '6']]
            });
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
        ptest('num', function () {
            this.num = new ABNF('1*%x30-39').then(function (r) {
                return +r.join('');
            });
        }, {
            '123': 123,
            '000': 0,
            'abc': null
        });

        ptest('num', function () {
            this.num = ABNF('1*digit', function () {
                this.digit = ABNF('%x30-39').then(function (r) {
                    return String.fromCharCode('A'.charCodeAt(0) + r.charCodeAt(0) - '0'.charCodeAt(0));
                });
            }).merge();
        }, {
            '123': 'BCD',
            '000': 'AAA',
            'abc': null
        });

        ptest('1*{";"}attr', function () {
            this.attr = new ABNF('token "=" token', { token: /\w+/ }).text();
        }, {
            'a=b;c=d': ['a=b', 'c=d'],
            'q=p': ['q=p'],
            'ww': null,
            '': null
        });

        ptest('x', function () {
            this.x = new ABNF('?"qqq"').text();
        }, {
            '': '',
            'qqq': 'qqq'
        });

        ptest('flat', function (rule) {
            this.flat = rule('expr').flatten();
            this.expr = rule('"(" *{sep}(num / name / expr) ")"').select(1);
            this.num = rule(/\d+/).then(function (r) { return +r });
            this.name = /[a-zA-Z]+/;
            this.sep = /\s*,\s*/;
        }, {
            '()': [],
            '(1)': [1],
            '(1, 2, 3)': [1, 2, 3],
            '(1, 2, (3, 4), (5, 6, 7), 8)': [1, 2, 3, 4, 5, 6, 7, 8],
            '((1), (2, (3, (4, (5, 6, 7), (), ())), 8, 9))': [1, 2, 3, 4, 5, 6, 7, 8, 9],
            '(add, 2, (sub, (4, (f, (4, 3, 1, (sin, 4), (cos, 5), ())))))': ['add', 2, 'sub', 4, 'f', 4, 3, 1, 'sin', 4, 'cos', 5],
            '(((': null,
            '(sin 5)': null
        });

        ptest('num', function () {
            this.num = new ABNF('1*%x30-39').as('num');
        }, {
            '123': { num: ['1', '2', '3'] },
            'qwe': null
        });

        ptest('num', function () {
            this.num = new ABNF('*%x30-39').merge();
        }, {
            '123': '123',
            '': '',
            'qwe': null
        });

        ptest('merge', function () {
            this.merge = new ABNF('"aaa" ?"bbb" "ccc"').merge();
        }, {
            'aaaccc': 'aaaccc',
            'aaabbbccc': 'aaabbbccc',
            'q': null
        });

        ptest('attrs', function ($) {
            this.attrs = $('1*{";"}attr').join('k', 'v');
            this.attr = $('key "=" val').map({ k: 0, v: 2 });
            this.key = /\w+/;
            this.val = $(/\d+/).parseInt();
        }, {
            'a=1': { a: 1 },
            'a=1;b=2': { a: 1, b: 2 },
            'a=1;a=2': { a: 2 }, // a=1 was overriden
            'a=1;b=2;c=3': { a: 1, b: 2, c: 3 },
            'qqq=': null,
            '': null,
            '=222': null,
            'a=1;b': null
        });

        suite('Select', function () {
            ptest('x', function () {
                this.x = ABNF('1*{" "}(1*%x30-39)').select(1);
            }, {
                '123 456 789': ['4', '5', '6'],
                '123': void 0,
                '': null
            });

            ptest('y', function () {
                this.y = ABNF('*{";"}num', {
                    num: ABNF(/\d+/).parseInt()
                }).map({ a: 0, b: 1, c: 2 });
            }, {
                '1;2;3': { a: 1, b: 2, c: 3 },
                '1': { a: 1, b: void 0, c: void 0 },
                'aaa': null
            });
        });
    });

    suite('PracticalApplications', function () {
        ptest('qstr', function () {
            this.qstr = ABNF('quote *((esc char).1 / char ~ quote) quote', {
                quote: '%x22',
                char: '%x00-FF',
                esc: '%x5c'
            }).select(1).merge();
        }, {
            '""': '',
            '"qwerty"': 'qwerty',
            '"abc\\"123\\"def"': 'abc"123"def',
            '"qqq': null,
            '"qqq\\"': null
        });

        ptest('URI', function () {
            this.URI = ABNF('[scheme ":"] ["//" [user "@"] host [":" port]] path ["?" query] ["#" hash]', {
                query: /[^#]*/,
                scheme: /[a-zA-Z][\w+-.]*/,
                host: /[^:/?#]*/,
                path: /[^?#]*/,
                user: /[^@]*/,
                port: /\d*/,
                hash: /.*/
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
        }, {
            'https://qq.contoso.com:443/www/rrr?context=123': {
                scheme: 'https',
                user: void 0,
                host: 'qq.contoso.com',
                port: '443',
                path: '/www/rrr',
                query: 'context=123',
                hash: void 0
            },

            '?message=how are you?': {
                scheme: void 0,
                user: void 0,
                host: void 0,
                port: void 0,
                path: '',
                query: 'message=how are you?',
                hash: void 0
            },

            '/a/b/c?d=1': {
                scheme: void 0,
                user: void 0,
                host: void 0,
                port: void 0,
                path: '/a/b/c',
                query: 'd=1',
                hash: void 0
            },

            'ftp://cnn.example.com&story=breaking_news@10.0.0.1/top_story.htm': {
                scheme: 'ftp',
                user: 'cnn.example.com&story=breaking_news',
                host: '10.0.0.1',
                port: void 0,
                path: '/top_story.htm',
                query: void 0,
                hash: void 0
            },

            'data:text/plain;charset="utf-8";tag=123;base64,72364728': {
                scheme: 'data',
                user: void 0,
                host: void 0,
                port: void 0,
                path: 'text/plain;charset="utf-8";tag=123;base64,72364728',
                query: void 0,
                hash: void 0
            }
        });

        ptest('data-url', function (rule) {
            this['data-url'] = 'scheme ?wsp mime:?mime ?wsp attrs:attributes ?wsp "," ?wsp data:data';
            this['attributes'] = '*<akey:aval>(?wsp ";" ?wsp akey:token ?wsp aval:["=" ?wsp v:(token / str)].v ?wsp)';
            this['str'] = ABNF('%x22 *((%x5c %x00-FF).1 / %x00-FF ~ %x22) %x22').select(1).merge();
            this['scheme'] = /\s*data\s*:\s*/;
            this['token'] = /[^=;,"\s]+/;
            this['wsp'] = /\s+/;
            this['mime'] = /[-\w]+\/[-\w]+/;
            this['data'] = rule(/.*/).then(function (s) { return decodeURIComponent(s.replace(/\+/g, '%20')) });
        }, {
            '': null,

            'data:text/plain;charset=utf-8,how+are+you%3F': {
                mime: 'text/plain',
                data: 'how are you?',
                attrs: { 'charset': 'utf-8' }
            },

            'data:;charset="utf-8",how+are+you%3F': {
                mime: void 0,
                data: 'how are you?',
                attrs: { 'charset': 'utf-8' }
            },

            'data:;charset="",how+are+you%3F': {
                mime: void 0,
                data: 'how are you?',
                attrs: { 'charset': '' }
            },

            'data:;charset="abc \\" def",how+are+you%3F': {
                mime: void 0,
                data: 'how are you?',
                attrs: { 'charset': 'abc " def' }
            },

            'data:;charset="abc \\\\ def",how+are+you%3F': {
                mime: void 0,
                data: 'how are you?',
                attrs: { 'charset': 'abc \\ def' }
            },

            'data:;charset;base64,how+are+you%3F': {
                mime: void 0,
                data: 'how are you?',
                attrs: { charset: void 0, base64: void 0 }
            },

            '   data   :   text/html ;  charset  =   utf-8  ;   base64   ,how+are+you%3F': {
                mime: 'text/html',
                data: 'how are you?',
                attrs: { 'charset': 'utf-8', base64: void 0 }
            },

            'data:application/sdp;charset=utf-8;es="";tag="1\\"2\\\\3";base64,v=1%0d%0as=0': {
                mime: 'application/sdp',
                data: 'v=1\r\ns=0',
                attrs: { 'charset': 'utf-8', 'es': '', 'tag': '1"2\\3', base64: void 0 }
            }
        });

        test('WWW-Authenticate header', function () {
            var pattern = ABNF('*{ch-sep}<name: attrs>(name:name wsp attrs:attributes)', function (rule) {
                this['attributes'] = '*{attr-sep}<key: val>(key:name eq val:(name / quoted-str))';
                this['name'] = /[^,;="'\s]+/;
                this['ch-sep'] = /[,\s]*/;
                this['attr-sep'] = /\s*,\s*/;
                this['wsp'] = /\s*/;
                this['eq'] = /\s*=\s*/;
                this['quoted-str'] = rule(/".*?"/).slice(+1, -1);
            });

            var input = 'Digest username="Mufasa", realm="testrealm@host.com",nonce="12",uri="/dir/index.html",qop=auth,nc=2,cnonce="3",response="44",opaque="55"Basic realm="testrealm@host.com",nonce="12",uri="/dir/index.html",qop=auth,nc=2,cnonce="3",response="44",opaque="55", NTLM, Negotiate';

            assert.deepEqual(pattern.exec(input), {
                Digest: { username: 'Mufasa', realm: 'testrealm@host.com', nonce: '12', uri: '/dir/index.html', qop: 'auth', nc: '2', cnonce: '3', response: '44', opaque: '55' },
                Basic: { realm: 'testrealm@host.com', nonce: '12', uri: '/dir/index.html', qop: 'auth', nc: '2', cnonce: '3', response: '44', opaque: '55' },
                NTLM: {},
                Negotiate: {}
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
            var p = ABNF('1*{%x0a}<name: def>(name:rule-name *wsp "=" *wsp def:alternation)', function (rule) {
                this['rule-name'] = /[a-zA-Z][\w-]*\w/;
                this['alternation'] = rule('1*{*wsp "/" *wsp}concatenation').then(function (r) { return r.length > 1 ? { alt: r } : r[0] });
                this['concatenation'] = rule('1*{1*wsp}(repetition / element)').then(function (r) { return r.length > 1 ? { con: r } : r[0] });
                this['repetition'] = rule('repeat *wsp element').then(function (r) { return { min: r[0].min, max: r[0].max, rep: r[2] } });
                this['repeat'] = 'min-max / exact';
                this['min-max'] = 'min:?number "*" max:?number';
                this['exact'] = rule('number').map({ min: 0, max: 0 });
                this['number'] = rule(/\d+/).parseInt(10);
                this['element'] = 'rule-ref / group / option / char-val / num-val';
                this['rule-ref'] = 'ref:rule-name';
                this['group'] = '("(" *wsp x:alternation *wsp ")").x';
                this['option'] = '"[" *wsp opt:alternation *wsp "]"';
                this['char-val'] = rule('%x22 *(%x20-21 / %x23-7e) %x22').select(1).merge().as('str');
                this['num-val'] = '("%" (bin-val / dec-val / hex-val)).1';
                this['bin-val'] = '"b" min:bin-num max:["-" bin-num].1';
                this['dec-val'] = '"d" min:dec-num max:["-" dec-num].1';
                this['hex-val'] = '"x" min:hex-num max:["-" hex-num].1';
                this['bin-num'] = rule(/[0-1]+/).parseInt(2);
                this['dec-num'] = rule(/[0-9]+/).parseInt(10);
                this['hex-num'] = rule(/[0-9a-fA-F]+/).parseInt(16);
                this['wsp'] = '%x20';
            });

            // this is an AST that the parser is expected to produce
            var r = {
                rulelist: {
                    min: 1,
                    max: void 0,
                    rep: {
                        alt: [{ ref: 'rule' },
                              {
                                  con: [{ min: void 0, max: void 0, rep: { ref: 'c-wsp' } },
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
                              min: void 0,
                              max: void 0,
                              rep: { alt: [{ ref: 'ALPHA' }, { ref: 'DIGIT' }, { str: '-' }] }
                          }]
                },
                'defined-as': {
                    con: [{ min: void 0, max: void 0, rep: { ref: 'c-wsp' } },
                          { alt: [{ str: '=' }, { str: '=/' }] },
                          { min: void 0, max: void 0, rep: { ref: 'c-wsp' } }]
                },
                elements: {
                    con: [{ ref: 'alternation' },
                          { min: void 0, max: void 0, rep: { ref: 'c-wsp' } }]
                },
                'c-wsp': { alt: [{ ref: 'WSP' }, { con: [{ ref: 'c-nl' }, { ref: 'WSP' }] }] },
                'c-nl': { alt: [{ ref: 'comment' }, { ref: 'CRLF' }] },
                comment: {
                    con: [{ str: ';' },
                          {
                              min: void 0,
                              max: void 0,
                              rep: { alt: [{ ref: 'WSP' }, { ref: 'VCHAR' }] }
                          },
                          { ref: 'CRLF' }]
                },
                alternation: {
                    con: [{ ref: 'concatenation' },
                          {
                              min: void 0,
                              max: void 0,
                              rep: {
                                  con: [{ min: void 0, max: void 0, rep: { ref: 'c-wsp' } },
                                        { str: '/' },
                                        { min: void 0, max: void 0, rep: { ref: 'c-wsp' } },
                                        { ref: 'concatenation' }]
                              }
                          }]
                },
                concatenation: {
                    con: [{ ref: 'repetition' },
                          {
                              min: void 0,
                              max: void 0,
                              rep: {
                                  con: [{ min: 1, max: void 0, rep: { ref: 'c-wsp' } },
                                        { ref: 'repetition' }]
                              }
                          }]
                },
                repetition: { con: [{ opt: { ref: 'repeat' } }, { ref: 'element' }] },
                repeat: {
                    alt: [{ min: 1, max: void 0, rep: { ref: 'DIGIT' } },
                          {
                              con: [{ min: void 0, max: void 0, rep: { ref: 'DIGIT' } },
                                 { str: '*' },
                                 { min: void 0, max: void 0, rep: { ref: 'DIGIT' } }]
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
                          { min: void 0, max: void 0, rep: { ref: 'c-wsp' } },
                          { ref: 'alternation' },
                          { min: void 0, max: void 0, rep: { ref: 'c-wsp' } },
                          { str: ')' }]
                },
                option: {
                    con: [{ str: '[' },
                          { min: void 0, max: void 0, rep: { ref: 'c-wsp' } },
                          { ref: 'alternation' },
                          { min: void 0, max: void 0, rep: { ref: 'c-wsp' } },
                          { str: ']' }]
                },
                'char-val': {
                    con: [{ ref: 'DQUOTE' },
                          {
                              min: void 0,
                              max: void 0,
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
                          { min: 1, max: void 0, rep: { ref: 'BIT' } },
                          {
                              opt: {
                                  alt: [{
                                      min: 1,
                                      max: void 0,
                                      rep: {
                                          con: [{ str: '.' },
                                                { min: 1, max: void 0, rep: { ref: 'BIT' } }]
                                      }
                                  },
                                          {
                                              con: [{ str: '-' },
                                                 { min: 1, max: void 0, rep: { ref: 'BIT' } }]
                                          }]
                              }
                          }]
                },
                'dec-val': {
                    con: [{ str: 'd' },
                          { min: 1, max: void 0, rep: { ref: 'DIGIT' } },
                          {
                              opt: {
                                  alt: [{
                                      min: 1,
                                      max: void 0,
                                      rep: {
                                          con: [{ str: '.' },
                                                { min: 1, max: void 0, rep: { ref: 'DIGIT' } }]
                                      }
                                  },
                                          {
                                              con: [{ str: '-' },
                                                 { min: 1, max: void 0, rep: { ref: 'DIGIT' } }]
                                          }]
                              }
                          }]
                },
                'hex-val': {
                    con: [{ str: 'x' },
                          { min: 1, max: void 0, rep: { ref: 'HEXDIG' } },
                          {
                              opt: {
                                  alt: [{
                                      min: 1,
                                      max: void 0,
                                      rep: {
                                          con: [{ str: '.' },
                                                { min: 1, max: void 0, rep: { ref: 'HEXDIG' } }]
                                      }
                                  },
                                          {
                                              con: [{ str: '-' },
                                                 { min: 1, max: void 0, rep: { ref: 'HEXDIG' } }]
                                          }]
                              }
                          }]
                },
                'prose-val': {
                    con: [{ str: '<' },
                          {
                              min: void 0,
                              max: void 0,
                              rep: { alt: [{ min: 32, max: 61 }, { min: 63, max: 126 }] }
                          },
                          { str: '>' }]
                },
                ALPHA: { alt: [{ min: 65, max: 90 }, { min: 97, max: 122 }] },
                BIT: { alt: [{ str: '0' }, { str: '1' }] },
                CHAR: { min: 1, max: 127 },
                CR: { min: 13, max: void 0 },
                CRLF: { con: [{ ref: 'CR' }, { ref: 'LF' }] },
                CTL: { alt: [{ min: 0, max: 31 }, { min: 127, max: void 0 }] },
                DIGIT: { min: 48, max: 57 },
                DQUOTE: { min: 34, max: void 0 },
                HEXDIG: {
                    alt: [{ ref: 'DIGIT' },
                          { str: 'A' },
                          { str: 'B' },
                          { str: 'C' },
                          { str: 'D' },
                          { str: 'E' },
                          { str: 'F' }]
                },
                HTAB: { min: 9, max: void 0 },
                LF: { min: 10, max: void 0 },
                LWSP: {
                    min: void 0,
                    max: void 0,
                    rep: { alt: [{ ref: 'WSP' }, { con: [{ ref: 'CRLF' }, { ref: 'WSP' }] }] }
                },
                OCTET: { min: 0, max: 255 },
                SP: { min: 32, max: void 0 },
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
                var pattern = ABNF('1*{","}pair', {
                    name: /[a-zA-Z][a-zA-Z0-9\-]+/,
                    value: /[\w\-]+/,
                    pair: 'name:name "=" value:value'
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
                this['object'] = '("{" obj:*{","}<s:v>(s:string ":" v:value) "}").obj';
                this['array'] = '("[" a:*{","}value "]").a';
                this['value'] = 'object / array / number / string / false / true / null';
                this['false'] = rule('"false"').make(false);
                this['true'] = rule('"true"').make(true);
                this['null'] = rule('"null"').make(null);
                this['number'] = rule('["-"] `\\d+` ["." `\\d+`] ["e" ["+" / "-"] `\\d+`]').text().parseFloat();
                this['string'] = rule('%x22 s:*char %x22').select('s').merge();
                this['char'] = /[^"]/; // RFC 4627 specifies a more complicated rule for this
            });

            var source = {
                "num": -1.2345e-11,
                "str": "abc def",
                "true": true,
                "false": false,
                "null": null,
                "object": { "a": +1, "b": -2, "c": 0 },
                "array": [{}, { "x": "y" }, "21", 23.22, [], "", null, true, false]
            };

            assert.deepEqual(pattern.exec(JSON.stringify(source)), source);
        });

        suite('XML', function () {
            var p;

            setup(function () {
                // this is a simplified grammar of XML:
                p = ABNF('node', function (rule) {
                    this['node'] = 'regular / empty';
                    this['empty'] = '"<" name:name ?wsp attrs:?attrs "/>"';
                    this['regular'] = '"<" name:name ?wsp attrs:?attrs ">" nodes:*(node / text) "</" name ">"';
                    this['attrs'] = rule('1*{wsp}(name [value])').join(0, 1);
                    this['value'] = rule(/=".*?"/).slice(+2, -1);
                    this['text'] = /[^<>]+/;
                    this['name'] = /[a-zA-Z\-0-9\:]+/;
                    this['wsp'] = /[\x00-\x20]+/;
                });
            });

            test('Simple', function () {
                assert.deepEqual(
                    p.exec('<abc>123</abc>'),
                    { name: 'abc', attrs: void 0, nodes: ['123'] });
            });

            test('Complex', function () {
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

                var r = {
                    name: 'root',
                    attrs: { 'attr-1': 'value-1', 'attr-2': void 0 },
                    nodes: [
                        {
                            name: 'aaa',
                            attrs: { x: '1', y: '2', z: '3' },
                            nodes: [
                                {
                                    name: 'aaa-1',
                                    attrs: void 0,
                                    nodes: ['some text inside aaa-1']
                                },
                               {
                                   name: 'aaa-empty',
                                   attrs: { p: void 0, q: '2 3 4', r: void 0 }
                               }
                            ]
                        },
                       { name: 'empty-tag', attrs: void 0 },
                       { name: 'empty-tag-with-attr', attrs: { 'attr-1': void 0 } },
                       {
                           name: 'w1',
                           attrs: void 0,
                           nodes: [{
                               name: 'w2',
                               attrs: void 0,
                               nodes: [{ name: 'w3', attrs: void 0, nodes: [] }]
                           }]
                       }]
                };

                assert.deepEqual(p.exec(s), r);
            });
        });

        suite('SimpleXML', function () {
            var p;

            setup(function () {
                p = ABNF('node', {
                    node: '"<" tag:name ">" nodes:*(node / text) "</" name ">"',
                    name: /[^<>/]+/,
                    text: /[^<>/]+/
                });
            });

            test('Invalid', function () {
                assert.deepEqual(p.exec('<a>ss'), null);
            });

            test('Valid', function () {
                assert.deepEqual(p.exec('<a><b>123</b><c>456</c></a>'), {
                    tag: 'a', nodes: [
                        { tag: 'b', nodes: ['123'] },
                        { tag: 'c', nodes: ['456'] }
                    ]
                });
            });
        });

        suite('UTF-8', function () {
            var p;

            setup(function () {
                // this parser reads a string in which every character represents a byte
                // of a UTF-8 string and returns an array of unicode code-points
                p = ABNF('1*char', function (rule) {
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
            });

            test('A<NOT IDENTICAL TO><ALPHA>.', function () {
                assert.deepEqual(
                    p.exec('\x41\xE2\x89\xA2\xCE\x91\x2E'),
                    [0x0041, 0x2262, 0x0391, 0x002E]);
            });

            test('the Hangul characters for the Korean word "hangugo"', function () {
                assert.deepEqual(
                    p.exec('\xED\x95\x9C\xEA\xB5\xAD\xEC\x96\xB4'),
                    [0xD55C, 0xAD6D, 0xC5B4]);
            });

            test('the Han characters for the Japanese word "nihongo"', function () {
                assert.deepEqual(
                    p.exec('\xE6\x97\xA5\xE6\x9C\xAC\xE8\xAA\x9E'),
                    [0x65E5, 0x672C, 0x8A9E]);
            });

            test('the Cyrillic characters for the Russian phrase "Kak dela?"', function () {
                assert.deepEqual(
                    p.exec('\xD0\x9A\xD0\xB0\xD0\xBA\x20\xD0\xB4\xD0\xB5\xD0\xBB\xD0\xB0\x3F'),
                    [1050, 1072, 1082, 32, 1076, 1077, 1083, 1072, 63]);
            });
        });

        suite('UTF-16', function () {
            var p;

            setup(function () {
                // this parser reads a string in which every character represents a word (16 bits)
                // of a UTF-16 string and returns an array of unicode code-points
                p = ABNF('1*(chr1 / chr2)', {
                    chr1: ABNF('%x0000-d7ff / %xe000-ffff').then(function (s) {
                        return s.charCodeAt(0);
                    }),
                    chr2: ABNF('%xd800-dbff %xdc00-dfff').then(function (_, s) {
                        var w1 = s.charCodeAt(0) & 1023;
                        var w2 = s.charCodeAt(1) & 1023;
                        return 0x10000 + (w1 << 10) + w2;
                    })
                });
            });

            test('<THE RA HIEROGLYPH>=Ra', function () {
                assert.deepEqual(
                    p.exec('\uD808\uDF45\u003D\u0052\u0061'),
                    [0x12345, 61, 82, 97]);
            });

            test('<MUSICAL SYMBOL G CLEF>', function () {
                assert.deepEqual(
                    p.exec('\uD834\uDD1E'),
                    [0x1D11E]);
            });

            test('<PRIVATE USE CHARACTER-10FFFD (last Unicode code point)>', function () {
                assert.deepEqual(
                    p.exec('\uDBFF\uDFFD'),
                    [0x10FFFD]);
            });

            test('How are you?', function () {
                assert.deepEqual(
                    p.exec('How are you?'),
                    [72, 111, 119, 32, 97, 114, 101, 32, 121, 111, 117, 63]);
            });

            test('the Cyrillic characters for the Russian phrase "Kak dela?"', function () {
                assert.deepEqual(
                    p.exec('\u041a\u0430\u043a\u0020\u0434\u0435\u043b\u0430\u003f'),
                    [1050, 1072, 1082, 32, 1076, 1077, 1083, 1072, 63]);
            });
        });

        suite('Expression', function () {
            var p;

            function etest(input, ast) {
                test(input, function () {
                    assert.deepEqual(p.exec(input), ast);
                });
            }

            setup(function () {
                // This is an LL grammar for arithmetic expressions.
                // It includes rules to form AST of an expression.
                p = ABNF('expr', function ($) {
                    this['expr'] = $('[ADD / SUB] term *((ADD / SUB) term)').then(function (r) {
                        var i, t = r[1];

                        if (r[0] == '-')
                            t = { neg: t };

                        for (i = 0; i < r[2].length; i++) {
                            t = r[2][i][0] == '+' ?
                                { add: { lhs: t, rhs: r[2][i][1] } } :
                                { sub: { lhs: t, rhs: r[2][i][1] } };
                        }

                        return t;
                    });

                    this['term'] = $('fctr *([MUL / DIV / WSP] fctr)').then(function (r) {
                        var i, t = r[0];

                        for (i = 0; i < r[1].length; i++) {
                            t = r[1][i][0] == '/' ?
                                { div: { lhs: t, rhs: r[1][i][1] } } :
                                { mul: { lhs: t, rhs: r[1][i][1] } };
                        }

                        return t;
                    });

                    this['fctr'] = $('1*{EXP}atom').then(function (r) {
                        var i, t = r[r.length - 1];

                        for (i = r.length - 2; i >= 0; i--)
                            t = { exp: { lhs: r[i], rhs: t } };

                        return t;
                    });

                    this['func'] = $('FNAME [WSP] fctr').then(function (r) {
                        var t = {};
                        t[r[0]] = r[2];
                        return t;
                    });

                    this['atom'] = $('number / group / func / ref');
                    this['number'] = $(/\d+(\.\d+)?/).parseFloat().as('num');
                    this['group'] = $('LPAREN expr RPAREN').select(1);
                    this['ref'] = $('NAME').as('ref');

                    this['ADD'] = $(/\s*\+\s*/).trim();
                    this['SUB'] = $(/\s*\-\s*/).trim();
                    this['MUL'] = $(/\s*\*\s*/).trim();
                    this['DIV'] = $(/\s*\/\s*/).trim();
                    this['EXP'] = $(/\s*\^\s*/).trim();

                    this['LPAREN'] = $(/\s*\(\s*/);
                    this['RPAREN'] = $(/\s*\)\s*/);

                    this['NAME'] = /[a-z]+/i;
                    this['FNAME'] = /sin|cos|tg|ctg/i;
                    this['WSP'] = /\s+/;
                });
            });

            etest('33', {
                num: 33
            });

            etest('12.34', {
                num: 12.34
            });

            etest('-33', {
                neg: { num: 33 }
            });

            etest('11 + 33', {
                add: {
                    lhs: { num: 11 },
                    rhs: { num: 33 }
                }
            });

            etest('11 - 33', {
                sub: {
                    lhs: { num: 11 },
                    rhs: { num: 33 }
                }
            });

            etest('11 / 33', {
                div: {
                    lhs: { num: 11 },
                    rhs: { num: 33 }
                }
            });

            etest('11 * 33', {
                mul: {
                    lhs: { num: 11 },
                    rhs: { num: 33 }
                }
            });

            etest('11 ^ 33', {
                exp: {
                    lhs: { num: 11 },
                    rhs: { num: 33 }
                }
            });

            etest('11 + 22 + 33', {
                add: {
                    lhs: {
                        add: {
                            lhs: { num: 11 },
                            rhs: { num: 22 }
                        }
                    },
                    rhs: { num: 33 }
                }
            });

            etest('11 - 22 - 33', {
                sub: {
                    lhs: {
                        sub: {
                            lhs: { num: 11 },
                            rhs: { num: 22 }
                        }
                    },
                    rhs: { num: 33 }
                }
            });

            etest('11 * 22 * 33', {
                mul: {
                    lhs: {
                        mul: {
                            lhs: { num: 11 },
                            rhs: { num: 22 }
                        }
                    },
                    rhs: { num: 33 }
                }
            });

            etest('11 / 22 / 33', {
                div: {
                    lhs: {
                        div: {
                            lhs: { num: 11 },
                            rhs: { num: 22 }
                        }
                    },
                    rhs: { num: 33 }
                }
            });

            etest('11 ^ 22 ^ 33', {
                exp: {
                    lhs: { num: 11 },
                    rhs: {
                        exp: {
                            lhs: { num: 22 },
                            rhs: { num: 33 }
                        }
                    }
                }
            });

            etest('11 + 22 * 33', {
                add: {
                    lhs: { num: 11 },
                    rhs: {
                        mul: {
                            lhs: { num: 22 },
                            rhs: { num: 33 }
                        }
                    }
                }
            });

            etest('11 * 22 ^ 33', {
                mul: {
                    lhs: { num: 11 },
                    rhs: {
                        exp: {
                            lhs: { num: 22 },
                            rhs: { num: 33 }
                        }
                    }
                }
            });

            etest('(11)', {
                num: 11
            });

            etest('(-11)', {
                neg: { num: 11 }
            });

            etest('11 + (22 + 33)', {
                add: {
                    lhs: { num: 11 },
                    rhs: {
                        add: {
                            lhs: { num: 22 },
                            rhs: { num: 33 }
                        }
                    }
                }
            });

            etest('(11 + 22)^(33 - 44)', {
                exp: {
                    lhs: {
                        add: {
                            lhs: { num: 11 },
                            rhs: { num: 22 }
                        }
                    },
                    rhs: {
                        sub: {
                            lhs: { num: 33 },
                            rhs: { num: 44 }
                        }
                    },
                }
            });

            etest('sin 11', {
                sin: { num: 11 }
            });

            etest('sin(11)', {
                sin: { num: 11 }
            });

            etest('sin 2 + 3', {
                add: {
                    lhs: { sin: { num: 2 } },
                    rhs: { num: 3 }
                }
            });

            etest('sin 2 ^ 3', {
                sin: {
                    exp: {
                        lhs: { num: 2 },
                        rhs: { num: 3 }
                    }
                }
            });

            etest('sin 2 ^ cos 3', {
                sin: {
                    exp: {
                        lhs: { num: 2 },
                        rhs: { cos: { num: 3 } }
                    }
                }
            });

            etest('pi', {
                ref: 'pi'
            });

            etest('pi - 2', {
                sub: {
                    lhs: { ref: 'pi' },
                    rhs: { num: 2 }
                }
            });

            etest('sin - 2', {
                sub: {
                    lhs: { ref: 'sin' },
                    rhs: { num: 2 }
                }
            });

            etest('sin cos(pi/2)', {
                sin: {
                    cos: {
                        div: {
                            lhs: { ref: 'pi' },
                            rhs: { num: 2 }
                        }
                    }
                }
            });

            etest('4 x', {
                mul: {
                    lhs: { num: 4 },
                    rhs: { ref: 'x' }
                }
            });

            etest('2 + 3i', {
                add: {
                    lhs: { num: 2 },
                    rhs: {
                        mul: {
                            lhs: { num: 3 },
                            rhs: { ref: 'i' }
                        }
                    }
                }
            });

            etest('e^(i pi) + 1', {
                add: {
                    lhs: {
                        exp: {
                            lhs: { ref: 'e' },
                            rhs: {
                                mul: {
                                    lhs: { ref: 'i' },
                                    rhs: { ref: 'pi' }
                                }
                            }
                        }
                    },
                    rhs: { num: 1 }
                }
            });
        });
    });
});
