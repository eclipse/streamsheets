module.exports = {
	en: 'Logical',
	de: 'Logisch',
	functions: {
		AND: {
			en: { argumentList: 'Value1,Value2', description: 'Evaluates, if all given values are true' },
			de: { argumentList: 'Wert1, Wert2', description: 'Berechnet, ob alle Werte wahr sind' }
		},
		IF: {
			en: {
				argumentList: 'Condition,TrueValue,FalseValue',
				description: 'Returns depending on the condition, the True or the False value'
			},
			de: {
				argumentList: 'Bedingung,Wahrwert,Falschwert',
				description: 'Gibt abhängig von der Bedingung den Wahrwert oder Falschwert zurück'
			}
		},
		NOT: {
			en: { argumentList: 'Value1', description: 'Inverts the given boolean value' },
			de: { argumentList: 'Wert1', description: 'Kehrt den gegebenen Wahrheitswert um' }
		},
		OR: {
			en: {
				argumentList: 'Value1,Value2',
				description: 'Evaluates, if at least one of the given values is true'
			},
			de: { argumentList: 'Wert1, Wert2', description: 'Berechnet, ob mindestens ein Wert wahr ist' }
		},
		SWITCH: {
			en: {
				argumentList: 'Value,KeyValue-Pairs,[DefaultValue]',
				description:
					'Evaluates a value against a list of key-value pairs and returns value of first matched key'
			},
			de: {
				argumentList: 'Wert,SchlüsselWert-Paare,[DefaultWert]',
				description:
					'Evaluiert den Wert gegen eine Liste von Schlüssel-Wert-Paare und liefert den Wert zum ersten passenden Schlüssel zurück'
			}
		}
	}
};
