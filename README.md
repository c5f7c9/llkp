llkp
====

# LL(k) parsers: ABNF, EBNF, PEG, etc.

The goal of this library is to provide API that would look like the built-in RegExp class and would be able to parse structures that cannot be parsed with regular expressions, such as XML-like structures, the e-mail pattern defined in RFC 822, the data URL pattern and so on.

# The idea of the library.

The core of this library is a set of simple parsing functions that read input and return results of parsing: numbers, arrays, dictionaries and so on. Two such functions read the input directly:

* The **txt** function that just compares the input with a fixed given string and returns that string if it matches the input.
* The **rgx** function that does the same, but compares the input with a given regular expression. For instance, **rgx(/[a-zA-Z$_][a-zA-Z$_0-9]/)** is able to parse a valid name of a JS varaible.

Then a few parsing function that combine other parsing functions into more complex patterns allow to build parsers of almost any complexity:

* **opt** - makes a pattern optional
* **any** - makes an alternation pattern that matches any of the given patterns
* **seq** - makes a sequence pattern that applies given patterns one by one to the input
* **rep** - makes a repetition of a pattern
* **exc** - makes a pattern that matches the first but not the second pattern

In addition to that every pattern can be amended by a custom transformation that will modify results of parsing the input with that pattern. This is achieved by the **then** method that creates another pattern based on existing one and a given transformation function. So if there is a pattern **attrs** that reads a sequence of key-value pairs and returns them as an array of arrays, it's possible to use **attrs.then** method to create another pattern **attrs2** that will parse the same key-value sequences but will return them as a dictionary.

It's quite obvious that with these parsing functions it's possible to write a LL(k) parser of a grammar written in ABNF, EBNF or PEG and then reconstitute from that textual representation a parsing function that will parse whatever the grammar defines, so it'll be possible to write in JS something like this:

    var uri_pattern = new EBNF('[scheme ":"] ["//" host [":" port]] ["/" path] ["?" query]');
    var uri_parts = uri_pattern.exec('https://github.com:80/.../?qw=123');

    if (uri_parts.scheme == 'https')
        ...

# The structure of the library.

The core parsing functions are kept in a file that can be used as a separate lightweight library for constructing parsing functions manually. On top of the core parsing functions there will be [TBD] a few RegExp-like classes that will implement different ways of defining a LL(k) grammar (ABNF, EBNF, PEG).

* core.js - The core parsing functions that can be used as a separate library.
* abnf.js [TBD] - The ABNF syntax for defining LL(k) grammars.
* ebnf.js [TBD] - The EBNF syntax for defining LL(k) grammars.
* peg.js [TBD] - The PEG syntax for defining LL(k) grammars.

For instance abnf.js will define the ABNF class that like RegExp will accept a textual representation of a LL(k) grammar written in the ABNF style and will construct a parsing function that will be able to parse whatever the given grammar defines:

* new ABNF('[scheme ":"] ["//" host ...') - will construct a parsing function based on the given grammar
* ABNF::exec - will use the given grammar to parse an input

# Tests

Unit tests were written in the mocha's TDD style:

    npm install -g mocha
    mocha -u tdd

# License

MIT
