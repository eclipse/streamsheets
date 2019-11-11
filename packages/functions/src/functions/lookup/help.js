module.exports = {
	en: 'Lookup',
	de: 'Verweisen',
	functions: {
		CHOOSE: {
			en: {
				argumentList: 'Index,Value1,ValueN',
				description: 'Returns the value at specified index from parameter list'
			},
			de: {
				argumentList: 'Index,Wert1,WertN',
				description: 'Gibt den Wert an der angebgebenen Stelle in der Parameterliste zurück'
			}
		},
		COLUMN: {
			en: { argumentList: 'Reference', description: 'Returns the column number of given cell reference' },
			de: { argumentList: 'Referenz', description: 'Ermittelt die Spaltennummer der angegebenen Zellreferenz' }
		},
		INDEX: {
			en: {
				argumentList: 'Range,Row,Column',
				description: 'Returns a cell within the range using the row and column offset'
			},
			de: {
				argumentList: 'Bereich,Zeile,Spalte',
				description: 'Ermittelt die Zelle aus dem Bereich mit dem Zeilen und Spaltenverweis'
			}
		},
		MATCH: {
			en: {
				argumentList: 'Value,SearchRange,MatchType',
				description: 'Returns relative column index of matching cell inside specified cell range'
			},
			de: {
				argumentList: 'Wert,Suchbereich,Vergleichstyp',
				description:
					'Liefert den relativen Spaltenindex, innerhalb des Zellbereichs, der Zelle zurück, die mit dem gegebenen Wert übereinstimmt '
			}
		},
		OFFSET: {
			en: {
				argumentList: 'Range,RowOffset,ColumnOffset,Height,Width',
				description:
					'Returns range of cells that is a specified number of rows and columns from an initial specified range.'
			},
			de: {
				argumentList: 'Bereich,Zeilenversatz,Spaltenversatz,Höhe,Breite',
				description: 'Erzeugt einen Bereich mit dem angegebenen Versatz und der Höhe und Breite'
			}
		},
		ROW: {
			en: { argumentList: 'Reference', description: 'Returns the row number of given cell reference' },
			de: { argumentList: 'Referenz', description: 'Ermittelt die Zeilennummer der angegebenen Zellreferenz' }
		},
		VLOOKUP: {
			en: {
				argumentList: 'Value,Range,Index,ExactMatch',
				description:
					'Looks in the first column of an array and moves across the row to return the value of a cell'
			},
			de: {
				argumentList: 'Wert,Bereich,Index,ExakteÜbereinstimmung',
				description:
					'Ermittelt die Zelle mit einem Index in einem Bereich, die dem Wert in der ersten Spalte entspricht'
			}
		}
	}
};
