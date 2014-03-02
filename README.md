## llkp - LL(k) parsers

[![Build Status](https://travis-ci.org/c5f7c9/llkp.png)](https://travis-ci.org/c5f7c9/llkp)

The goal of this library is to provide API that would look like the built-in RegExp class and would let easily write parsers for structures that cannot be parsed with regular expressions, such as XML-like structures, the e-mail pattern defined in RFC 822, the data URL pattern and so on.

#### Examples

To parse a list of comma separated key-value pairs with a parser written as ABNF:

````js
var ABNF = require('llkp/abnf');

var p = new ABNF('1*{","}(key "=" val)', { key: /\w+/, val: /\w+/ }).join(0, 2);
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

TBD (istanbul?)

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
