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
module.exports = {
	functionList: {
		CHAR: {
			default: {
				category: 'text',
				description: 'Returns the character represented by given number.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'A number between 1 and 255 which specifies the character to return.',
						optional: false
					},
					{
						type: '',
						name: 'CharacterSet',
						description: 'A string which specifies the character set to use for converting the number. Only the \'ansi\' alias \'cp1252\' set is currently supported. If no character-set is specified \'ansi\' is used by default.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The character as specified by given number.'
				},
				examples: {
					formulas: [
						{
							formula: '=CHAR(65)',
							result: 'A'
						},
						{
							formula: '=CHAR(128)',
							result: '€'
						},
						{
							formula: '=CHAR(128, "ansi")',
							result: '€'
						}
					]
				}
			}
		},
		CLEAN: {
			default: {
				category: 'text',
				description: 'Removes all nonprintable characters from given string. Note: by default CLEAN removes only the characters corresponding to ASCII code 0 to 31. To remove characters with ASCII code 127, 129, 141, 143, 144 and 157 set the optional extended flag to true.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'A string for which to remove the nonprintable characters.',
						optional: false
					},
					{
						type: '',
						name: 'Extended',
						description: 'A boolean flag which indicates that the characters which correspond to the ASCII codes 127, 129, 141, 143, 144 and 157 should be removed too. Default is false.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The text without nonprintable characters.'
				},
				examples: {
					formulas: [
						{
							formula: '=CLEAN(CONCAT(CHAR(9), "Hello World", CHAR(10), CHAR(33)))',
							result: 'Hello World!'
						}
					]
				}
			}
		},
		CODE: {
			default: {
				category: 'text',
				description: 'Returns the numeric code for first character of given string.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'A string for which to return the code of its first character.',
						optional: false
					},
					{
						type: '',
						name: 'CharacterSet',
						description: 'A string which specifies the character set to use for converting the character. Only the \'ansi\' alias \'cp1252\' set is currently supported. If no character-set is specified \'ansi\' is used by default.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The numeric code of first character of specified text.'
				},
				examples: {
					formulas: [
						{
							formula: '=CODE("A")',
							result: '65'
						},
						{
							formula: '=CODE("€")',
							result: '128'
						},
						{
							formula: '=CODE("€", "ansi")',
							result: '128'
						}
					]
				}
			}
		},
		CONCAT: {
			default: {
				category: 'text',
				description: 'Turns values of specified cells or cell-ranges into a string.',
				arguments: [
					{
						type: '',
						name: 'Value1',
						description: 'First string to concatenate',
						optional: false
					},
					{
						type: '',
						name: 'Value2, ...',
						description: 'Additional strings to concatenate.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Concatenated string value.'
				},
				examples: {
					formulas: [
						{
							formula: '=CONCAT("My ", "home is my", " castle")',
							result: 'My home is my castle.'
						}
					]
				}
			}
		},
		FIND: {
			default: {
				category: 'text',
				description: 'Finds text within a string value (case-sensitive).',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'A string value to look for.',
						optional: false
					},
					{
						type: '',
						name: 'WithinText',
						description: 'A string value to look in.',
						optional: false
					},
					{
						type: '',
						name: 'FromPos',
						description: 'A start position which specifies the first character to start the search at. Default is 1.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Returns the place where to find the searched character in the string.'
				},
				examples: {
					formulas: [
						{
							formula: '=FIND("of", "Tip of the day")',
							result: '5'
						}
					]
				}
			}
		},
		LEFT: {
			default: {
				category: 'text',
				description: 'Excerpts a given number of characters from the left side of a string.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'Text to excerpt string from.',
						optional: false
					},
					{
						type: '',
						name: 'NumChars',
						description: 'Number, which specifies the amount of characters to return. Default is 1.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Extracted characters from the beginning of specified Text.'
				},
				examples: {
					formulas: [
						{
							formula: '=LEFT("SampleText", 3)',
							result: '"Sam"'
						},
						{
							formula: '=LEFT("Down")',
							result: '"D"'
						}
					]
				}
			}
		},
		LEN: {
			default: {
				category: 'text',
				description: 'Counts characters in given text.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'Text to count characters of.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Number of characters in Text.'
				},
				examples: {
					formulas: [
						{
							formula: '=LEN("Somewhere")',
							result: '9'
						}
					]
				}
			}
		},
		LOWER: {
			default: {
				category: 'text',
				description: 'Converts the letters of a given string to lowercase. To convert text to uppercase please refer to UPPER.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'A string to convert to lowercase',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Given text in lowercase.'
				},
				examples: {
					formulas: [
						{
							formula: '=LOWER("HeLLo!")',
							result: 'hello!',
							comment: 'only affects letters in uppercase'
						},
						{
							formula: '=LOWER(A1)',
							result: 'hello world',
							comment: 'assumes cell A1 contains text "Hello WORLD"'
						}
					]
				}
			}
		},
		MID: {
			default: {
				category: 'text',
				description: 'Return the given amount of characters starting at the given index from a string.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'Text to extract string from.',
						optional: false
					},
					{
						type: '',
						name: 'Index',
						description: 'Index to start extracting from.',
						optional: false
					},
					{
						type: '',
						name: 'Count',
						description: 'Number of characters to extract.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The text that that is extracted from the given text using the arguments.'
				},
				examples: {
					formulas: [
						{
							formula: '=MID("SampleText", 3, 2)',
							result: '"pl"'
						}
					]
				}
			}
		},
		RANDID: {
			default: {
				category: 'text',
				description: 'Creates a random key with the given amount of chars.',
				arguments: [
					{
						type: '',
						name: 'Length',
						description: 'Length of key to generate. The longer the key, the higher the probability of receiving a unique key.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Random key as String.'
				},
				examples: {
					formulas: [
						{
							formula: '=RANDID(7)',
							result: 'e.g.: Z83hab4',
							comment: 'The return value can be any combination of characters and numbers.'
						}
					]
				}
			}
		},
		REPLACE: {
			default: {
				category: 'text',
				description: 'Replaces part of a string value, based on the number of specified characters, with a different text.',
				arguments: [
					{
						type: '',
						name: 'OldText',
						description: 'String in which to replace characters.',
						optional: false
					},
					{
						type: '',
						name: 'StartAt',
						description: 'Character position in OldText at which replace starts.',
						optional: false
					},
					{
						type: '',
						name: 'NumChars',
						description: 'Number of characters from StartAt to be replaced by NewText.',
						optional: false
					},
					{
						type: '',
						name: 'NewText',
						description: 'The text which will replace specified characters in OldText.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The replaced Text.'
				},
				examples: {
					formulas: [
						{
							formula: '=REPLACE("Replace me now", 12, 3, "later")',
							result: '"Replace me later"'
						}
					]
				}
			}
		},
		REPT: {
			default: {
				category: 'text',
				description: 'Repeats given text a specified number of times',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'Text to repeat.',
						optional: false
					},
					{
						type: '',
						name: 'NumTimes',
						description: 'Positive number which defines the number of times to repeat text. If NumTimes is 0, REPT returns an empty string.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Repeated text string.'
				},
				examples: {
					formulas: [
						{
							formula: '=REPT("Sample", 3)',
							result: '"SampleSampleSample"'
						}
					]
				}
			}
		},
		RIGHT: {
			default: {
				category: 'text',
				description: 'Excerpts a given number of characters from the right side of a string.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'Text to excerpt string from.',
						optional: false
					},
					{
						type: '',
						name: 'NumChars',
						description: 'Number, which specifies the amount of characters to return. Default is 1.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Extracted characters from the end of specified Text.'
				},
				examples: {
					formulas: [
						{
							formula: '=RIGHT("SampleText", 3)',
							result: '"ext"'
						},
						{
							formula: '=RIGHT("Down")',
							result: '"n"'
						}
					]
				}
			}
		},
		SEARCH: {
			default: {
				category: 'text',
				description: 'Return the index of the search text within the text. The search starts at index.',
				arguments: [
					{
						type: '',
						name: 'TextToSearch',
						description: 'Text to search for. **Note:** wildcards like * or ? are supported.',
						optional: false
					},
					{
						type: '',
						name: 'Text',
						description: 'Text to search inside.',
						optional: false
					},
					{
						type: '',
						name: 'StartAt',
						description: 'Character index to start search at. Default is 1.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'Position, where the text is found, otherwise #VALUE.'
				},
				examples: {
					formulas: [
						{
							formula: '=SEARCH("me", "Search me now")',
							result: '8'
						},
						{
							formula: '=SEARCH("a*c", "abc")',
							result: '1'
						}
					]
				}
			}
		},
		SPLIT: {
			default: {
				category: 'text',
				description: 'Splits a given text by using a specified separator and returns the part at given optional index. If the text does not contain the specified separator, the complete text is returned.The index parameter is optional. If not specified, the first part is returned. The Separator splits a text in parts. 1 returns the first part, 2 the second part, 3 the third and so on.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'Text to split.',
						optional: false
					},
					{
						type: '',
						name: 'Separator',
						description: 'Separator used to split text.',
						optional: false
					},
					{
						type: '',
						name: 'Index',
						description: 'Number which specifies the part to return. Defaults to 1.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The part of text at specified index.'
				},
				examples: {
					formulas: [
						{
							formula: '=SPLIT("cedalo/topic", "/", 2)',
							result: 'topic',
							comment: 'Returns the second part of splitted text.'
						},
						{
							formula: '=SPLIT("cedalo/topic", "/")',
							result: 'cedalo',
							comment: 'No index is given so first part is returned by default.'
						},
						{
							formula: '=SPLIT("cedalo/test/topic", "/", 5)',
							result: 'topic',
							comment: 'Index exceeds number of parts, so return last one.'
						},
						{
							formula: '=SPLIT("cedalo/test/topic", "+", 2)',
							result: 'cedalo/test/topic',
							comment: 'Separator is not contained within text, so return complete text.'
						}
					]
				}
			}
		},
		SUBSTITUTE: {
			default: {
				category: 'text',
				description: 'Substitutes a text string with a new text.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'Text for which to substitute characters.',
						optional: false
					},
					{
						type: '',
						name: 'OldText',
						description: 'The text to be replaced.',
						optional: false
					},
					{
						type: '',
						name: 'NewText',
						description: 'The text which will replace specified OldText.',
						optional: false
					},
					{
						type: '',
						name: 'Occurrence',
						description: 'Specifies which occurrence of OldText to be replaced by NewText. If not specified every occurrence of OldText will be replaced.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'A string value with replaced text.'
				},
				examples: {
					formulas: [
						{
							formula: '=SUBSTITUTE("Replace me now", "now", "later")',
							result: '"Replace me later"'
						}
					]
				}
			}
		},
		TEXT: {
			default: {
				category: 'text',
				description: 'Formats a number and converts it to text.',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'A number value to format and convert.',
						optional: false
					},
					{
						type: '',
						name: 'FormatString',
						description: 'A format string. Example format strings are:<br /> “$#,##.00” currency with a thousands separator and 2 decimals<br /> “MM/DD/YY” Date in format month/day/year, like 03/14/18 <br /> “DDDD” Day of week, like Monday <br />“H:MM AM/PM” time, like 1:29 PM <br /> “0.0%” percentage, like 28.5%<br /> “# ?/?” fraction, like 4 1/3<br /> “0.00E+00” scientific notation, like 1.22E+07 <br /> “0000000” add leading zeros, like 0001234',
						optional: false
					},
					{
						type: '',
						name: 'Locale',
						description: 'An locale code. Currently only “en” and “de” are supported. Defaults to current App locale.',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'A formatted string representation of given number value.'
				},
				examples: {
					formulas: [
						{
							formula: '=TEXT(3456, "#,##0.00")',
							result: '3,456.00 (assuming the App language is set to english)'
						}
					]
				}
			}
		},
		UNICHAR: {
			default: {
				category: 'text',
				description: 'Returns the character represented by given unicode number. :::info Unicodes UTF-8 & UTF-16 are supported, so the provided number must be within 0 - 65535. :::',
				arguments: [
					{
						type: '',
						name: 'Number',
						description: 'An unicode number within 0-65535 which specifies the character to return.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The character as specified by given unicode number.'
				},
				examples: {
					formulas: [
						{
							formula: '=UNICHAR(65)',
							result: 'A'
						},
						{
							formula: '=UNICHAR(8364)',
							result: '€'
						},
						{
							formula: '=UNICHAR(0)',
							result: '#VALUE!'
						}
					]
				}
			}
		},
		UNICODE: {
			default: {
				category: 'text',
				description: 'Returns the unicode number for first character of given string.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'A string for which to return the unicode of its first character.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'The unicode number of first character of specified text.'
				},
				examples: {
					formulas: [
						{
							formula: '=UNICODE("A")',
							result: '65'
						},
						{
							formula: '=UNICODE("€")',
							result: '8364'
						}
					]
				}
			}
		},
		UPPER: {
			default: {
				category: 'text',
				description: 'Converts the letters of a given string to uppercase. To convert text to lowercase please refer to LOWER.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'A string to convert to uppercase',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'Given text in uppercase.'
				},
				examples: {
					formulas: [
						{
							formula: '=UPPER("nIcE 4 u!")',
							result: 'NICE 4 U!',
							comment: 'only affects letters in lowercase'
						},
						{
							formula: '=UPPER(A1)',
							result: 'HELLO WORLD',
							comment: 'assumes cell A1 contains text "hello world"'
						}
					]
				}
			}
		},
		VALUE: {
			default: {
				category: 'text',
				description: 'Converts a textual number representation to a number.',
				arguments: [
					{
						type: '',
						name: 'Text',
						description: 'A string representing a number value.',
						optional: false
					},
					{
						type: '',
						name: 'Locale',
						description: 'An optional locale code. Currently only "en" and "de" are supported. Defaults to current App locale.',
						optional: false
					}
				],
				return: {
					type: '',
					description: 'A number or #VALUE! if given Text cannot be converted.'
				},
				examples: {
					formulas: [
						{
							formula: '=VALUE("22.45")',
							result: '22.45'
						},
						{
							formula: '=VALUE("22,45", "de")',
							result: '22,45'
						},
						{
							formula: '=VALUE("hello", "de")',
							result: '#VALUE!'
						}
					]
				}
			}
		}
	},
	en: 'Text',
	de: 'Text',
	functions: {
		CHAR: {
			en: {
				argumentList: 'Number,CharacterSet',
				description: 'Returns the character represented by given number'
			},
			de: {
				argumentList: 'Zahl,CharacterSet',
				description: 'Liefert das Zeichen, das der angegebenen Zahl entspricht, zurück'
			}
		},
		CLEAN: {
			en: { argumentList: 'Text,Extended', description: 'Removes all non-printable characters from given text' },
			de: {
				argumentList: 'Text,Extended',
				description: 'Entfernt alle nicht darstellbaren Zeichen des übergebenen Textes'
			}
		},
		CODE: {
			en: {
				argumentList: 'Text,CharacterSet',
				description: 'Returns the numeric code for the first character of given text'
			},
			de: {
				argumentList: 'Text,CharacterSet',
				description: 'Gibt die Zahl, die dem 1. Zeichen des übergebenen Textes entspricht, zurück'
			}
		},
		CONCAT: {
			en: {
				argumentList: 'Value1,ValueN',
				description: 'Combines values of specified cells or cell ranges to one string'
			},
			de: {
				argumentList: 'Wert1,WertN',
				description: 'Fügt alle Werte der angegebenen Zellen oder Zellbereiche zu einem Text zusammen'
			}
		},
		FIND: {
			en: {
				argumentList: 'Text,WithinText,FromPos',
				description: 'Returns index of first character of Text in WithinText if found, otherwise #VALUE!'
			},
			de: {
				argumentList: 'Text,InText,StartAnPos',
				description: 'Liefert den Index des ersten Zeichens von Text in InText zurück oder #VALUE!'
			}
		},
		LEFT: {
			en: {
				argumentList: 'Text,NumChars',
				description: 'Return the given amount of characters starting at the beginning of the text'
			},
			de: {
				argumentList: 'Text,Anzahl',
				description: 'Gibt die gegebenen Anzahl von Zeichen vom Anfang des Textes zurück'
			}
		},
		LEN: {
			en: { argumentList: 'Text', description: 'Counts characters in given text' },
			de: { argumentList: 'Text', description: 'Zählt die Anzahl der Zeichen im Text' }
		},
		LOWER: {
			en: { argumentList: 'Text', description: 'Converts given text to lowercase' },
			de: { argumentList: 'Text', description: 'Wandelt den übergebenen Text in Kleinbuchstaben um' }
		},
		MID: {
			en: {
				argumentList: 'Text,Index,Count',
				description: 'Return the given amount of characters starting at the given index'
			},
			de: {
				argumentList: 'Text,Index,Anzahl',
				description: 'Gibt die gegebenene Anzahl von Zeichen ab dem angebenenen Index innerhalb Textes zurück'
			}
		},
		RANDID: {
			en: { argumentList: 'Length', description: 'Creates a random key with the given amount of chars' },
			de: {
				argumentList: 'Länge',
				description: 'Erzeugt einen Schlüsselstring mit der angegebenen Anzahl Zeichen'
			}
		},
		REPLACE: {
			en: {
				argumentList: 'OldText,StartPos,NumChars,NewText',
				description: 'Replaces the amount of characters in text at specified start position with new text'
			},
			de: {
				argumentList: 'BisherigerText,StartPos,Anzahl,MitText',
				description:
					'Ersetzt die angegebene Anzahl an Zeichen im Text an angegebener Position durch einen neuen Text'
			}
		},
		REPT: {
			en: { argumentList: 'Text,NumTimes', description: 'Repeats given text specified number of times' },
			de: { argumentList: 'Text,Anzahl', description: 'Wiederholt den Text so oft wie durch Anzahl festgelegt' }
		},
		RIGHT: {
			en: {
				argumentList: 'Text,NumberOfCharacters',
				description: 'Return the given amount of characters from the end of the text'
			},
			de: {
				argumentList: 'Text,AnzahlZeichen',
				description: 'Gibt die gegebenen Anzahl von Zeichen vom Ende des Textes zurück'
			}
		},
		SEARCH: {
			en: {
				argumentList: 'TextToSearch,Text,StartingAt',
				description: 'Return the index of the search text within the text. The search starts at index'
			},
			de: {
				argumentList: 'Suchtext,Text,BeginneMitZeichen',
				description: 'Gibt den Index des ersten Auftretens des Suchtextes im Text aus, beginnend beim Index'
			}
		},
		SPLIT: {
			en: {
				argumentList: 'Text,Separator,Index',
				description: 'Splits given text by using specified separator and returns the part at given index'
			},
			de: {
				argumentList: 'Text,Separator,Index',
				description:
					'Unterteilt den Text anhand des Separators und liefert das durch Index spezifizierte Teilstück zurück'
			}
		},
		SUBSTITUTE: {
			en: {
				argumentList: 'Text,OldText,NewText,Occurrence',
				description: 'Substitute specified text in given old text with new text'
			},
			de: {
				argumentList: 'Text,OriginalerText,NeuerText,Vorkommen',
				description: 'Ersetzt angegebenen Text im originalen Text durch einen neuen Text'
			}
		},
		TEXT: {
			en: {
				argumentList: 'Number,FormatString,Locale',
				description: 'Formats given number and converts it to text'
			},
			de: {
				argumentList: 'Zahl,FormatString,Sprache',
				description: 'Formatiert und wandelt die angegebene Zahl in einen Text um'
			}
		},
		UNICHAR: {
			en: { argumentList: 'Number', description: 'Returns the character represented by given unicode number' },
			de: {
				argumentList: 'Zahl',
				description: 'Liefert das Zeichen, das der angegebenen unicode-Zahl entspricht, zurück'
			}
		},
		UNICODE: {
			en: {
				argumentList: 'Text',
				description: 'Returns the numeric unicode for the first character of given text'
			},
			de: {
				argumentList: 'Text',
				description: 'Gibt die unicode-Zahl, die dem 1. Zeichen des übergebenen Textes entspricht, zurück'
			}
		},
		UPPER: {
			en: { argumentList: 'Text', description: 'Converts given text to uppercase' },
			de: { argumentList: 'Text', description: 'Wandelt den übergebenen Text in Großbuchstaben um' }
		},
		VALUE: {
			en: {
				argumentList: 'Text,Locale',
				description: 'Converts given text to number using optional locale code'
			},
			de: {
				argumentList: 'Text,Locale',
				description: 'Konvertiert den Text in eine Zahl unter Berücksichtigung des optionalen Länder-Codes'
			}
		}
	}
};
