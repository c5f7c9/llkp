## llkp - LL(k) parsers

[![Build Status](https://travis-ci.org/c5f7c9/llkp.png)](https://travis-ci.org/c5f7c9/llkp)

The goal of this library is to provide API that would look like the built-in [RegExp](http://www.ecma-international.org/ecma-262/5.1/#sec-15.10) class and would let easily write parsers for structures that cannot be parsed with regular expressions, such as XML-like structures, the [e-mail](https://www.ietf.org/rfc/rfc0822.txt) pattern, [data URL](https://www.ietf.org/rfc/rfc2397.txt), [URI](http://tools.ietf.org/html/rfc3986) and so on.

#### Examples

To parse a list of comma separated key-value pairs with a parser written as [ABNF](http://tools.ietf.org/html/rfc5234):

````js
var ABNF = require('llkp/abnf');

var p = new ABNF('1*{","}(key "=" val)', { key: /\w+/, val: /\w+/ }).join(0, 2);
var r = p.exec('charset=utf8,type=text,subtype=html');

assert.deepEqual(r, { charset: 'utf8', type: 'text', subtype: 'html' });
````

To parse a list of comma separated key-value pairs with a parser written as PEG:

````js
var PEG = require('llkp/peg');

var p = new PEG('(key "=" val)<",">+', { key: /\w+/, val: /\w+/ }).join(0, 2);
var r = p.exec('charset=utf8,type=text,subtype=html');

assert.deepEqual(r, { charset: 'utf8', type: 'text', subtype: 'html' });
````

#### Tests

Unit tests were written in the mocha's TDD style:

    npm install -g mocha
    mocha -u tdd

They can be run with npm:

    npm test

#### Coverage

`istanbul` can be used with `mocha`'s unit tests in the following way (figure out the full path to `_mocha`):

    npm install -g istanbul
    istanbul cover .../npm/node_modules/mocha/bin/_mocha -- -u tdd
    
It will produce an output like:

    Statements   : 98.06% ( 353/360 )
    Branches     : 89.84% ( 168/187 )
    Functions    : 100% ( 96/96 )
    Lines        : 97.89% ( 325/332 )

#### Static analysis

Static analysis is done by JSHint:

    npm install -g jshint
    jshint --verbose .

This command is mentioned in package.json so it's enough to run `npm test`:

    npm test
    
#### Documentation

Check out the [wiki](https://github.com/c5f7c9/llkp/wiki/_pages) page.

#### License

MIT
