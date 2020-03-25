module.exports = {
	en: 'Timeseries',
	de: 'Zeitreihen',
	functions: {
		TIMEAGGREGATE: {
			en: {
				argumentList: 'DataCell,Period,AggregationMethod,TimeSerial,Interval,TargetRange,Sort,Limit',
				description: 'Aggregates values with the Period using the given method within the interval'
			},
			de: {
				argumentList: 'DatenZelle,Periode,Methode,BasisZeit,Intervall,Zielbereich,Sortieren,Limit',
				description: 'Aggregiert Werte in der Periode mit der angebenen Methode für den angegebenen Intervall'
			}
		},
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
