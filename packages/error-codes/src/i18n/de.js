/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
module.exports = {
	// TYPES:
	'ERROR': 'Fehler',
	'WARNING': 'Warnung',
	// INFO PROPERTIES:
	'code': 'Fehlercode',
	'description': 'Beschreibung',
	'paramIndex': 'Parameter',
	'message': 'Nachricht',
	// ERROR CODES:
	'#ARG_NUM': 'Zu wenig Argumente',
	'#DISCONNECTED': 'Verwendeter Stream nicht verbunden',
	'#DIV0': 'Division durch Null',
	'#ERR': 'Fehler beim parsen oder in der Anfrage',
	'#FUNC_EXEC': 'Interner Fehler',
	'INVALID': 'Funktion ist veraltet',
	'#INVALID_LOOP_PATH': 'Verwendeter loop-Pfad ist ungültig',
	'#INVALID_PARAM': 'Parameter ist ungültig',
	'#INVALID_PATH': 'Pfad ist ungültig',
	'#LIMIT': 'Gesetztes Limit erreicht',
	'#NO_CONSUMER': 'Unbekannter Consumer',
	'#NO_PRODUCER': 'Unbekannter Producer',
	'#NO_MACHINE': 'Maschine nicht vorhanden',
	'#NO_OPCUA_MACHINE': 'Maschinen-Einstellung OPCUA nicht aktiv',
	'#NO_MSG': 'Referenzierte Nachricht existiert nicht',
	'#NO_MSG_DATA': 'Keine Daten am angegebenen Pfad verfügbar',
	'#NO_STREAMSHEET': 'Referenziertes Streamsheet existiert nicht',
	'#NA!': 'Wert nicht verfügbar',
	'#NAME?': 'Unbekannte Formel oder Bezeichner',
	'#NUM!': 'Nummerischer Wert is ungültig',
	'#RANGE': 'Ungültiger Zellbereich',
	'#REF!': 'Ungültige Referenz',
	'#RESPONSE': 'Fehler in der Abfrageantwort',
	'#VALUE!': 'Falscher Wertetyp',
	'#WAITING': 'Es wird auf ein anderes Streamsheet gewartet'

	// '#NO_LIST': '',
	// '#NO_MSG_ID': '',
	// '#NO_OUTBOX': '',
	// '#NO_TOPIC': '',
	// '#NOT_AVAILABLE': '',
	// '#PROCESS_SHEET': '',
	// '#RANGE_INVALID': '',
	// '#SELF_REF': '',
	// '#SOURCE': '',
	// '#TARGET': '',
	// '#TOPIC_INVALID': '',
	// '#TYPE_PARAM': '',
};
