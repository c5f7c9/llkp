## llkp - LL(k) parsers

The goal of this library is to provide API that would look like the built-in RegExp class and would let easily write parsers for structures that cannot be parsed with regular expressions, such as XML-like structures, the e-mail pattern defined in RFC 822, the data URL pattern and so on.

### Examples

To parse a list of comma separated key-value pairs with a parser written as ABNF:

````js
var ABNF = require('llkp/abnf');

var p = new ABNF('1*{","}(key "=" val)', { key: /\w+/, val: /\w+/ }).join(0, 2);
var r = p.exec('charset=utf8,type=text,subtype=html');

r == { charset: 'utf8', type: 'text', subtype: 'html' };
````

TODO: same with EBNF and PEG

### The idea of the library.

The core of this library is a set of simple parsing functions that read input and return results of parsing: numbers, arrays, dictionaries and so on. Two such functions read the input directly:

* The **txt** function that just compares the input with a fixed given string and returns that string if it matches the input.
* The **rgx** function that does the same, but compares the input with a given regular expression. For instance, **rgx(/[a-zA-Z$][a-zA-Z$0-9]/)** is able to parse a valid name of a JS varaible.

Then a few parsing function that combine other parsing functions into more complex patterns allow to build parsers of almost any complexity:

* **opt** - makes a pattern optional
* **any** - makes an alternation pattern that matches any of the given patterns
* **seq** - makes a sequence pattern that applies given patterns one by one to the input
* **rep** - makes a repetition of a pattern
* **exc** - makes a pattern that matches the first but not the second pattern

In addition to that every pattern can be amended by a custom transformation that will modify results of parsing the input with that pattern. This is achieved by the **then** method that creates another pattern based on existing one and a given transformation function. So if there is a pattern **attrs** that reads a sequence of key-value pairs and returns them as an array of arrays, it's possible to use **attrs.then** method to create another pattern **attrs2** that will parse the same key-value sequences but will return them as a dictionary.

It's quite obvious that with these parsing functions it's possible to write a LL(k) parser of a grammar written in ABNF, EBNF or PEG and then reconstitute from that textual representation a parsing function that will parse whatever the grammar defines, so it'll be possible to write in JS something like this:

````js
var pattern = new EBNF('[scheme ":"] ["//" host [":" port]] ["/" path] ["?" query]');
var uri = pattern.exec('https://github.com:80/.../?qw=123');

if (uri.scheme == 'https')
    ...
````

### The structure of the library.

The core parsing functions are kept in a file that can be used as a separate lightweight library for constructing parsing functions manually. On top of the core parsing functions there will be a few RegExp-like classes that will implement different ways of defining a LL(k) grammar: ABNF, EBNF and PEG.

* **core.js** - The core parsing functions that can be used as a separate library.
* **core.then.js** - Pattern transformations on top of core.js.
* **abnf.js** - The ABNF syntax for defining LL(k) grammars on top of core.then.js.
* **ebnf.js** - The EBNF syntax for defining LL(k) grammars on top of core.then.js.
* **peg.js** - The PEG syntax for defining LL(k) grammars on top of core.then.js.

For instance abnf.js defines the ABNF class that like RegExp accepts a textual representation of a LL(k) grammar written in the ABNF style and constructs a parsing function that is able to parse whatever the given grammar defines:

* new ABNF('[scheme ":"] ["//" host ...') - constructs a parsing function based on the given grammar
* ABNF::exec - uses the given grammar to parse an input

### Tests

Unit tests were written in the mocha's TDD style:

    npm install -g mocha
    mocha -u tdd

TODO: code coverage

### The Pattern class.

The Pattern class implements a generic parsing function. It has two methods:

* .exec(str, pos) - Parses the given input and returns the parsed result with the position where the parsing ended. If the pos parameter is omitted, .exec returns the result and makes sure the whole input was parsed.
* .then(transform) - Constructs a new pattern that invokes the parent pattern to parse input and if parsing succeeds, transforms the result with the given function.

### Pattern transformations.

Any transformation of results given by a pattern can be done via its .then method. Some transformations are very common, so they are a part of this library as core.then.js:

````js
var core = require('llkp/core.then');
var attr = core.seq(core.rgx(/\w+/), core.txt('='), core.rgx(/\w+/)).map({ key:0, val:2 })
    
attrs.exec('charset=utf8') == { key: 'charset', val: 'utf8' };
````

#### .select(index) - selects a value from an array

````js
p = ABNF("<;> 1*digit").select(1);
p.exec(";123") == ["1", "2", "3"];
````

#### .join(iKey, iVal) - joins an array of key-value pairs into a dictionary

````js
p = ABNF("1*{<;>}(1*digit <=> 1*digit)").join(0, 1);
p.exec("11=22;33=44;55=66") == { "11":"22", "33":"44", "55":"66" };
````

#### .merge(separator) - merges an array into a string

````js
p = ABNF('1*{","}number', { number : /\d+/ }).merge('+');
p.exec('123,456,789') == '123+456+789';
````

#### .as(key) - wraps the whole result into an object

````js
p = ABNF(/\d+/).as('num');
p.exec('123') == { num : '123' };
````

#### .text() - returns the text span from the input that was used to build the result

````js
p = ABNF(/\d+/).as('num').text();
p.exec('123abc') == '123'
````

#### .map({ ... }) - turns an array into a dictionary

````js
p = ABNF('key "=" val').map({ key:0, val:2 });
p.exec('charset=utf-8') == { key:'charset', val:'utf-8' };
````

#### .parseInt(radix) - turns a string into a number

````js
p = ABNF(/[a-f\d]+/).parseInt(16);
p.exec('20') == 32;
````

#### .merge(separator) - merges array elements into a string

````js
p = ABNF('*{" "}number').merge('+');
p.exec('1 2 3 4') == '1+2+3+4';
````

#### .flatten() - flattens an array of arrays into a flat array

````js
p = ABNF('*{";"}(num "=" num)').flatten();
p.exec('1=2;3=4;5=6') == [1, '=', 2, 3, '=', 4, 5, '=', 6];
````

### The ABNF syntax.

One of well known ways to describe LL(k) grammars is ABNF. This syntax is used extensively in RFC documents to define the syntax of URI, e-mail, data URL and so on. The syntax of ABNF itself can also be expressed in ABNF and such ABNF of ABNF can be found in RFC 5234.

The ABNF class uses core.thenjs (which uses core.js) to implement a parser of ABNF and build from it a parsing function. The interface of ABNF was designed after the built-in RegExp class. First take a look at the interface of RegExp:

````js
var pattern = new RegExp('(abc|def)+');
var results = pattern.exec('abcdefabc');
    
results == ['abcdefabc', 'abc'];
````

Now compare RegExp with the interface of ABNF:

````js
    var ABNF = require('llkp/abnf');

    var pattern = new ABNF('1*("abc" / "def")');
    var results = pattern.exec('abcdefabc');
    
    results == ['abc', 'def', 'abc'];
````

ABNF implements the Pattern interface: it also has the .exec and .then methods, as well as all transformation methods from the Pattern's prototype.

### The EBNF syntax.

TBD

### The PEG syntax.

TBD

### License

MIT
