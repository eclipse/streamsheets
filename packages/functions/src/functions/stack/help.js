module.exports = {
	en: 'Stack',
	de: 'Stack',
	functions: {
		STACKADD: {
			en: {
				argumentList: 'StackRange,SourceRange,Direction,TargetRange',
				description:
					'This function adds a row to the stack at the defined direction and copies the removed cells to the target range'
			},
			de: {
				argumentList: 'Stackbereich,Quellbereich,Richtung,Zielbereich',
				description:
					'Diese Funktion fügt dem Stack eine Zeile in der angegebenen Richtung und kopiert die gelöschte Zeile in den Zielbereich'
			}
		},
		STACKDROP: {
			en: {
				argumentList: 'StackRange,Direction,TargetRange',
				description: 'This function removes one row from the Stack. All rows below move one row up.'
			},
			de: {
				argumentList: 'Stackbereich,Richtung,Zielbereich',
				description:
					'Diese Funktion enfernt eine Zeile aus dem Stack. Die anderen Zeilen werden entsprechend der Richtung bewegt.'
			}
		},
		STACKFIND: {
			en: {
				argumentList: 'StackRange,CriteriaRange,TargetRange,Drop,Unique',
				description:
					'This function uses the criteria range to select and copy one or multiple rows from the StackRange to the TargetRange.'
			},
			de: {
				argumentList: 'StackBereich,Suchkriterien,Zielbereich,Löschen,Einzigartig',
				description:
					'Diese Funktion nutzt die Suchkriterien, um  einen Bereich von dem Stackbereich in der Zielbereich zu kopieren.'
			}
		},
		STACKROTATE: {
			en: {
				argumentList: 'StackRange,Position,TargetRange',
				description: 'This function rotates the complete stack by Position positions up or down.'
			},
			de: {
				argumentList: 'Stackbereich,Position,Zielbereich',
				description: 'Diese Funktion rotiert den Stack um die Anzahl der angegebenen Zeilen hoch oder runter.'
			}
		},
		STACKSORT: {
			en: {
				argumentList: 'StackRange,SortSettingsRange',
				description: 'This function sorts the Stack according to the Settings in the SortSettingsRange.'
			},
			de: {
				argumentList: 'StackBereich,Sortierbereich',
				description: 'Diese Funktion sortiert den Stack nach den Sortierkriterien.'
			}
		}
	}
};
