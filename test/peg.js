var assert = require('assert');
var PEG = require('../peg');

suite('PEG', function () {
    'use strict';

    console.inspect = function (object) {
        var inspect = require('util').inspect;
        return console.log(inspect(object, { depth: null }));
    };

    function forEach(dict, fn) {
        for (var key in dict)
            fn(dict[key], key);
    }

    function ptest(pattern, samples) {
        var rules = {
            'num': PEG(/\d+/).parseInt(),
            'var': /[a-zA-Z]\w+/
        };

        if (arguments.length == 3) {
            rules = arguments[1];
            samples = arguments[2];
        }

        forEach(samples, function (expectedResult, input) {
            var testName = 'PEG(' + pattern + ').exec(' + input + ') = ' + expectedResult;
            test(testName, function () {
                var result = PEG(pattern, rules).exec(input);
                assert.deepEqual(result, expectedResult);
            });
        });
    }

    suite('BasicParsing', function () {
        suite('Text', function () {
            ptest('""', {
                '': '',
                'a': null
            });

            ptest('"\\"\x31\r\n\u0032\'"', {
                '\"1\r\n2\'': '\"1\r\n2\'',
                '123': null
            });

            ptest("''", {
                '': '',
                'a': null
            });

            ptest("'\"\x31\r\n\u0032\\''", {
                '\"1\r\n2\'': '\"1\r\n2\'',
                '123': null
            });
        });

        suite('Charset', function () {
            ptest('[]', {
                '': null,
                'a': null
            });

            ptest('[a-f0-9]', {
                'a': 'a',
                'c': 'c',
                'f': 'f',
                '0': '0',
                '5': '5',
                '9': '9',
                'A': null,
                '': null
            });

            ptest('[^0-9]', {
                'a': 'a',
                '3': null,
                '0': null,
                '9': null
            });
        });

        suite('PositiveLookAhead', function () {
            ptest('&[5]', {
                '5': null,
                '': null
            });

            ptest('&[5] [0-9]', {
                '5': [void 0, '5'],
                '4': null,
                '': null
            });
        });

        suite('NegativeLookAhead', function () {
            ptest('![5]', {
                '5': null,
                '': void 0
            });

            ptest('![5] [0-9]', {
                '5': null,
                '4': [void 0, '4'],
                '': null
            });
        });

        suite('Option', function () {
            ptest('[0-9]?', {
                '3': '3',
                '': void 0
            });

            ptest('[a-z] [0-9]?', {
                'a4': ['a', '4'],
                'a': ['a', void 0],
                '5': null
            });
        });

        suite('Group', function () {
            ptest('("a" "b" "c")+', {
                'abcabc': [['a', 'b', 'c'], ['a', 'b', 'c']],
                'abca': null,
                '': null
            });

            ptest('[a-z]+ ("=" [0-9]+).1', {
                'abc=123': [['a', 'b', 'c'], ['1', '2', '3']],
            });

            ptest('tag:[a-z]+ val:("=" x:[0-9]+).x', {
                'abc=123': { tag: ['a', 'b', 'c'], val: ['1', '2', '3'] },
            });
        });

        suite('Alternation', function () {
            ptest('[a-z] / [0-9]', {
                'd': 'd',
                '4': '4',
                'F': null,
                '': null
            });

            ptest('[a] [b] / [c] [d]', {
                'ab': ['a', 'b'],
                'cd': ['c', 'd'],
                'ac': null,
                'abcd': null,
                '': null
            });
        });

        suite('Sequence', function () {
            ptest('[a] [b] [c]', {
                'abc': ['a', 'b', 'c'],
                '': null
            });

            ptest('[a] [a-z] ~ [h] [b]', {
                'akb': ['a', 'k', 'b'],
                'ahb': null,
                'qwe': null,
                '': null
            });

            ptest('word:[a-z]+', {
                'abc': { word: ['a', 'b', 'c'] },
                'd': { word: ['d'] },
                '': null
            });

            ptest('a:[0-9] / b:[a-z]', {
                '4': { a: '4' },
                't': { b: 't' },
                '': null
            });

            ptest('a:[0-9] b:[a-z]', {
                '7g': { a: '7', b: 'g' },
                'rr': null
            });
        });

        suite('Exclusion', function () {
            ptest('[\x00-\xFF] ~ [0-9]', {
                'q': 'q',
                'G': 'G',
                '4': null,
                '': null
            });

            ptest('[a] ~ [a]', {
                'a': null,
                '': null
            });
        });

        suite('Repetition', function () {
            ptest('[0-9]+', {
                '123': ['1', '2', '3'],
                '2': ['2'],
                'q': null,
                '': null
            });

            ptest('[0-9]*', {
                '123': ['1', '2', '3'],
                '2': ['2'],
                'q': null,
                '': []
            });

            ptest('[0-9]<[;,]>+', {
                '1,2;3,4': ['1', '2', '3', '4'],
                '1-2+3': null,
                '4': ['4'],
                '': null
            });

            ptest('[0-9]<[;,]>*', {
                '1,2;3,4': ['1', '2', '3', '4'],
                '1-2+3': null,
                '4': ['4'],
                '': []
            });
        });
    });

    suite('PracticalApplications', function () {
        ptest('[+-]? [0-9]+ ("." [0-9]+)? ([eE] [+-]? [0-9]+)?', {
            "5": [void 0, ["5"], void 0, void 0],
            "-5": ["-", ["5"], void 0, void 0],
            "1.23": [void 0, ["1"], [".", ["2", "3"]], void 0],
            "4e-9": [void 0, ["4"], void 0, ["e", "-", ["9"]]],
            "4e19": [void 0, ["4"], void 0, ["e", void 0, ["1", "9"]]],
            '+12.34567e-890': ["+", ["1", "2"], [".", ["3", "4", "5", "6", "7"]], ["e", "-", ["8", "9", "0"]]]
        });

        test('JSON', function () {
            // The ABNF grammar of JSON was taken from RFC 4627 and translated into PEG.
            var pattern = new PEG('object / array', function (rule) {
                this['object'] = rule('"{" (string ":" value)<",">* "}"').select(1).join(0, 2);
                this['array'] = rule('"[" value<",">* "]"').select(1);
                this['value'] = 'object / array / number / string / false / true / null';
                this['false'] = rule('"false"').make(false);
                this['true'] = rule('"true"').make(true);
                this['null'] = rule('"null"').make(null);
                this['number'] = rule('[-]? [0-9]+ ("." [0-9]+)? ("e" [+-] [0-9]+)?').text().parseFloat();
                this['string'] = rule('["] char* ["]').select(1).merge();
                this['char'] = '[\x00-\xFF] ~ ["]'; // RFC 4627 specifies a more complicated rule for this
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
    });
});