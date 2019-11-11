module.exports = {
	en: 'Database',
	de: 'Datenbank',
	functions: {
		DAVERAGE: {
			en: {
				argumentList: 'DataRange,ColumnIndex,CriteriaRange',
				description: 'Returns the average of all cells at specified column in rows which match given criteria'
			},
			de: {
				argumentList: 'DatenBereich,SpaltenIndex,KriteriumBereich',
				description:
					'Berechnet den Durchschnitt aller Zellen in der angegebenen Spalte zu den Zeilen, die die Bedingungen erfüllen'
			}
		},
		DCOUNT: {
			en: {
				argumentList: 'DataRange,ColumnIndex,CriteriaRange',
				description:
					'Counts all cells that represent a number at specified column in rows which match given criterias '
			},
			de: {
				argumentList: 'Datenbereich,SpaltenIndex,KriteriumBereich',
				description:
					'Zählt alle Zellen, deren Wert einer Zahl entspricht, in der angegebenen Spalte, bei denen die Zeilen die Bedingungen erfüllen'
			}
		},
		DMAX: {
			en: {
				argumentList: 'DataRange,ColumnIndex,CriteriaRange',
				description:
					'Returns the largest number of all cells at specified column in rows which match given criterias '
			},
			de: {
				argumentList: 'DatenBereich,SpaltenIndex,KriterienBereich',
				description:
					'Gibt die größte Zahl der Zellen in der angegebenen Spalte zurück, bei denen die Zeilen die Bedingungen erfüllen'
			}
		},
		DMIN: {
			en: {
				argumentList: 'DataRange,ColumnIndex,CriteriaRange',
				description:
					'Returns the smallest number of all cells at specified column in rows which match given criterias '
			},
			de: {
				argumentList: 'DatenBereich,SpaltenIndex,KriterienBereich',
				description:
					'Gibt die kleinste Zahl der Zellen in der angegebenen Spalte zurück, bei denen die Zeilen die Bedingungen erfüllen'
			}
		},
		DSUM: {
			en: {
				argumentList: 'DataRange,ColumnIndex,CriteriaRange',
				description: 'Adds all numbers at specified column in rows which match given criterias '
			},
			de: {
				argumentList: 'DatenBereich,SpaltenIndex,KriterienBereich',
				description:
					'Addiert alle Werte der Zellen in der angegebenen Spalte, bei denen die Zeilen die Bedingungen erfüllen'
			}
		}
	}
};
