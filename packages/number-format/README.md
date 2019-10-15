# number-format
A generic number formatter which supports various spreadsheet formats by using template strings. This module is based 
on the community edition of [SheetJS][sheetjs].


## Installation
```bash
$ npm install number-format
```

## Usage
```js
const NumberFormatter = require('./src/NumberFormatter');

const numberPos = 38123.45;
const numberNeg = -1234.45;
const fmtDateTime = 'ddd, dd mmm yyyy hh:mm';
const fmtNumber = '#,##0.000;[Red](#,##0.000)';
let result01; let result02; let result03; let result04;
try {
	NumberFormatter.setCulture('en-US');
	result01 = NumberFormatter.formatNumber(fmtDateTime, numberPos);
	result02 = NumberFormatter.formatNumber(fmtDateTime, numberPos, 'de-DE');
	result03 = NumberFormatter.formatNumber(fmtDateTime, numberPos);
	result04 = NumberFormatter.formatNumber(fmtNumber, numberNeg);
} catch (e) {
    // handle exception
}
console.log(result01);
console.log(result02);
console.log(result03);
console.log(result04);
// result01 is { value: 'Sun, 16 May 2004 10:48', color: null }
// result02 is { value: 'So., 16 Mai 2004 10:48', color: null }
// result03 is { value: 'Sun, 16 May 2004 10:48', color: null }
// result04 is { value: '(1,234.450)', color: 'red' }
```

## API
```js
NumberFormatter.formatNumber(fmt, number, culture);
```

**fmt** - Format that will be applied to number. String type.

**number** - Number that is formatted. Integer, float, decimal, datetime or string type.

**culture** - (optional) Culture code for localization. If culture is specified it will used localized resources,
otherwise default ones (i.e. 'en-US'). String type (i.e. ISO 639x Values).

**return value** - Formatted result or formatting exception (e.g. 'invalid format'). String or error type.

```js
NumberFormatter.setCulture(culture);
```
**culture** - Culture code for localization. Once specified, it will be used in all formatting calls.
String type (i.e. ISO 639x Values).

**return value** - void

```js
NumberFormatter.getCulture();
```
**return value** - Culture code that is currently used for localization. String type (i.e. ISO 639x Values).


## License
* [SheetJS][sheetjs] community edition is licensed under the [Apache License, Version 2.0.][apache]
* The `number-format`-module is licensed under the Eclipse Public License - see the [LICENSE][license] file for details.

## Acknowledgments

* [SheetJS][sheetjs] - The `number-format`-module modifies and enhances parts of `SheetJS`

[sheetjs]: http://sheetjs.com/opensource
[apache]: http://www.apache.org/licenses/LICENSE-2.0
[license]: ../../LICENSE
