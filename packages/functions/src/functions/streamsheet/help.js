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
	en: 'Streamsheet',
	de: 'Streamsheet',
	functions: {
		ARRAY: {
			en: {
				argumentList: 'Range,Nest,Flat',
				description: 'Creates a JSON array entry using the given keys and values'
			},
			de: {
				argumentList: 'Bereich,Verschachteln,Flach',
				description: 'Erzeugt ein JSON Array Objekt mit den gegebenen Schlüssel und Werten'
			}
		},
		AWAIT: {
			en: {
				argumentList: 'Cell1,Cell2...',
				description: 'Waits until all specified request cells resolve'
			},
			de: {
				argumentList: 'Zelle1,Zelle2...',
				description: 'Wartet bis alle Anfragen in den angegebenen Zellen behandelt wurden'
			}
		},
		'AWAIT.ONE': {
			en: {
				argumentList: 'Cell1,Cell2...',
				description: 'Waits until one of specified request cell resolves'
			},
			de: {
				argumentList: 'Zelle1,Zelle2...',
				description: 'Wartet bis eine Anfragen in den angegebenen Zellen behandelt wurde'
			}
		},
		CALC: {
			en: {
				argumentList: '',
				description: 'Recalculates streamsheet without doing a complete streamsheet step'
			},
			de: {
				argumentList: '',
				description: 'Berechnet das Streamsheet neu ohne einen kompletten Streamhseet-Schritt auszulösen'
			}
		},
		'COLOR.CONVERT': {
			en: {
				argumentList: 'Color,SourceFormat,TargetFormat',
				description: 'Converts a color-string from its source format to specified target format'
			},
			de: {
				argumentList: 'Farbe,Quellformat,Zielformat',
				description: 'Konvertiert einen Farb-String aus seinem Quellformat ins Zielformat'
			}
		},
		CONTINUE: {
			en: { argumentList: 'Cell', description: 'Continues evaluation at given cell' },
			de: { argumentList: 'Zelle', description: 'Führt die Berechnung an der angegebenen Zelle fort' }
		},
		COPYVALUES: {
			en: {
				argumentList: 'SourceRange,TargetRange',
				description: 'Copies the values of the source range to the target range'
			},
			de: {
				argumentList: 'Quellbereich,Zielbereich',
				description: 'Kopiert die Werte aus dem Quellbereich in den Zielbereich'
			}
		},
		COUNTER: {
			en: {
				argumentList: 'Start,Step,End,Reset',
				description:
					'Increments or decrements a cell value by specified Step amount until optional End is reached. Reset initialize counter to Start again'
			},
			de: {
				argumentList: 'Start,Step,End,Reset',
				description:
					'Erhöht oder verringert den Start-Wert um Step bis der optionale End Wert erreicht wurde. Reset initialisiert den Zähler wieder mit Start-Wert'
			}
		},
		DELETE: {
			en: { argumentList: 'Key', description: 'Delete a message or message content based on the key' },
			de: {
				argumentList: 'Name',
				description: 'Löscht die angegebenen Nachrichten oder den Inhalt einer Nachricht'
			}
		},
		DELETECELLS: {
			en: { argumentList: 'Range', description: 'Deletes the cells in the given range' },
			de: { argumentList: 'Bereich', description: 'Löscht die Zellen im angegebenen Bereich' }
		},
		DETECTCHANGE: {
			en: {
				argumentList: 'Condition,Period,PreviousResultCell,TimeStampCell,Delay',
				description: 'Detects if a condition has changed'
			},
			de: {
				argumentList: 'Bedingung,Periode,VorherigesErgebnis,ZielZellenZeit,Verzögerung',
				description: 'Ermittelt, ob sich eine Bedingung in einem Zeitraum geändert hat'
			}
		},
		DICTIONARY: {
			en: {
				argumentList: 'Range,Horizontal',
				description: 'Creates a JSON Object using the given keys and values'
			},
			de: {
				argumentList: 'Bereich,Horizontal',
				description: 'Erzeugt ein JSON Object mit den gegenen Schlüssel und Werten'
			}
		},
		'EDGE.DETECT': {
			en: { argumentList: 'Condition,Period,Delay', description: 'Detects if a condition has changed' },
			de: {
				argumentList: 'Bedingung,Periode,Verzögerung',
				description: 'Ermittelt, ob sich eine Bedingung in einem Zeitraum geändert hat'
			}
		},
		EXECUTE: {
			en: {
				argumentList: 'Streamsheet,Repeat,JSON,Selector',
				description: 'Triggers the recalculation of another streamsheet'
			},
			de: {
				argumentList: 'Streamsheet,Wiederholen,JSON,Selektor',
				description: 'Aktiviert die Neuberechnung eines andere Streamsheets'
			}
		},
		FEEDINBOX: {
			en: { argumentList: 'JSON,Target', description: 'Sends a JSON directly to another Inbox' },
			de: { argumentList: 'JSON,Ziel', description: 'Sendet das JSON an die angegebene Inbox' }
		},
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
		GETCYCLE: {
			en: { argumentList: '', description: 'Returns the current cycle' },
			de: { argumentList: '', description: 'Ermittelt den aktuellen Zyklus' }
		},
		GETCYCLETIME: {
			en: { argumentList: '', description: 'Returns the current cycle time' },
			de: { argumentList: '', description: 'Ermittelt die aktuelle Zykluszeit' }
		},
		GETEXECUTESTEP: {
			en: { argumentList: '', description: 'Returns the current execute step count' },
			de: { argumentList: '', description: 'Ermittelt den aktuellen Execute Schritt im Streamsheet' }
		},
		GETMACHINESTEP: {
			en: { argumentList: '', description: 'Returns the current machine step count' },
			de: { argumentList: '', description: 'Ermittelt den aktuellen Maschinenschritt' }
		},
		GETSTEP: {
			en: { argumentList: '', description: 'Returns the current step count' },
			de: { argumentList: '', description: 'Ermittelt den aktuellen Streamsheet Schritt' }
		},
		GOTO: {
			en: { argumentList: 'Cell', description: 'Deprecated! Please use CONTINUE instead' },
			de: { argumentList: 'Zelle', description: 'Veraltet! Bitte stattdessen CONTINUE verwenden' }
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
		INBOX: {
			en: {
				argumentList: 'Streamsheet,Message',
				description: 'Creates a key to reference one or more messages from inbox'
			},
			de: {
				argumentList: 'Streamsheet,Nachricht',
				description: 'Erzeugt einen Schlüssel, der einen oder mehrere Nachrichten aus der Inbox referenziert'
			}
		},
		INBOXDATA: {
			en: {
				argumentList: 'Streamsheet,Message,ValuesOrRange',
				description: 'Creates a JSON key from the given values or range to retrieve data'
			},
			de: {
				argumentList: 'Streamsheet,Nachricht,WerteOderBereich',
				description: 'Erzeugt einen JSON Schlüssel mit den gegebenen Werten für den Datenbereich'
			}
		},
		INBOXMETADATA: {
			en: {
				argumentList: 'Streamsheet,Message,ValuesOrRange',
				description: 'Creates a JSON key from the given values or range to retrieve metadata'
			},
			de: {
				argumentList: 'Streamsheet,Nachricht,WerteOderBereich',
				description: 'Erzeugt einen JSON Schlüssel mit den gegebenen Werten für Metadaten'
			}
		},
		JSON: {
			en: {
				argumentList: 'RangeOrTextOrMessageElement,ResultAsText',
				description: 'Converts given cell range, text or message element to JSON'
			},
			de: {
				argumentList: 'ZellbereichOderTextOderNachrichtelement,ErgebnisAlsText',
				description: 'Wandelt den angebenen Zellbereich, Text oder Nachrichtenelement in ein JSON Objekt um'
			}
		},
		'JSON.VALUE': {
			en: {
				argumentList: 'JSON,key1,key2...',
				description: 'Returns the value from JSON object which corresponds to the path specified by given keys'
			},
			de: {
				argumentList: 'JSON,Schlüssel1,Schlüssel2...',
				description:
					'Gibt den, zu dem durch die Schlüssel definerten Pfad, passenden Wert des JSON Objekts zurück'
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
		LOOPCOUNT: {
			en: { argumentList: '', description: 'Returns the loop length' },
			de: { argumentList: '', description: 'Gibt die Anzahl der Loopelemente zurück ' }
		},
		LOOPINDEX: {
			en: { argumentList: '', description: 'Returns the current loop index' },
			de: { argumentList: '', description: 'Gibt den aktuellen Loop Index zurück' }
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
		MOVEVALUES: {
			en: {
				argumentList: 'SourceRange,TargetRange',
				description: 'Moves the values of the source range to the target range'
			},
			de: {
				argumentList: 'Quellbereich,Zielbereich',
				description: 'Verschiebt die Werte aus dem Quellbereich in den Zielbereich'
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
		OUTBOX: {
			en: { argumentList: 'Message', description: 'Creates a key to reference one or more messages from outbox' },
			de: {
				argumentList: 'Nachricht',
				description: 'Erzeugt einen Schlüssel, der einen oder mehrere Nachrichten aus der Outbox referenziert'
			}
		},
		OUTBOXDATA: {
			en: {
				argumentList: 'Message,ValuesOrRange',
				description: 'Creates a JSON key from the given values or range to retrieve data'
			},
			de: {
				argumentList: 'Message,WerteOderBereich',
				description: 'Erzeugt einen JSON Schlüssel mit den gegebenen Werten für den Datenbereich'
			}
		},
		'OUTBOX.GETIDS': {
			en: {
				argumentList: 'IdFilterText',
				description: 'Returns a list of message IDs which match given filter'
			},
			de: {
				argumentList: 'IdFilterText',
				description: 'Liefert eine Liste von zum Filter passenden Nachrichten IDs zurück'
			}
		},
		OUTBOXMETADATA: {
			en: {
				argumentList: 'Message,ValuesOrRange',
				description: 'Creates a JSON key from the given values or range to retrieve metadata'
			},
			de: {
				argumentList: 'Message,WerteOderBereich',
				description: 'Erzeugt einen JSON Schlüssel mit den gegebenen Werten für Metadaten'
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
		RANGE: {
			en: {
				argumentList: 'CellRange',
				description: 'Creates a flat JSON array from given cell range'
			},
			de: {
				argumentList: 'Zellbereich',
				description: 'Erzeugt ein flaches JSON Array Objekt aus dem angegebenen Zellbereich'
			}
		},
		READ: {
			en: {
				argumentList: 'Key,TargetCellOrRange,Type,Direction,ErrorOnMissing',
				description: 'Reads the values from a JSON object using the given key'
			},
			de: {
				argumentList: 'Schlüssel,ZielzelleOderBereich,Typ,Richtung,FehlerBeiFehlend',
				description: 'Kopiert die Werte aus einem JSON Objekt mit dem gegebenen Schlüssel in einen Zellbereich'
			}
		},
		REFRESH: {
			en: { argumentList: 'Streamsheet', description: 'Updates the current queue of the given streamsheet' },
			de: { argumentList: 'Streamsheet', description: 'Aktualisiert die aktuelle Warteschlange des Streamsheets' }
		},
		REPEATINDEX: {
			en: { argumentList: '', description: 'Returns the current repeat index of the EXECUTE function' },
			de: { argumentList: '', description: 'Gibt den aktuellen Repeat Index der EXECUTE Funktion zurück' }
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
		},
		RETURN: {
			en: {
				argumentList: '',
				description: 'Interrupts the recalculation, if the recalculation is set to endlessly'
			},
			de: {
				argumentList: '',
				description: 'Unterbricht die Berechnung, wenn die Berechnung auf wiederholen gesetzt ist'
			}
		},
		SELECT: {
			en: { argumentList: 'ListRange,ActualValue', description: 'Display a pick list' },
			de: { argumentList: 'Listenbereich,AktuellerWert', description: 'Zeigt eine Auswahlliste an' }
		},
		SETCYCLETIME: {
			en: { argumentList: 'Milliseconds', description: 'Define the cycle time' },
			de: { argumentList: 'Millisekunden', description: 'Setzt den Berechnungsinterval' }
		},
		SETPHASE: {
			en: {
				argumentList: 'Condition,Text,TargetCell',
				description: 'If Condition is true, the Text will be written into target cell'
			},
			de: {
				argumentList: 'Bedingung,PhasenID,ZielZelle',
				description: 'Wenn die Bedingung TRUE ist, wird der Text in die Zielzelle geschrieben'
			}
		},
		SETVALUE: {
			en: {
				argumentList: 'Condition,Value,TargetCell,OverwriteFormula',
				description: 'If Condition is TRUE, the Value will be written into target cell'
			},
			de: {
				argumentList: 'Bedingung,Wert,Zielzelle,ErsetzeZellFormel',
				description: 'Wenn die Bedingung TRUE ist, wird der Wert in die Zielzelle geschrieben'
			}
		},
		SLEEP: {
			en: { argumentList: 'Seconds', description: 'Pause sheet processing' },
			de: { argumentList: 'Sekunden', description: 'Pausiert die Sheet-Verarbeitung' }
		},
		SUBTREE: {
			en: {
				argumentList: 'TopElement,IncludeElementKey',
				description: 'Extracts a sub tree from the current message'
			},
			de: {
				argumentList: 'ÜbergeordnetesElement,InklusiveElementKey',
				description: 'Extrahiert einen Teilbaum aus der aktuellen Nachricht'
			}
		},
		SWAPVALUES: {
			en: { argumentList: 'Range1,Range2', description: 'Swaps the values in range1 with the values in range2' },
			de: {
				argumentList: 'Bereich1,Bereich2',
				description: 'Tauscht die Werte aus Bereich1 mit denen im Bereich2'
			}
		},
		'TABLE.GET': {
			en: {
				argumentList: 'CellRange,RowIndex,ColumnIndex',
				description: 'Gets the value from the table cell at specified index'
			},
			de: {
				argumentList: 'Zellbereich,ZeilenIndex,SpaltenIndex',
				description: 'Liefert den Wert der Tabellenzelle zum angegebenen Index'
			}
		},
		'TABLE.ORDERCOLUMN': {
			en: {
				argumentList: 'ColumnRange,ReferenceRange',
				description: 'Orders the columns in column range according to the corresponding columns in reference range'
			},
			de: {
				argumentList: 'Spaltenbereich,Referenzbereich',
				description: 'Ordnet die Spalten im Spaltenbereich gemäß den korrespondierenden Spalten im Referenzbereich'
			}
		},
		'TABLE.UPDATE': {
			en: {
				argumentList: 'CellRange,Value,RowIndex,ColumnIndex,PushRow,PushColumn,AggregationMethod',
				description: 'Creates and updates a defined cell range in a table like manner'
			},
			de: {
				argumentList:
					'Zellbereich,Wert,ZeilenIndex,SpaltenIndex,ZeileAnhängen,SpalteAnhängen,AggregationsMethode',
				description: 'Erzeugt und aktualisiert einen Zellbereich in einer Tabellen-ähnlichen Weise'
			}
		},
		TRIGGERSTEP: {
			en: {
				argumentList: '',
				description: 'Triggers a streamsheet step'
			},
			de: {
				argumentList: '',
				description: 'Löst einen Streamsheet-Schritt aus'
			}
		},
		WRITE: {
			en: {
				argumentList: 'Key,Value,Type,TTL',
				description: 'Adds the key and value to a mesasge in the outbox'
			},
			de: {
				argumentList: 'Schlüssel,Value,Typ,TTL',
				description: 'Fügt den Schlüssel und den Wert zu einer Nachricht in der Outbox zu'
			}
		}
	}
};
