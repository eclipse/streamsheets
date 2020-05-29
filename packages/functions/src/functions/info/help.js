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
const { FunctionErrors: ERROR } = require('@cedalo/error-codes');


module.exports = {
	en: 'Information',
	de: 'Information',
	functions: {
		IFERROR: {
			en: {
				argumentList: 'Value,ErrorValue',
				description: 'Returns ValueOnError if given Value represents an error otherwise the Value itself'
			},
			de: {
				argumentList: 'Wert,Fehlerwert',
				description: 'Gibt Fehlerwert zurück, falls der Value einem Fehlerwert entspricht, sonst Wert'
			}
		},
		ISERR: {
			en: { argumentList: 'Value', description: 'Returns TRUE if given value represents an error, except #NA' },
			de: {
				argumentList: 'Wert',
				description:
					'Gibt TRUE zurück, falls der angegebene Wert einem Fehlerwert entspricht, mit Ausnahme von #NA'
			}
		},
		ISERROR: {
			en: { argumentList: 'Value', description: 'Returns TRUE if given value represents an error' },
			de: {
				argumentList: 'Wert',
				description: 'Gibt TRUE zurück, falls der angegebene Wert einem Fehlerwert entspricht'
			}
		},
		ISEVEN: {
			en: { argumentList: 'Value', description: 'Returns TRUE if given value is an even number' },
			de: { argumentList: 'Zahl', description: 'Gibt TRUE zurück, falls die angegebene Zahl gerade ist' }
		},
		ISNA: {
			en: { argumentList: 'Value', description: 'Returns TRUE if given value represents a #NA error' },
			de: {
				argumentList: 'Wert',
				description: 'Gibt TRUE zurück, falls der angegebene Wert dem Fehlerwert #NA entspricht'
			}
		},
		ISOBJECT: {
			en: { argumentList: 'Value', description: 'Returns TRUE if given value represents an object value' },
			de: {
				argumentList: 'Wert',
				description: 'Gibt TRUE zurück, falls der angegebene Wert ein Objekt-Wert ist'
			}
		},
		ISODD: {
			en: { argumentList: 'Value', description: 'Returns TRUE if given value is an odd number' },
			de: { argumentList: 'Zahl', description: 'Gibt TRUE zurück, falls die angegebene Zahl ungerade ist' }
		},
		NA: {
			en: { argumentList: '', description: `Returns the error value ${ERROR.code.NA}` },
			de: { argumentList: '', description: `Gibt den Fehler ${ERROR.code.NA} zurück` }
		}
	}
};
