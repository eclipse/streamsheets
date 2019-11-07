module.exports = {
	en: 'Statistic',
	de: 'Statistik',
	functions: {
		AVERAGE: {
			en: { argumentList: 'Value1,[ValueN]', description: 'Returns the average of specified cell values.' },
			de: {
				argumentList: 'Wert1,[WertN]',
				description: 'Bestimmt den Mittelwert über alle aufgelisteten Zellwerte'
			}
		},
		CORREL: {
			en: {
				argumentList: 'CellRange_1,CellRange_2',
				description: 'Returns the correlation coefficient of two cell ranges'
			},
			de: {
				argumentList: 'Zellbereich_1,Zellbereich_2',
				description: 'Gibt den Korrelationskoeffizienten zweier Zellbereiche zurück'
			}
		},
		COUNT: {
			en: {
				argumentList: 'Value1,[ValueN]',
				description: 'Counts the amount of number values in specified cells'
			},
			de: {
				argumentList: 'Wert1,[WertN]',
				description:
					'Zählt alle Werte, die einer Zahl entsprechen, aus den angegebenen Zellen oder Zellbereiche'
			}
		},
		FORECAST: {
			en: {
				argumentList: 'Number_X,CellRange_Y,CellRange_X',
				description: 'Calculates Y value for given X based on existing values'
			},
			de: {
				argumentList: 'Zahl_X,Zellbereich_Y,Zellbereich_X',
				description: 'Berechnet den Y-Wert zu gegebenen X-Wert, basierend auf bekannten Werten.'
			}
		},
		MAX: {
			en: { argumentList: 'Value1,ValueN', description: 'Evaluates the maximum value' },
			de: { argumentList: 'Wert1,WertN', description: 'Berechnet den größten Wert' }
		},
		MIN: {
			en: { argumentList: 'Value1,Value2', description: 'Evaluates the minimum value' },
			de: { argumentList: 'Wert1, Wert2', description: 'Berechnet den kleinsten Wert' }
		},
		'STDEV.S': {
			en: {
				argumentList: 'Number1,[Number2],...',
				description: 'Returns the standard derivation of given values.'
			},
			de: {
				argumentList: 'Zahl1,[Zahl2],...',
				description: 'Liefert die Standardabweichung zu den angegebenen Zahlen.'
			}
		}
	}
};
