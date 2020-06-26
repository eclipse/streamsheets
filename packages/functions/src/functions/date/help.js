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
	en: 'Date',
	de: 'Datum',
	functions: {
		DATE: {
			en: {
				argumentList: 'Years,Months,Days',
				description:
					'Converts a date specified by given years, months and days to a corresponding serial number'
			},
			de: {
				argumentList: 'Jahre,Monate,Tage',
				description:
					'Konvertiert ein Datum, dass durch Jahre, Monate und Tage spezifiziert ist, in eine serielle Zahl'
			}
		},
		DATEVALUE: {
			en: { argumentList: 'DateText', description: 'Converts a date specified by given text to a serial number' },
			de: {
				argumentList: 'Datumstext',
				description: 'Konvertiert ein als Text gegebenes Datum in eine serielle Zahl'
			}
		},
		DAY: {
			en: { argumentList: 'DateValue', description: 'Returns the day of the time value' },
			de: { argumentList: 'Datumswert', description: 'Gibt den Tag eines Datumswertes zurück' }
		},
		EXCEL2JSONTIME: {
			en: {
				argumentList: 'Number',
				description: 'Converts a date represented by given serial number to a JSON ISO 8601 date string'
			},
			de: {
				argumentList: 'Zahl',
				description:
					'Konvertiert das durch die serielle Zahl repräsentierte Datum ins JSON ISO 8601 Datumsformat '
			}
		},
		HOUR: {
			en: { argumentList: 'TimeValue', description: 'Returns the hour of the time value' },
			de: { argumentList: 'Zeitwert', description: 'Gibt die Stunde eines Zeitwertes zurück' }
		},
		JSONTIME2EXCEL: {
			en: {
				argumentList: 'Text',
				description: 'Converts given date, which must be in JSON ISO 8601 format, to a serial number'
			},
			de: {
				argumentList: 'Text',
				description: 'Konvertiert das angegebene Datum von JSON ISO 8601 Format in eine serielle Zahl'
			}
		},
		MINUTE: {
			en: { argumentList: 'Timevalue', description: 'Returns the minute of the time value' },
			de: { argumentList: 'Zeitwert', description: 'Gibt die Minute eines Zeitwertes zurück' }
		},
		MONTH: {
			en: { argumentList: 'DateValue', description: 'Returns the month of the time value' },
			de: { argumentList: 'Datumswert', description: 'Gibt den Monat eines Zeitwertes zurück' }
		},
		MSTOSERIAL: {
			en: { argumentList: 'TimeValue', description: 'Converts the given ellapsed milliseconds to a date value' },
			de: { argumentList: 'Zeitwert', description: 'Wandelt die abgelaufenen Millisekunden in ein Datum um' }
		},
		NOW: {
			en: { argumentList: '', description: 'Returns the current time' },
			de: { argumentList: '', description: 'Gibt den aktuellen Zeitwert zurück' }
		},
		SECOND: {
			en: { argumentList: 'TimeValue', description: 'Returns the seconds of the time value' },
			de: { argumentList: 'Zeitwert', description: 'Gibt die Sekunden eines Zeitwertes zurück' }
		},
		SERIALTOMS: {
			en: { argumentList: 'Date', description: 'Converts the given date to the ellapsed milliseconds' },
			de: { argumentList: '', description: 'Wandelt das Datum in abgelaufenen Millisekunden um' }
		},
		TIME: {
			en: {
				argumentList: 'Hours,Minutes,Seconds',
				description:
					'Calculates the serial number which corresponds to a time specified by given hours, minutes and seconds'
			},
			de: {
				argumentList: 'Stunden,Minuten,Sekunden',
				description:
					'Berechnet die serielle Zahl, die der Zeit entspricht, die durch Stunden, Minuten und Sekunden festgelegt ist'
			}
		},
		TIMEVALUE: {
			en: {
				argumentList: 'TimeText',
				description: 'Converts time given as text to a corresponding serial number'
			},
			de: {
				argumentList: 'Zeittext',
				description: 'Konvertiert die als Text gegebene Zeit in eine serielle Zahl'
			}
		},
		WEEKDAY: {
			en: { argumentList: 'DateValue', description: 'Returns the week day of the time value' },
			de: { argumentList: 'Datumswert', description: 'Gibt den Wochentag eines Zeitwertes zurück' }
		},
		YEAR: {
			en: { argumentList: 'DateValue', description: 'Returns the year of the date value' },
			de: { argumentList: 'Datumswert', description: 'Gibt das Jahr eines Datumswertes zurück' }
		}
	}
};
