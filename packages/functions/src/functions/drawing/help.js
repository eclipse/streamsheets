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
	en: 'Drawing',
	de: 'Zeichnen',
	functions: {
		AXIS: {
			en: {
				argumentList:
					'Min,Max,Step,TimeStep,ZoomMin,ZoomMax',
				description: 'Defines axis parameters'
			},
			de: {
				argumentList:
					'Minimum,Maximum,Schritt,Zeittyp,ZoomMinimum,ZoomMaximum',
				description: 'Definiert Achsenparameter'
			}
		},
		BAR: {
			en: {
				argumentList: 'Value,Direction,FillColor,LineColor',
				description: 'Draw a bar in the cell, where the function resides'
			},
			de: {
				argumentList: 'Zahl,Richtung,Füllfarbe,Linienfarbe',
				description: 'Zeichnet einen vertikalen oder horizonalen Balken in der Zelle, wo die Funktion ist'
			}
		},
		CELLCHART: {
			en: {
				argumentList:
					'DataRange,Charttype,LineColor,FillColor,MarkerStyle,AxisMin,AxisMax',
				description: 'Displays a chart in the cell'
			},
			de: {
				argumentList: 'Datenbereich,Diagrammtype,Linienfarbe,Füllfarbe,Markerstil,Achsenminimum,Achsenmaximum',
				description: 'Zeichnet ein Diagramm in der Zelle der Funktion'
			}
		},
		CLASSIFYPOINT: {
			en: { argumentList: 'X,Y,PolygonPointRange', description: 'Checks, if a point lies within a polygon' },
			de: { argumentList: 'X,Y,Punktebereich', description: 'Prüft, ob ein Punkt in einem Polygon liegt' }
		},
		'DRAW.BUTTON': {
			en: {
				argumentList:
					'X,Y,Width,Height,LineColor,FillColor,Angle,Label,Value',
				description: 'Creates a button control'
			},
			de: {
				argumentList:
					'X,Y,Breite,Höhe,Linienfarbe,Füllfarbe,Winkel,Label,Wert',
				description: 'Erzeugt ein Button Objekt'
			}
		},
		'DRAW.CHECKBOX': {
			en: {
				argumentList:
					'X,Y,Width,Height,LineColor,FillColor,Angle,Label,Value',
				description: 'Creates a checkbox control'
			},
			de: {
				argumentList:
					'X,Y,Breite,Höhe,Linienfarbe,Füllfarbe,Winkel,Label,Wert',
				description: 'Erzeugt ein Checkbox Objekt'
			}
		},
		'DRAW.ELLIPSE': {
			en: {
				argumentList:
					'X,Y,Width,Height,LineColor,FillColor,Angle',
				description: 'Creates an ellipse within the given drawing'
			},
			de: {
				argumentList:
					'X,Y,Breite,Höhe,Linienfarbe,Füllfarbe,Winkel',
				description: 'Erzeugt eine Ellipse in der angegebenen Zeichnung'
			}
		},
		'DRAW.LABEL': {
			en: {
				argumentList:
					'X,Y,Width,Height,LineColor,FillColor,Angle,Text,Font',
				description: 'Creates a text element'
			},
			de: {
				argumentList:
					'X,Y,Breite,Höhe,LinienFarbe,Füllfarbe,Winkel,Text',
				description: 'Erzeugt ein Textelement'
			}
		},
		'DRAW.LINE': {
			en: { argumentList: 'X1,Y1,X2,Y2,LineColor', description: 'Creates a line' },
			de: { argumentList: 'X1,Y1,X2,Y2,Linienfarbe', description: 'Erzeugt eine Linie' }
		},
		'DRAW.KNOB': {
			en: {
				argumentList:
					'X,Y,Width,Height,LineColor,FillColor,Angle,Label,Value,Min,Max,Step,Marker,FormatRange,StartAngle,EndAngle',
				description: 'Creates a knob control'
			},
			de: {
				argumentList:
					'X,Y,Breite,Höhe,Linienfarbe,Füllfarbe,Winkel,Label,Wert,Minimum,Maximum,Schritt,Marker,Skalenformat,StartWinkel,EndWinkel',
				description: 'Erzeugt ein Drehregler Objekt'
			}
		},
		'DRAW.STREAMCHART': {
			en: {
				argumentList:
					'X,Y,Width,Height,LineColor,FillColor,Angle',
				description: 'Creates a chart'
			},
			de: {
				argumentList:
					'X,Y,Breite,Höhe,Linienfarbe,Füllfarbe,Winkel',
				description: 'Erzeugt ein Diagramm'
			}
		},
		'DRAW.POLYGON': {
			en: {
				argumentList:
					'X,Y,Width,Height,LineColor,FillColor,Angle,PointRange,Close',
				description: 'Creates a polygon within the given drawing using proportional coordinates'
			},
			de: {
				argumentList:
					'X,Y,Breite,Höhe,Linienfarbe,Füllfarbe,Winkel,PunkteBereich,Schließen',
				description: 'Erzeugt ein Polygon mit den angegebenen Koordinaten'
			}
		},
		'DRAW.BEZIER': {
			en: {
				argumentList:
					'X,Y,Width,Height,LineColor,FillColor,Angle,PointRange,Close',
				description: 'Creates a bezier within the given drawing using proportional coordinates'
			},
			de: {
				argumentList:
					'X,Y,Breite,Höhe,Linienfarbe,Füllfarbe,Winkel,PunkteBereich,Schließen',
				description: 'Erzeugt eine Bezier Kurve mit den angegebenen Koordinaten'
			}
		},
		'DRAW.RECTANGLE': {
			en: {
				argumentList:
					'X,Y,Width,Height,LineColor,FillColor,Angle',
				description: 'Creates a rectangle within the given drawing'
			},
			de: {
				argumentList:
					'X,Y,Breite,Höhe,Linienfarbe,Füllfarbe,Winkel',
				description: 'Erzeugt ein Rechteck in der angegebenen Zeichnung'
			}
		},
		'DRAW.SLIDER': {
			en: {
				argumentList:
					'X,Y,Width,Height,LineColor,FillColor,Angle,Label,Value,Min,Max,Step,Marker,FormatRange',
				description: 'Creates a slider control'
			},
			de: {
				argumentList:
					'X,Y,Breite,Höhe,Linienfarbe,Füllfarbe,Winkel,Label,Wert,Minimum,Maximum,Schritt,Marker,Skalenformat',
				description: 'Erzeugt ein Schieberegler Objekt'
			}
		},
		ONCLICK: {
			en: {
				argumentList: 'Function',
				description: 'Executes given function on a mouse click on top of a drawing or drawing item'
			},
			de: {
				argumentList: 'Funktion',
				description:
					'Führt die angegebene Funktion auf dem Server aus, wenn eine Zeichnung oder ein Objekt angeklickt wurde'
			}
		},
		ONDOUBLECLICK: {
			en: {
				argumentList: 'Function',
				description: 'Executes given function on a mouse double click on top of a drawing or drawing item'
			},
			de: {
				argumentList: 'Funktion',
				description:
					'Führt die angegebene Funktion auf dem Server aus, wenn eine Zeichnung oder ein Objekt doppelt angeklickt wurde'
			}
		},
		ONMOUSEDOWN: {
			en: {
				argumentList: 'Function',
				description: 'Executes given function on a mouse button down event on top of a drawing or drawing item'
			},
			de: {
				argumentList: 'Funktion',
				description:
					'Führt die angegebene Funktion auf dem Server aus, wenn auf einer Zeichnung oder einem Objekt der Mausschalter gedrückt wurde'
			}
		},
		ONMOUSEUP: {
			en: {
				argumentList: 'Function',
				description: 'Executes given function on a mouse button up event on top of a drawing or drawing item'
			},
			de: {
				argumentList: 'Funktion',
				description:
					'Führt die angegebene Funktion auf dem Server aus, wenn auf einer Zeichnung oder einem Objekt der Mausschalter losgelassen wurde'
			}
		},
		ONVALUECHANGE: {
			en: {
				argumentList: 'Function',
				description: 'Executes given function, if a graphical item changes a status value'
			},
			de: {
				argumentList: 'Funktion',
				description:
					'Führt die angegebene Funktion auf dem Server aus, wenn bei einem Graphikobjekt ein Statuswert geändert wird.'
			}
		},
		'OPEN.URL': {
			en: {
				argumentList: 'URL,NewTab',
				description: 'Allows to open the given URL as a result of a mouse event.'
			},
			de: {
				argumentList: 'URL,NeuerTab',
				description:
					'Ermöglicht das Öffnen einer URL als Reaktion auf ein Mausereignis.'
			}
		},
		QRCODE: {
			en: { argumentList: 'Text', description: 'Create a QRCode key' },
			de: {
				argumentList: 'Text',
				description: 'Erzeugt einen QRCode Schlüssel, der für Füllmuster benutzt werden kann'
			}
		},
		SERIES: {
			en: {
				argumentList:
					'SeriesTitle,CategoriesOrXValues,YValues,RadiusOrColorValues',
				description: 'Defines series parameters for Cell Ranges'
			},
			de: {
				argumentList:
					'Reihentitel,KategorienOderXWerte,YWerte,RadiusOderFarbwerte',
				description: 'Definiert Datenreihen Parameter für Zellbereiche'
			}
		},
		SERIESTIME: {
			en: {
				argumentList:
					'SeriesTitleXValues,SeriesTitleYValues,TimeFunction,XValuesField,YValuesField,RadiusColorValuesField',
				description: 'Defines series parameters for time based functions'
			},
			de: {
				argumentList:
					'SeriesTitleXValues,SeriesTitleYValues,TimeFunction,XValuesField,YValuesField,RadiusColorValuesField',
				description: 'Definiert Datenreihen Parameter für Zeitreihenfunktionen'
			}
		},
	}
};
