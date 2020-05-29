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
	en: 'Statistic',
	de: 'Statistik',
	functions: {
		AVERAGE: {
			en: { argumentList: 'Value1,ValueN', description: 'Returns the average of specified cell values' },
			de: {
				argumentList: 'Wert1,WertN',
				description: 'Bestimmt den Mittelwert über alle aufgelisteten Zellwerte'
			}
		},
		AVERAGEIF: {
			en: {
				argumentList: 'CellRange,Criterion,AverageRange',
				description:
					'Returns the average of all values in provided CellRange or AverangeRange if given, which fulfill given criterion'
			},
			de: {
				argumentList: 'Zellbereich,Kriterium,Durchschnittsbereich',
				description:
					'Bestimmt den Mittelwert über alle Werte im Zellbereich oder Durchschnittsbereich, falls angegeben, die das Kriterium erfüllen'
			}
		},
		AVERAGEIFS: {
			en: {
				argumentList: 'AverageRange,Range1,Criterion1,RangeN,CriterionN',
				description: 'Returns the average of all values in AverageRange which fulfill all given criteria'
			},
			de: {
				argumentList: 'Durchschnittsbereich,Bereich1,Kriterium1,BereichN,KriteriumN',
				description:
					'Bestimmt den Mittelwert über alle Zellwerte aus dem Durchschnittsbereich die sämtliche Kriterien erfüllen'
			}
		},
		CORREL: {
			en: {
				argumentList: 'CellRange1,CellRange2',
				description: 'Returns the correlation coefficient of two cell ranges'
			},
			de: {
				argumentList: 'Zellbereich1,Zellbereich2',
				description: 'Gibt den Korrelationskoeffizienten zweier Zellbereiche zurück'
			}
		},
		COUNT: {
			en: { argumentList: 'Value1,ValueN', description: 'Counts the amount of number values in specified cells' },
			de: {
				argumentList: 'Wert1,WertN',
				description:
					'Zählt alle Werte, die einer Zahl entsprechen, aus den angegebenen Zellen oder Zellbereiche'
			}
		},
		COUNTIF: {
			en: {
				argumentList: 'CellRange,Criterion',
				description: 'Returns the number of cells in range which fulfills given criterion'
			},
			de: {
				argumentList: 'Zellbereich,Kriterium',
				description: 'Zählt alle Zellen im  Zellbereich, die das angegebene Kriterium erfüllen'
			}
		},
		COUNTIFS: {
			en: {
				argumentList: 'CellRange1,Criterion1,CellRangeN,CriterionN',
				description: 'Returns the number of cells which fulfill all specified criteria'
			},
			de: {
				argumentList: 'Zellbereich1,Kriterium1,ZellbereichN,KriteriumN',
				description: 'Zählt alle Zellen die sämtliche Kriterien erfüllen'
			}
		},
		FORECAST: {
			en: {
				argumentList: 'Number_X,CellRange_Y,CellRange_X',
				description: 'Calculates Y value for given X based on existing values'
			},
			de: {
				argumentList: 'Zahl_X,Zellbereich_Y,Zellbereich_X',
				description: 'Berechnet den Y-Wert zu gegebenen X-Wert, basierend auf bekannten Werten'
			}
		},
		MAX: {
			en: { argumentList: 'Value1,ValueN', description: 'Evaluates the maximum value' },
			de: { argumentList: 'Wert1,WertN', description: 'Berechnet den größten Wert' }
		},
		MAXIFS: {
			en: {
				argumentList: 'MaxRange,CriterionRange1,Criterion1,CriterionRangeN,CriterionN',
				description: 'Returns the maximum value of all cells which fulfill all specified criteria'
			},
			de: {
				argumentList: 'MaxBereich,Kriterium1Bereich,Kriterium1,KriteriumNBereich,Kriterium1N',
				description: 'Bestimmt den größten Wert aller Zellen die sämtliche Kriterien erfüllen'
			}
		},
		MIN: {
			en: { argumentList: 'Value1,Value2', description: 'Evaluates the minimum value' },
			de: { argumentList: 'Wert1, Wert2', description: 'Berechnet den kleinsten Wert' }
		},
		MINIFS: {
			en: {
				argumentList: 'MinRange,CriterionRange1,Criterion1,CriterionRangeN,CriterionN',
				description: 'Returns the minimum value of all cells which fulfill all specified criteria'
			},
			de: {
				argumentList: 'MinBereich,Kriterium1Bereich,Kriterium1,KriteriumNBereich,KriteriumN',
				description: 'Bestimmt den kleinsten Wert aller Zellen die sämtliche Kriterien erfüllen'
			}
		},
		'STDEV.S': {
			en: {
				argumentList: 'Number1,NumberN',
				description: 'Returns the standard derivation of given values'
			},
			de: {
				argumentList: 'Zahl1,ZahlN',
				description: 'Liefert die Standardabweichung zu den angegebenen Zahlen'
			}
		}
	}
};
