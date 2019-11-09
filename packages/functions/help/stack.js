module.exports = {
	en: 'Stack',
	de: 'Stack',
	functions: {
		STACKADD: {
			en: {
				argumentList: 'StackRange,SourceRange,Position,TargetRange',
				description:
					'This function adds a row to the stack at the defined Position and copies the removed cells to the target range'
			},
			de: {
				argumentList: 'Stackbereich,Quellbereich,Position,Zielbereich',
				description:
					'Diese Funktion füget dem Stack eine Zeile an der angegebenen Position zu und kopiert die gelöschte Zeile in den Zielbereich'
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
				argumentList: 'StackRange,CriteriaRange,TargetRange,Drop',
				description:
					'This function uses the criteria range to select and copy one or multiple rows from the StackRange to the TargetRange.'
			},
			de: {
				argumentList: 'StackBereich,Suchkriterien,Zielbereich,Löschen',
				description:
					'Diese Funktion nutzt die Suchkriterien, um  einen Bereich von dem Stackbereich in der Zielbereich zu kopieren.'
			}
		},
		STACKROTATE: {
			en: {
				argumentList: 'StackRange,Count,TargetRange',
				description: 'This function rotates the complete stack by Count positions up or down.'
			},
			de: {
				argumentList: 'Stackbereich,Anzahl,Zielbereich',
				description: 'Diese Funktion rotiert den Stack um die Anzahl der angegebnen Zeilen hoch oder runter.'
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
