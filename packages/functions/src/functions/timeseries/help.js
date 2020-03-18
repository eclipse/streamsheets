module.exports = {
	en: 'Timeseries',
	de: 'Zeitreihen',
	functions: {
		TIMEQUERY: {
			en: {
				argumentList: 'StoreReference,Query,Interval,TargetRange,Limit',
				description: 'Queries given time-store on specified interval'
			},
			de: {
				argumentList: 'StoreReferenz,Query,Intervall,ZielBereich,Limit',
				description: 'Führt wiederholend eine Anfrage auf den referenzierten time-store aus'
			}
		},
		TIMESTORE: {
			en: {
				argumentList: 'JSON,Duration,TimeSerial,Limit',
				description: 'Stores key/value entries over specified duration within sheet'
			},
			de: {
				argumentList: 'JSON,Dauer,ZeitDezimal,Limit',
				description: 'Speichert die Schlüssel/Wert Paare über die angegebene Dauer im Sheet'
			}
		},
	}
};
