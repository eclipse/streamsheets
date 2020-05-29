/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
/**
 * Utility class which provides static method to handle <code>String</code> related tasks.</br>
 *
 * @class Strings
 * @constructor
 */
class Strings {
	/**
	 * Checks, if passed parameter is a string.</br>
	 * Note: this returns <code>true</code> even for <code>new String()</code> objects!
	 *
	 * @method isString
	 * @param {String} toTest Variable to check.
	 * @return {Boolean} True, if variable is a String, otherwise false.
	 * @static
	 */
	static isString(toTest) {
		// slow... return toTest != undefined && Object.prototype.toString.call(toTest) == "[object String]";
		return typeof toTest === 'string' || toTest instanceof String;
		// faster in chrome26, ff20 but not in ie9
	}

	/**
	 * Checks, if passed strings are equal ignoring any capitalization.</br>
	 *
	 * @method areEqualIgnoreCase
	 * @param {String} str1 First string to compare.
	 * @param {String} str2 Second string to compare.
	 * @return {Boolean} <<code>True</code> if both strings are equal ignoring capitalization otherwise
	 * <code>false</code>.
	 * @static
	 * @since 2.1.0.5
	 */
	static areEqualIgnoreCase(str1, str2) {
		const s1 = str1 && str1.toLowerCase();
		const s2 = str2 && str2.toLowerCase();
		return s1 === s2;
	}

	/**
	 * Checks whether a given string is contained within another string.
	 *
	 * @method contains
	 * @param {String} str The containment string to check.
	 * @param {String} contain The string to check for.
	 * @return {Boolean} <code>true</code>, if string is contained, otherwise <code>false</code>.
	 * @static
	 * @deprecated Not used. Subject to remove!
	 */
	static contains(str, contain) {
		return str.indexOf(contain) !== -1;
	}

	/**
	 * Checks if a given string starts with another string.
	 *
	 * @method startsWith
	 * @param {String} str The string to check.
	 * @param {String} prefix The prefix to look for.
	 * @return {Boolean} <code>true</code>, if string starts with given string, otherwise <code>false</code>.
	 * @static
	 */
	static startsWith(str, prefix) {
		return str.slice(0, prefix.length) === prefix;
	}

	/**
	 * Checks if a given string ends with another string.
	 *
	 * @method endsdWith
	 * @param {String} str The string to check.
	 * @param {String} suffix The suffix to look for.
	 * @return {Boolean} <code>true</code>, if string ends with given string, otherwise <code>false</code>.
	 * @static
	 */
	static endsWith(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}

	/**
	 * Cuts off a substring from given string. The substring is specified by start end end strings. That means the
	 * returned string is the substring between the first occurrence of defined start and end string (exclusively).
	 * <br/>
	 *
	 * @method cut
	 * @param {String} str String to cut off from.
	 * @param {String} [startStr] The leading string to start cut off. If not given returned substring starts at 0.
	 * @param {String} [endStr] The ending string to cut off. If not given returned substring ends at string length.
	 * @return {String} The substring between start and end strings.
	 * @static
	 * @since 1.6.0
	 */
	static cut(str, startStr, endStr) {
		let end;
		let start = str.indexOf(startStr);

		start = start > -1 ? start + startStr.length : -1;
		end = endStr ? str.indexOf(endStr, start) : -1;
		if (start > -1) {
			end = end > -1 ? end : undefined;
			return str.substring(start, end);
		}
		return str;
	}

	/**
	 * Strips of specified start and end strings from a given string. <br/>
	 *
	 * @method strip
	 * @param {String} str String to be stripped.
	 * @param {String} [startStr] A leading string which should be removed from given string.
	 * @param {String} [endStr] An ending which should be removed from given string.
	 * @return {String} The substring between specified start and end strings.
	 * @static
	 * @since 1.6.43
	 */
	static strip(str, startStr, endStr) {
		if (startStr && Strings.startsWith(str, startStr)) {
			str = str.substring(startStr.length);
		}
		if (endStr && Strings.endsWith(str, endStr)) {
			str = str.substring(0, str.length - endStr.length);
		}
		return str;
	}

	/**
	 * Insert given string at given position.
	 *
	 * @method insert
	 * @param {String} str String to insert into.
	 * @param {Number} index Index to insert string at.
	 * @param {String} insert String to insert.
	 * @return {String} New string including insertion.
	 * @static
	 */
	static insert(str, index, insert) {
		if (index > 0) {
			return (
				str.substring(0, index) +
				insert +
				str.substring(index, str.length)
			);
		}
		return insert + str;
	}

	/**
	 * Removes given amount of characters from given string, starting at specified position.
	 *
	 * @method remove
	 * @param {String} str String to remove characters from.
	 * @param {Number} index Index where to start removal.
	 * @param {Number} charcount Number of characters to remove.
	 * @return {String} Result string.
	 * @static
	 */
	static remove(str, index, charcount) {
		return str.substr(0, index) + str.substr(index + charcount);
	}

	/**
	 * Checks, if passed string is empty.</br>
	 * Empty means that passed string is either undefined or has no length.
	 *
	 * @method isEmpty
	 * @param {String} toTest String to check.
	 * @return {Boolean} <code>true</code> if passed string is either <code>undefined</code> or has no length,
	 * <code>false</code> otherwise.
	 * @static
	 * @deprecated Not used. Subject to remove!
	 */
	static isEmpty(toTest) {
		return toTest === undefined || toTest === '';
	}

	static compare(str1, str2, ignoreCase) {
		if (ignoreCase) {
			return String(str1).toUpperCase() === String(str2).toUpperCase();
		}

		return str1 === str2;
	}

	/**
	 * Encodes this string. Special characters (<, >, %, &, ", \n, are encoded using '~??' instead of '%??'.
	 *
	 * @method encode
	 * @param {String} str The string to encode.
	 * @return {String} Encoded copy of this string
	 * @static
	 */
	static encode(str) {
		str = str.replace(/%/g, '~25');
		str = str.replace(/&/g, '~26');
		str = str.replace(/"/g, '~22');
		str = str.replace(/\\/g, '~5C');
		str = str.replace(/</g, '~3C');
		str = str.replace(/>/g, '~3E');
		str = str.replace(/\n/g, '~0A');
		str = str.replace(/'/g, '~27');
		// str = str.replace(/\s/g, " ");
		str = encodeURIComponent(str);
		return str;
	}

	/**
	 * Decodes this string. Special characters (<, >, %, &, ", \n, are decoded regarding '~??' instead of '%??'
	 *
	 * @method decode
	 * @param {String} str The string to decode.
	 * @return {String} Decoded copy of this string.
	 * @static
	 */
	/**
	 * Decodes this string. Special characters (<, >, %, &, ", \n, are decoded regarding '~??' instead of '%??'
	 *
	 * @method decode
	 * @param {String} str The string to decode.
	 * @return {String} Decoded copy of this string.
	 * @static
	 */
	static decode(str) {
		const { length } = str;
		let i;
		let strReplace = '';

		// TODO: measure against https://stackoverflow.com/questions/39646962/
		// replace-multiple-different-characters-with-different-values-javascript

		for (i = 0; i < length; i += 1) {
			if (str[i] === '~') {
				i += 1;
				switch (str[i]) {
					case '0':
						strReplace += '\n';
						i += 1;
						break;
					case '2':
						i += 1;
						switch (str[i]) {
							case '2':
								strReplace += '"';
								break;
							case '5':
								strReplace += '~25';
								break;
							case '6':
								strReplace += '&';
								break;
							case '7':
								strReplace += "'";
								break;
							default:
								break;
						}
						break;
					case '3':
						i += 1;
						switch (str[i]) {
							case 'C':
								strReplace += '<';
								break;
							case 'E':
								strReplace += '>';
								break;
							default:
								break;
						}
						break;
					case '5':
						strReplace += '\\';
						i += 1;
						break;
					default:
						break;
				}
			} else {
				strReplace += str[i];
			}
		}

		// return decodeURIComponent(strReplace);
		//
		//
		// str = str.replace(/~26/gi, "&");
		// str = str.replace(/~22/gi, "\"");
		// str = str.replace(/~5C/gi, "\\");
		// str = str.replace(/~3C/gi, "<");
		// str = str.replace(/~3E/gi, ">");
		// str = str.replace(/~0A/gi, "\n");
		// str = str.replace(/~27/gi, "\'");

		try {
			str = decodeURIComponent(strReplace);
		} catch (ex) {
			// console.log(ex);
			str = strReplace;
		}

		// percent must be replaced after decode!
		return str.replace(/~25/gi, '%');
	}
	/**
	 * Encodes given string assuming it represents XML.
	 *
	 * @method encodeXML
	 * @param {String} xml The XML string to encode.
	 * @return {String} Encoded XML string.
	 * @static
	 */
	static encodeXML(xml) {
		return xml
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;')
			.replace(/\n/g, '&xA;');
	}

	/**
	 * Decodes given string assuming it represents XML.
	 *
	 * @method decodeXML
	 * @param {String} xml The XML string to decode.
	 * @return {String} Decoded XML string.
	 * @static
	 */
	static decodeXML(xml) {
		return xml
			.replace(/&apos;/g, "'")
			.replace(/&quot;/g, '"')
			.replace(/&gt;/g, '>')
			.replace(/&lt;/g, '<')
			.replace(/&amp;/g, '&')
			.replace(/&xA;/g, '\n');
	}

	static wmatch(find, source) {
		if (find === '') {
			return false;
		}
		// find = find.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, '\\$&');
		find = find.replace(/[-[\]/{}()+.\\^$|]/g, '\\$&');
		find = find.replace(/\*/g, '.*');
		find = find.replace(/\?/g, '.');
		const regEx = new RegExp(`^${find}$`, 'i');

		return regEx.test(source);
	}
}

module.exports = Strings;
