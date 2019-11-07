module.exports = {
	en: 'StreamSheet',
	de: 'StreamSheet',
	functions: {
		ARRAY: {
			en: {
				argumentList: 'Range,Nest',
				description: 'Creates a JSON array entry using the given keys and values'
			},
			de: {
				argumentList: 'Bereich,Verschachteln',
				description: 'Erzeugt ein JSON Array Objekt mit den gegebenen Schlüssel und Werten'
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
				argumentList: 'Start,Step[,End,Reset]',
				description:
					'Increments or decrements a cell value by specified Step amount until optional End is reached. Reset initialize counter to Start again.'
			},
			de: {
				argumentList: 'Start,Step[,End,Reset]',
				description:
					'Erhöht oder verringert den Start-Wert um Step bis der optionale End Wert erreicht wurde. Reset initialisiert den Zähler wieder mit Start-Wert.'
			}
		},
		DELETE: {
			en: { argumentList: 'Key', description: 'Delete a message or message content based on the key' },
			de: {
				argumentList: 'Name',
				description: 'Löscht die angegebenen Nachrichten oder den Inhalt einer Nachricht.'
			}
		},
		DELETECELLS: {
			en: { argumentList: 'Range', description: 'Deletes the cells in the given range' },
			de: { argumentList: 'Bereich', description: 'Löscht die Zellen im angegebenen Bereich' }
		},
		DETECTCHANGE: {
			en: {
				argumentList: 'Condition,Period,CondTargetCell,TimeTargetCell',
				description: 'Detects if a condition has changed'
			},
			de: {
				argumentList: 'Bedingung,Periode,ZielZelleBedingung,ZielZelleZeit',
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
			en: { argumentList: 'Condition,[Period],[Delay]', description: 'Detects if a condition has changed' },
			de: {
				argumentList: 'Bedingung,[Periode],[Verzögerung]',
				description: 'Ermittelt, ob sich eine Bedingung in einem Zeitraum geändert hat'
			}
		},
		EXECUTE: {
			en: {
				argumentList: 'StreamSheet,Repeat,JSON,Selector',
				description: 'Triggers the recalculation of another streamsheet'
			},
			de: {
				argumentList: 'StreamSheet,Wiederholen,JSON,Selektor',
				description: 'Aktiviert die Neuberechnung eines andere StreamSheets'
			}
		},
		FEEDINBOX: {
			en: { argumentList: 'JSON,Target', description: 'Sends a JSON directly to another Inbox' },
			de: { argumentList: 'JSON,Ziel', description: 'Sendet das JSON an die angegebene Inbox' }
		},
		'FILE.WRITE': {
			en: {
				argumentList: 'Producer,Range,Directory,Filename,Mode,Separator',
				description: 'Writes a range as CSV to a file'
			},
			de: {
				argumentList: 'Producer,Bereich,Verzeichnis,Dateiname,Mode,Separator',
				description: 'Schreibt einen Bereich als CSV in eine Datei'
			}
		},
		GETCYCLE: {
			en: { argumentList: '', description: 'Returns the current cycle' },
			de: { argumentList: '', description: 'Ermittelt den aktuellen Zyklus.' }
		},
		GETCYCLETIME: {
			en: { argumentList: '', description: 'Returns the current cycle time' },
			de: { argumentList: '', description: 'Ermittelt die aktuelle Zykluszeit.' }
		},
		GETEXECUTESTEP: {
			en: { argumentList: '', description: 'Returns the current execute step count' },
			de: { argumentList: '', description: 'Ermittelt den aktuellen Execute Schritt im StreamSheet.' }
		},
		GETMACHINESTEP: {
			en: { argumentList: '', description: 'Returns the current machine step count' },
			de: { argumentList: '', description: 'Ermittelt den aktuellen Maschinenschritt.' }
		},
		GETSTEP: {
			en: { argumentList: '', description: 'Returns the current step count' },
			de: { argumentList: '', description: 'Ermittelt den aktuellen StreamSheet Schritt.' }
		},
		GOTO: {
			en: { argumentList: 'Cell', description: 'Jumps to the given cell for next cell to evaluate' },
			de: { argumentList: 'Zelle', description: 'Führt die Berechnung an der angegebenen Zelle fort.' }
		},
		INBOX: {
			en: {
				argumentList: 'StreamSheet,Message',
				description: 'Creates a key to reference one or more messages from inbox'
			},
			de: {
				argumentList: 'StreamSheet,Nachricht',
				description: 'Erzeugt einen Schlüssel, der einen oder mehrere Nachrichten aus der Inbox referenziert'
			}
		},
		INBOXDATA: {
			en: {
				argumentList: 'StreamSheet,Source,ValuesOrRange',
				description: 'Creates a JSON key from the given values or range to retrieve data'
			},
			de: {
				argumentList: 'Ziel,WerteOderBereich',
				description: 'Erzeugt einen JSON Schlüssel mit den gegebenen Werten für den Datenbereich'
			}
		},
		INBOXMETADATA: {
			en: {
				argumentList: 'StreamSheet,Source,ValuesOrRange',
				description: 'Creates a JSON key from the given values or range to retrieve metadata'
			},
			de: {
				argumentList: 'Ziel,WerteOderBereich',
				description: 'Erzeugt einen JSON Schlüssel mit den gegebenen Werten für Metadaten'
			}
		},
		JSON: {
			en: { argumentList: 'Range', description: 'Converts given cell range to JSON' },
			de: { argumentList: 'Zellbereich', description: 'Konvertiert den angebenen Zellbereich in ein JSON Objekt' }
		},
		'KAFKA.QUERY': {
			en: {
				argumentList: 'Producer,Query,Target,[Timeout]',
				description:
					'Fetches data from Kafka that matches query. REQUESTINFO can be used to check the status of the query'
			},
			de: {
				argumentList: 'Producer,Query,Ziel,[Timeout]',
				description:
					'Liest Daten aus Kafka mithilfe von Query. Status der Query kann mit REQUESTINFO abgefragt werden'
			}
		},
		'KAFKA.COMMAND': {
			en: {
				argumentList: 'Producer,Command,Target,[Timeout]',
				description: 'Sends a KSQL Command to Kafka. REQUESTINFO can be used to check the status of the query'
			},
			de: {
				argumentList: 'Producer,Command,Ziel,[Timeout]',
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
		LOOPINDEX: {
			en: { argumentList: '', description: 'Returns the current loop index' },
			de: { argumentList: '', description: 'Gibt den aktuellen Loop Index zurück.' }
		},
		'MAIL.SEND': {
			en: {
				argumentList: 'Producer,Message,Subject,TO,CC,BCC,Attachments',
				description: 'Sends a mail to the given mail addresses (TO, CC, BCC)'
			},
			de: {
				argumentList: 'Producer,Nachricht,Betreff,TO,CC,BCC,Anhänge',
				description: 'Versendet eine E-Mail an die E-Mail Adressen (TO, CC, BCC)'
			}
		},
		'MONGO.STORE': {
			en: { argumentList: 'Producer,Collection,Message', description: 'Stores a JSON object in MongoDB' },
			de: { argumentList: 'Producer,Collection,Message', description: 'Speichert ein JSON Objekt in MongoDB' }
		},
		'MONGO.DELETE': {
			en: {
				argumentList: 'Producer,Collection,QueryJSON,[Target],[Timeout]',
				description: 'Deletes matching objects from MongoDB'
			},
			de: {
				argumentList: 'Producer,Collection,QueryJSON,[Ziel],[Timeout]',
				description: 'Löscht gesuchte Objekte aus MongoDB'
			}
		},
		'MONGO.AGGREGATE': {
			en: {
				argumentList: 'Producer,Collection,AggregateJSON,[Target],[ResultKeys],[Timeout]',
				description: 'Execute the Aggregation Pipeline defined by AggregateJSON'
			},
			de: {
				argumentList: 'Producer,Collection,AggregateJSON,[Ziel],[ResultKeys],[Timeout]',
				description: 'Führt die Aggregation Pipeline in AggregateJSON aus'
			}
		},
		'MONGO.COUNT': {
			en: {
				argumentList: 'Producer,Collection,QueryJSON,[Target],[Timeout]',
				description: 'Count matching objects from MongoDB'
			},
			de: {
				argumentList: 'Producer,Collection,QueryJSON,[Ziel],[Timeout]',
				description: 'Zählt gesuchte Objekte aus MongoDB'
			}
		},
		'MONGO.QUERY': {
			en: {
				argumentList: 'Producer,Collection,QueryJSON,Target,[ResultKeys],[PageSize],[Page],[Timeout]',
				description:
					'Finds objects in MongoDB that math QueryJSON. REQUESTINFO can be used to check the status of the query'
			},
			de: {
				argumentList: 'Producer,Collection,QueryJSON,Ziel,[ResultKeys],[Seitengröße],[Seite],[Timeout]',
				description:
					'Findet Objekte in MongoDB die QueryJSON erfüllen. Status der Query kann mit REQUESTINFO abgefragt werden'
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
				argumentList: 'Producer,BoxMessageOrJSON,Topic,QoS',
				description: 'Publishes a referenced Outbox or Inbox message or a JSON via MQTT'
			},
			de: {
				argumentList: 'Producer,BoxNachrichtOderJSON,Topic,QoS',
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
		PRODUCE: {
			en: {
				argumentList: 'Producer,JSON',
				description: 'Produces data using the Producer and a JSON specific to the Producer'
			},
			de: {
				argumentList: 'Producer,JSON',
				description: 'Produziert Daten mithilfe des Producers und dem Producerspezifischen JSON'
			}
		},
		READ: {
			en: {
				argumentList: 'Key,TargetCell,Type',
				description: 'Reads the values from a JSON object using the given key'
			},
			de: {
				argumentList: 'Schüssel,Zielzelle,Typ',
				description: 'Kopiert die Werte aus einem JSON Objekt mit dem gegebenen Schlüssel in die Zelle'
			}
		},
		REFRESH: {
			en: { argumentList: 'StreamSheet', description: 'Updates the current queue of the given streamsheet' },
			de: { argumentList: 'StreamSheet', description: 'Aktualisiert die aktuelle Warteschlange des StreamSheets' }
		},
		REPEATINDEX: {
			en: { argumentList: '', description: 'Returns the current repeat index of the EXECUTE function' },
			de: { argumentList: '', description: 'Gibt den aktuellen Repeat Index der EXECUTE Funktion zurück.' }
		},
		REQUEST: {
			en: {
				argumentList: 'Stream,ParameterJSON,TargetSheet',
				description: 'Create an asynchronous calls to a REST service.'
			},
			de: { argumentList: 'Stream,ParameterJSON,ZielSheet', description: 'Erlaubt Aufrufe in einen REST Dienst.' }
		},
		REQUESTINFO: {
			en: {
				argumentList: 'RequestId',
				description: 'Returns the current status of a previously executed REQUEST function.'
			},
			de: { argumentList: 'RequestId', description: 'Gibt den Status des letzten REQUEST Aufrufs zurück.' }
		},
		RESPOND: {
			en: {
				argumentList: 'Producer,DataObjectId,ObjectOrRange',
				description:
					'Sends JSON data from the outbox or the range to a Producer that send a data object previously'
			},
			de: {
				argumentList: 'Producer,DataObjectId,ObjektOderBereich',
				description:
					'Sendet JSON Daten aus der Outbox oder vom gegebenen Bereich an einen Producer mit Hilfe\n\t\t\t\tder DataObjectId'
			}
		},
		'REST.REQUEST': {
			en: {
				argumentList: 'Producer,Path,Method,Target,ResultKeys,Body,Headers',
				description: 'Create an asynchronous calls to a REST service'
			},
			de: {
				argumentList: 'Producer,Pfad,Methode,Ziel,ResultKeys,Body,Headers',
				description: 'Erlaubt Aufrufe in einen REST Dienst'
			}
		},
		'REST.RESPOND': {
			en: {
				argumentList: 'Consumer,DataObjectId,Body,StatusCode,Headers',
				description: 'Sends data to a Producer that send a data object previously'
			},
			de: {
				argumentList: 'Consumer,DataObjectId,Body,StatusCode,Headers',
				description: 'Sendet Daten an einen Producer mit Hilfe der DataObjectId.'
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
			en: { argumentList: 'ListRange,CurrentValue', description: 'Display a pick list.' },
			de: { argumentList: 'Listenbereich,AktuellerWert', description: 'Zeigt eine Auswahlliste an.' }
		},
		SETCYCLETIME: {
			en: { argumentList: 'Milliseconds', description: 'Define the cycle time' },
			de: { argumentList: 'Millisekunden', description: 'Setzt den Berechnungsinterval.' }
		},
		SETPHASE: {
			en: {
				argumentList: 'Condition,Text,PhaseCell',
				description: 'If Condition is true, the Text will be written into PhaseCell'
			},
			de: {
				argumentList: 'Bedingung,PhasenID,PhasenZelle',
				description: 'Wenn die Bedingung TRUE ist, wird der Text in die Phasenzelle geschrieben'
			}
		},
		SETVALUE: {
			en: {
				argumentList: '[Condition],Value,Cell,[OverwriteFormula]',
				description: 'If Condition is TRUE, the Value will be written into Cell'
			},
			de: {
				argumentList: '[Bedingung],Wert,Zelle,[ErsetzeZellFormel]',
				description: 'Wenn die Bedingung TRUE ist, wird der Wert in die Zelle geschrieben'
			}
		},
		SUBTREE: {
			en: {
				argumentList: 'TopElement,[IncludeElementKey]',
				description: 'Extracts a sub tree from the current message'
			},
			de: {
				argumentList: 'ÜbergeordnetesElement,[InklusiveElementKey]',
				description: 'Extrahiert einen Teilbaum aus der aktuellen Nachricht'
			}
		},
		SWAPVALUES: {
			en: {
				argumentList: 'SourceRange,TargetRange',
				description: 'Swaps the values in the source range with the values in the target range'
			},
			de: {
				argumentList: 'Quellbereich,Zielbereich',
				description: 'Tauscht die Werte aus dem Quellbereich mit denen im Zielbereich'
			}
		},
		TIMEAGGREGATE: {
			en: {
				argumentList: 'Data,Backperiod,Method,BaseTime,Interval,TargetRange',
				description: 'Aggregates values with the BackPeriod using the given method within the interval'
			},
			de: {
				argumentList: 'Wert,Gesamtperiode,Methode,BasisZeit,Intervall,Zielbereich',
				description:
					'Aggregiert Werte in der Gesamtperiode mit der angebenen Methode für den angegebenen Intervall'
			}
		},
		WRITE: {
			en: { argumentList: 'Key,Value,Type', description: 'Adds the key and value to a JSON object' },
			de: {
				argumentList: 'Schüssel,Value,Typ',
				description: 'Fügt den Schlüssel und den Wert einem JSON Objekt zu'
			}
		}
	}
};
