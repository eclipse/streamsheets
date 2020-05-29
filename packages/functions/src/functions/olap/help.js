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
	en: 'Olap',
	de: 'Olap',
	functions: {
		OLAPCUBECREATE: {
			en: { argumentList: 'Token,Database,Name,Dimensions', description: 'Create cube in database.' },
			de: { argumentList: 'Token,Datenbank,Name,Dimensionen', description: 'Würfel in der Datenbank erzeugen.' }
		},
		OLAPCUBEDELETE: {
			en: { argumentList: 'Token,Database,Name', description: 'Delete cube in database.' },
			de: { argumentList: 'Token,Datenbank,Name', description: 'Würfel in der Datenbank löschen.' }
		},
		OLAPCUBEDIMLIST: {
			en: { argumentList: 'Token,Database,Cube,Index', description: 'Get id of dimension in database at index.' },
			de: {
				argumentList: 'Token,Datenbank,Würfel,Index',
				description: 'Dimensions ID mit Index in der Datenbank abfragen.'
			}
		},
		OLAPCUBELIST: {
			en: { argumentList: 'Token,Database,Index', description: 'Get name of cube in database at index.' },
			de: {
				argumentList: 'Token,Datenbank,Index',
				description: 'Würfelnamen mit Index in der Datenbank abfragen.'
			}
		},
		OLAPDATA: {
			en: {
				argumentList: 'Token,Database,Cube,Elements',
				description: 'Get value from cube. Elements for all dimensions must be provided.'
			},
			de: {
				argumentList: 'Token,Datenbank,Würfel,Elemente',
				description: 'Wert aus Würfel abfragen. Es muss für jede Dimension ein Element angegeben werden.'
			}
		},
		OLAPDATAS: {
			en: { argumentList: 'SliceName,Element1,Element2', description: 'Get value from defined slice.' },
			de: { argumentList: 'SliceName,Element1,Element2', description: 'Wert aus Schnitt abfragen.' }
		},
		OLAPDBCREATE: {
			en: { argumentList: 'Token,Name', description: 'Create database.' },
			de: { argumentList: 'Token,Name', description: 'Datenbank erzeugen.' }
		},
		OLAPDBDELETE: {
			en: { argumentList: 'Token,Database', description: 'Delete database.' },
			de: { argumentList: 'Token,Datenbank', description: 'Datenbank löschen.' }
		},
		OLAPDBLIST: {
			en: { argumentList: 'Token,Index', description: 'Get name of database at index.' },
			de: { argumentList: 'Token,Index', description: 'Datenbanknamen mit Index abfragen.' }
		},
		OLAPDIMCREATE: {
			en: { argumentList: 'Token,Database,Name', description: 'Create dimension in database.' },
			de: { argumentList: 'Token,Datenbank,Name', description: 'Dimension in der Datenbank erzeugen.' }
		},
		OLAPDIMDELETE: {
			en: { argumentList: 'Token,Database,Name', description: 'Delete dimension in database.' },
			de: { argumentList: 'Token,Datenbank,Name', description: 'Dimension in der Datenbank löschen.' }
		},
		OLAPDIMLIST: {
			en: { argumentList: 'Token,Database,Index', description: 'Get name of dimension in database at index.' },
			de: {
				argumentList: 'Token,Datenbank,Index',
				description: 'Dimensionsnamen mit Index in der Datenbank abfragen.'
			}
		},
		OLAPDIMNAME: {
			en: {
				argumentList: 'Token,Database,DimensionId',
				description: 'Get name of dimension in database for Id.'
			},
			de: {
				argumentList: 'Token,Datenbank,DimenionsId',
				description: 'Dimensionsnamen mit Id in der Datenbank abfragen.'
			}
		},
		OLAPECONSOLIDATE: {
			en: {
				argumentList: 'Token,Database,Dimension,Element,Children,Weights',
				description: 'Define consolidated element.'
			},
			de: {
				argumentList: 'Token,Datenbank,Dimenion,Element,Kinder,Gewichtungen',
				description: 'Konsoliertes Elemente definieren.'
			}
		},
		OLAPECREATE: {
			en: {
				argumentList: 'Token,Database,Dimension,Name,Type,Children,Weights',
				description: 'Create element in dimension.'
			},
			de: {
				argumentList: 'Token,Datenbank,Dimenion,Name,Type,Kinder,Gewichtungen',
				description: 'Elemente erzeugen.'
			}
		},
		OLAPEDELETE: {
			en: { argumentList: 'Token,Database,Dimension,Name', description: 'Delete element in dimension.' },
			de: { argumentList: 'Token,Datenbank,Dimenion,Name', description: 'Elemente löschen.' }
		},
		OLAPEDELETEALL: {
			en: { argumentList: 'Token,Database,Dimension', description: 'Delete all elements in dimension.' },
			de: { argumentList: 'Token,Datenbank,Dimenion', description: 'Alle Elemente in Dimension löschen.' }
		},
		OLAPENAME: {
			en: {
				argumentList: 'Token,Database,Dimension,Index',
				description: 'Get name of element in dimension using index.'
			},
			de: {
				argumentList: 'Token,Datenbank,Dimenion,Index',
				description: 'Elementnamen am Index in der Dimension abfragen.'
			}
		},
		OLAPLOGIN: {
			en: { argumentList: 'User,Password', description: 'Log into OLAP Server.' },
			de: { argumentList: 'Benutzer,Passwort', description: 'Im OLAP Server anmelden.' }
		},
		OLAPLOGOUT: {
			en: { argumentList: 'Token', description: 'Logout from OLAP Server.' },
			de: { argumentList: 'Token', description: 'Beim OLAP Server abmelden.' }
		},
		OLAPSETDATA: {
			en: {
				argumentList: 'Token,Database,Cube,Value,Splash,Elements',
				description: 'Set value to cube. Elements for all dimensions must be provided.'
			},
			de: {
				argumentList: 'Token,Datenbank,Würfel,Wert,Verteilen,Elemente',
				description: 'Wert in Würfel Schreiben. Es muss für jede Dimension ein Element angegeben werden.'
			}
		},
		OLAPSERVERSAVE: {
			en: { argumentList: 'Token', description: 'Persist Server.' },
			de: { argumentList: 'Token', description: 'Server persistieren.' }
		},
		OLAPSLICE: {
			en: {
				argumentList: 'Token,SliceName,Database,Cube,Elements',
				description: 'Get two dimensional slice from cube. The elements for two dimensions can be ranges.'
			},
			de: {
				argumentList: 'Token,SliceName,Datenbank,Würfel,Elemente',
				description:
					'Zweidimensionale Wertetabelle aus Würfel abfragen. Zwei Elemente können einen Bereich enthalten.'
			}
		},
		OLAPSLICEDELETE: {
			en: { argumentList: 'SliceName', description: 'Delete existing slice.' },
			de: { argumentList: 'SliceName', description: 'Vorhandene Wertetabelle löschen.' }
		}
	}
};