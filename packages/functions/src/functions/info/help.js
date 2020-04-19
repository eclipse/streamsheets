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
