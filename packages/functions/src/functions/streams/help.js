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
	en: 'Streams',
	de: 'Streams',
	functions: {
		'FILE.WRITE': {
			en: {
				argumentList: 'Producer,Range,Filename,Directory,Mode,Separator',
				description: 'Writes a range as CSV to a file'
			},
			de: {
				argumentList: 'Producer,Bereich,Dateiname,Verzeichnis,Mode,Separator',
				description: 'Schreibt einen Bereich als CSV in eine Datei'
			}
		},
		'HTTP.REQUEST': {
			en: {
				argumentList: 'Producer,URL,Method,Target,ResultKeys,Body,Headers,Timeout',
				description: 'Create an asynchronous calls to a REST service'
			},
			de: {
				argumentList: 'Producer,URL,Methode,Ziel,ResultKeys,Body,Headers,Timeout',
				description: 'Erlaubt Aufrufe in einen REST Dienst'
			}
		},
		'HTTP.RESPOND': {
			en: {
				argumentList: 'Consumer,RequestId,Body,StatusCode,Headers',
				description: 'Sends data to a Producer that send a data object previously'
			},
			de: {
				argumentList: 'Consumer,RequestId,Body,StatusCode,Headers',
				description: 'Sendet Daten an einen Producer mit Hilfe der DataObjectId'
			}
		},
		'KAFKA.QUERY': {
			en: {
				argumentList: 'Producer,Query,Target,Timeout',
				description:
					'Fetches data from Kafka that matches query. REQUESTINFO can be used to check the status of the query'
			},
			de: {
				argumentList: 'Producer,Query,Ziel,Timeout',
				description:
					'Liest Daten aus Kafka mithilfe von Query. Status der Query kann mit REQUESTINFO abgefragt werden'
			}
		},
		'KAFKA.COMMAND': {
			en: {
				argumentList: 'Producer,Command,Target,Timeout',
				description: 'Sends a KSQL Command to Kafka. REQUESTINFO can be used to check the status of the query'
			},
			de: {
				argumentList: 'Producer,Command,Ziel,Timeout',
				description:
					'Schickt einen KSQL Command an Kafka. Status der Query kann mit REQUESTINFO abgefragt werden'
			}
		},
		'KAFKA.PUBLISH': {
			en: {
				argumentList: 'Producer,Message,Topic',
				description: 'Publishes a referenced Outbox or Inbox message or a JSON via Kafka'
			},
			de: {
				argumentList: 'Producer,Message,Topic',
				description: 'Publiziert eine referenzierte Nachricht aus der Inbox oder Outbox oder ein JSON via Kafka'
			}
		},
		'MAIL.SEND': {
			en: {
				argumentList: 'Producer,Text,Subject,TO,CC,BCC,Attachments',
				description: 'Sends a mail to the given mail addresses (TO, CC, BCC)'
			},
			de: {
				argumentList: 'Producer,Text,Betreff,TO,CC,BCC,Anhänge',
				description: 'Versendet eine E-Mail an die E-Mail Adressen (TO, CC, BCC)'
			}
		},
		'MONGO.AGGREGATE': {
			en: {
				argumentList: 'Producer,Collection,AggregateJSON,Target,ResultKeys,Timeout',
				description: 'Execute the Aggregation Pipeline defined by AggregateJSON'
			},
			de: {
				argumentList: 'Producer,Collection,AggregateJSON,Ziel,ResultKeys,Timeout',
				description: 'Führt die Aggregation Pipeline in AggregateJSON aus'
			}
		},
		'MONGO.COUNT': {
			en: {
				argumentList: 'Producer,Collection,QueryJSON,Target,Timeout',
				description: 'Count matching objects from MongoDB'
			},
			de: {
				argumentList: 'Producer,Collection,QueryJSON,Ziel,Timeout',
				description: 'Zählt gesuchte Objekte aus MongoDB'
			}
		},
		'MONGO.DELETE': {
			en: {
				argumentList: 'Producer,Collection,QueryJSON,Target,Timeout',
				description: 'Deletes matching objects from MongoDB'
			},
			de: {
				argumentList: 'Producer,Collection,QueryJSON,Ziel,Timeout',
				description: 'Löscht gesuchte Objekte aus MongoDB'
			}
		},
		'MONGO.QUERY': {
			en: {
				argumentList: 'Producer,Collection,QueryJSON,Target,ResultKeys,PageSize,Page,Sort,Timeout',
				description:
					'Finds objects in MongoDB that math QueryJSON. REQUESTINFO can be used to check the status of the query'
			},
			de: {
				argumentList: 'Producer,Collection,QueryJSON,Ziel,ResultKeys,Seitengröße,Seite,Sortieren,Timeout',
				description:
					'Findet Objekte in MongoDB die QueryJSON erfüllen. Status der Query kann mit REQUESTINFO abgefragt werden'
			}
		},
		'MONGO.STORE': {
			en: { argumentList: 'Producer,Collection,Document', description: 'Stores a JSON object in MongoDB' },
			de: { argumentList: 'Producer,Collection,Document', description: 'Speichert ein JSON Objekt in MongoDB' }
		},
		'MONGO.REPLACE': {
			en: {
				argumentList: 'Producer,Collection,Query,Document,Upsert',
				description: 'Replace a JSON object matching the query in MongoDB'
			},
			de: {
				argumentList: 'Producer,Collection,Query,Document,Upsert',
				description: 'Ersetzt ein JSON Objekt, dass die Query erfüllt, in MongoDB'
			}
		},
		'MQTT.PUBLISH': {
			en: {
				argumentList: 'Producer,MessageOrValue,Topic,QoS,UserProperties',
				description: 'Publishes a referenced Outbox or Inbox message or a JSON via MQTT'
			},
			de: {
				argumentList: 'Producer,NachrichtOderWert,Topic,QoS,BenutzerAttribute',
				description: 'Publiziert eine referenzierte Nachricht aus der Inbox oder Outbox oder ein JSON via MQTT'
			}
		},
		PRODUCE: {
			en: {
				argumentList: 'Producer,JSONConfiguration',
				description: 'Produces data using the Producer and a JSON specific to the Producer'
			},
			de: {
				argumentList: 'Producer,JSONKonfiguration',
				description: 'Produziert Daten mithilfe des Producers und dem Producerspezifischen JSON'
			}
		},
		REQUEST: {
			en: {
				argumentList: 'Stream,ParameterJSON,TargetSheet',
				description: 'Create an asynchronous calls to a REST service'
			},
			de: { argumentList: 'Stream,ParameterJSON,ZielSheet', description: 'Erlaubt Aufrufe in einen REST Dienst' }
		},
		REQUESTINFO: {
			en: {
				argumentList: 'RequestId',
				description: 'Returns the current status of a previously executed REQUEST function'
			},
			de: { argumentList: 'RequestId', description: 'Gibt den Status des letzten REQUEST Aufrufs zurück' }
		},
		RESPOND: {
			en: {
				argumentList: 'MessageOrJSON,Producer,RequestId',
				description:
					'Sends JSON data from the outbox or the range to a Producer that send a data object previously'
			},
			de: {
				argumentList: 'NachrichtOderJSON,Producer,RequestId',
				description:
					'Sendet JSON Daten aus der Outbox oder vom gegebenen Bereich an einen Producer mit Hilfe der RequestId'
			}
		},
		'REST.REQUEST': {
			en: {
				argumentList: 'Producer,URL,Method,Target,ResultKeys,Body,Headers,Timeout',
				description: 'Create an asynchronous calls to a REST service'
			},
			de: {
				argumentList: 'Producer,URL,Methode,Ziel,ResultKeys,Body,Headers,Timeout',
				description: 'Erlaubt Aufrufe in einen REST Dienst'
			}
		},
		'REST.RESPOND': {
			en: {
				argumentList: 'Consumer,RequestId,Body,StatusCode,Headers',
				description: 'Sends data to a Producer that send a data object previously'
			},
			de: {
				argumentList: 'Consumer,RequestId,Body,StatusCode,Headers',
				description: 'Sendet Daten an einen Producer mit Hilfe der DataObjectId'
			}
		}
	}
};
