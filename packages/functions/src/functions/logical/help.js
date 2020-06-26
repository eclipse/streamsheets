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
	en: 'Logical',
	de: 'Logisch',
	functions: {
		AND: {
			en: { argumentList: 'Value1,Value2', description: 'Evaluates, if all given values are true' },
			de: { argumentList: 'Wert1,Wert2', description: 'Berechnet, ob alle Werte wahr sind' }
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
			en: { argumentList: 'Value', description: 'Inverts the given boolean value' },
			de: { argumentList: 'Wert', description: 'Kehrt den gegebenen Wahrheitswert um' }
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
				argumentList: 'Value,KeyValue1,Value1,KeyValueN,ValueN,DefaultValue',
				description:
					'Evaluates an expression against a list of key-value pairs and returns value of first matched key'
			},
			de: {
				argumentList: 'Wert,SchlüsselWert1,Wert1,SchlüsselWertN,WertN,DefaultWert',
				description:
					'Evaluiert einen Ausdruck gegen eine Liste von Schlüssel-Wert-Paaren und liefert den Wert zum ersten passenden Schlüssel zurück'
			}
		}
	}
};
