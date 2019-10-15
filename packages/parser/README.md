# parser

Parse a textual formula into an abstract syntax tree.


## Usage
Following is a brief overview about the parser API and its usage. For more detail please refer to class documentation.

### Parsing
Parse a simple formula:
``` js
const DEF_CONTEXT = new ParserContext();
const term = Parser.parse('2 + 2 * 2', DEF_CONTEXT);
console.log(term.value); // prints 6
```
If formula contains a function, the function must be added to *ParserContext* before.  
**Note:** there are already predefined functions available, refer to [Functions.js][functions]
``` js
const context = new ParserContext();
// add a simple SUM function
context.setFunction('SUM', (scope, ...params) => params.reduce((sum, curr) => sum + curr, 0));
// now it can be used within expression
const term = Parser.parse('sum(1, 2, 3)', context);
console.log(term.value); // prints 6
```
It is also possible to get information about a formula to parse. This is used (e.g.) by clients to provide context 
sensitive help while the user is entering a formula.
``` js
const DEF_CONTEXT = new ParserContext();
// following returns an array of all recognized info objects from left to right
let info = Parser.getFormulaInfo('2+2*2', DEF_CONTEXT);
// an alternative is to get a single info object at specified offset:
info = Parser.parseFormulaInfo('2+2*2', 2, DEF_CONTEXT);
console.log(info.value); // prints 2
console.log(info.type);  // prints number
```

### ParserContext
To allow customization of parser behaviour a *ParserContext* object is used. This object manages all known functions
as well as the creation of custom *Reference* operands (See below for an example of a custom *Reference*).
Following is a list of some important context properties:

| property | description |
| --- | --- |
| scope | scope object passed to each registered function on execution |
| ignoreErrors | flag to indicate if parsing failure should NOT throw an error, default is `false` |
| separators| object to specify decimal and parameter character for different locales |


### Term, Operand and Operation
Parsing a formula results in an abstract syntax tree, or short *AST*.
This AST is then transformed to a *Term* object which represents the formula and can be used to calculate its value.
If neither left nor right term is defined then at least a term should have an operand to return a usefull value.
#### Term
A general Term consists of an optional left and right Term and an *Operand*. If both terms (left and right) are defined
the Term usually has an operator too.
#### Example:
``` js
let term = Parser.parse('2 + 2 * 2', DEF_CONTEXT);
console.log(term.value);                 // prints 6
console.log(term.operand);               // prints undefined
console.log(term.operator.symbol);       // prints +
console.log(term.left.value);            // prints 2
console.log(term.right.operator.symbol); // prints *

term = Parser.parse('hi', DEF_CONTEXT);
console.log(term.value);        // prints hi
console.log(term.operand.type); // prints string
console.log(term.left);         // prints undefined
console.log(term.right);        // prints undefined
```
#### Operand
Operands represent a value inside a *Term*. Usually it is not necessary for an application to create an Operand but it might be usefull to
check its type. Currently following operand types are defined:

| type | description |
| --- | --- |
| BOOL | represents a boolean value, e.g.. `true` or `false` |
| NUMBER| represents a number value, e.g. 123, -34, 3.22, 0.112 |
| STRING| represents a textual value, e.g. 'hello world', '' **NOTE** returned value has no quotes |
| REFERENCE| represents a value which is defined by a referenced object |
| UNDEF| represents an undefined value |

#### Example:
``` js
const term = Parser.parse('42', DEF_CONTEXT);
const op = term.operand;
console.log(op.type);  // prints number
console.log(op.value); // prints 42
```
#### Reference Operand
A more interesting operand is *Reference*. This operand can be utilized to customize calculation of a value. 2 steps 
are necessary to register a custom *Reference* operand:
* subclass *Reference* operand and implement custom behaviour
* subclass *ParserContext* and pass it to `parse()` to return this operand for specified identifier

Following is an example of a simple Reference operand which always returns 42 as value. It is registered under the 
identifier `custom`.
#### Example:
``` js
// step 1 - create custom reference:
class CustomRef extends Reference {
  static get ID() {
    return 'custom';
  }
  get value() {
    return 42;
  }
  // required by base class, used when term is converted to string again
  toString() {
    return CustomRef.ID;
  }
}
// step 2 - create custom parser context to introduce our reference
class CustomParserContext extends ParserContext {
  // overwritten to return custom reference
  createReferenceTerm(node) {
    return (node.type === 'identifier' && node.value === CustomRef.ID) ? new CustomRef() : undefined;
  }
}
const context = new CustomParserContext();
// now parse a formula with custom context:
const term = Parser.parse('custom * 2', context);
console.log(term.value); // prints 84
```

#### Operator
Operators define the operation which should be applied to *Term* values during calculation of total formula value.
Each operator consists of a symbol to identify it and a function to perform the actual operation.  
Following table lists all currently defined operators:

| symbol | description |
| --- | --- |
| + | binary operator: addition |
| - | binary operator: subtraction |
| % | binary operator: remainder |
| * | binary operator: multiplication |
| / | binary operator: division |
| ^ | binary operator: exponentiation |
| ! | unary operator: negate |
| + | unary operator: positive |
| - | unary operator: negative |
| % | unit operator: percentage |
| != | boolean operator: not equal |
| <> | boolean operator: not equal |
| = | boolean operator: equal |
| == | boolean operator: equal |
| > | boolean operator: greater |
| >= | boolean operator: greater than |
| < | boolean operator: less |
| <= | boolean operator: less than |
| & | boolean operator: and |
| \| | boolean operator: or |
| ? | condition operator: if |

 To implement a custom operator or to replace an existing one it is best to use one of the predefined operators of 
 following type:

| type | class | description |
| --- | --- | --- |
| GENERAL | Operator | base class which describes a general operation and does nothing |
| BINARY | BinrayOperator | works on two values |
| BOOL | BoolOperator | works on one or two boolean values and returns a boolean |
| CONDITION | ConditionOperator | works on 3 values: condition and return values for if true or false |
| UNARY | UnaryOperation | works on a single value only |
| UNIT | UnitOperation | a special unary operation |

As an example we replace the addition operation and register a custom concatination operator.   
**Note:** when registering a new operation a precedence value must be specified.
#### Example:
``` js
// import parser Operation module which contains all operators
const { BinaryOperator, Operation } = require('@cedalo/parser');
// implement and register a concat operation
class ConcatOperator extends BinaryOperator {
  constructor() {
    super('&');
  }
  calc(left, right) {
    return  `${left.value}${right.value}`;
  }
}
Operation.register(new ConcatOperator(), 7);
// replace add-operation by using a BinaryOperator
Operation.set(new BinaryOperator('+', (left, right) => left + right));
```

### Functions
This parser module comes with some predefined functions already added to the default *ParserContext*. But it is possible
to add new functions or replace any of the predefined ones by registering a different function implementation under the
same name. For a list of all predefined functions please refer to [Functions.js][functions].   
Each function is called with the current *scope*, as defined in *ParserContext*, and a list of *Term*s as parameters.   
**Note:** the name used to register a function is handled case insensitive!
#### Example:
``` js
const context = new ParserContext();
// replace SUM function:
context.setFunction('sum', (scope, ...params) => {
  // each param is a Term object
  return params.reduce((sum, param) => sum + param.value, 0);
});
// register a PI function
context.setFunction('pi', (scope, ...params) => Math.PI);
// use:
console.log(Parser.parse('sum(2, -2)', context).value); // prints 0
console.log(Parser.parse('pi()', context).value);       // prints 3.141...
```

### Errors
If parsing a formula fails a *ParserError* is thrown which contains an error code and a corresponding error message to
indicate the type of error. For a list of all defined error codes please refer to [ErrorCode.js][errors].



## Run Tests
All tests are written with [`jest`][jest] and can be run using npm.
``` bash
npm test
```


## Authors
* [**Cedalo AG**][cedalo]


## License
This project is licensed under the Eclipse Public License - see the [LICENSE][license] file for details.


[cedalo]: https://cedalo.com
[jest]: https://jestjs.io
[license]: ../../LICENSE
[functions]: https://github.com/cedalo/streamsheets/tree/master/packages/parser/src/Functions.js
[parser]: https://github.com/cedalo/streamsheets/tree/master/packages/parser/src/Parser.js
[errors]: https://github.com/cedalo/streamsheets/tree/master/packages/parser/src/ErrorCodes.js

