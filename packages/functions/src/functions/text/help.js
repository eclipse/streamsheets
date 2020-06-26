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
