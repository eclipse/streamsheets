module.exports = {
	en: 'Information',
	de: 'Information',
	functions: {
		IFERROR: {
			en: {
				argumentList: 'Value,ValueOnError',
				description: 'Returns ValueOnError if given Value represents an error otherwise the Value itself'
			},
			de: {
				argumentList: 'Value,ValueOnError',
				description: 'Gibt ValueOnError zurück, falls der Value einem Fehlerwert entspricht, sonst Value'
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
		}
	}
};
