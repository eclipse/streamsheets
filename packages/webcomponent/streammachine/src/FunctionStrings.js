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
/* eslint-disable max-len */
// import { appStrings } from './i18n';
import JSG from '@cedalo/jsg-ui';
// import store from '../store';

const { CellEditor } = JSG;

const Categories = {
	all: {
		en: 'All',
		de: 'Alle',
	},
	database: {
		en: 'Database',
		de: 'Datenbank',
	},
	date: {
		en: 'Date',
		de: 'Datum',
	},
	drawing: {
		en: 'Drawing',
		de: 'Zeichnen',
	},
	engineering: {
		en: 'Engineering',
		de: 'Technik',
	},
	info: {
		en: 'Information',
		de: 'Information',
	},
	logical: {
		en: 'Logical',
		de: 'Logisch',
	},
	lookup: {
		en: 'Lookup',
		de: 'Verweisen',
	},
	math: {
		en: 'Math',
		de: 'Mathematik',
	},
	// olap: {
	// 	en: 'Olap',
	// 	de: 'Olap',
	// },
	stack: {
		en: 'Stack',
		de: 'Stack',
	},
	statistical: {
		en: 'Statistic',
		de: 'Statistik',
	},
	text: {
		en: 'Text',
		de: 'Text',
	},
	streamsheet: {
		en: 'StreamSheet',
		de: 'StreamSheet',
	},
};

const Strings = {
	ABS: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Returns the absolute value of a given number',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den absoluten Betrag einer Zahl zurück',
		},
	},
	AND: {
		category: 'logical',
		en: {
			argumentList: 'Value1,Value2',
			description: 'Evaluates, if all given values are true',
		},
		de: {
			argumentList: 'Wert1, Wert2',
			description: 'Berechnet, ob alle Werte wahr sind',
		},
	},
	ARCCOS: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Returns the arccosine value of the value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den Arkus Cosinus der Zahl zurück',
		},
	},
	ARCSIN: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Returns the arcsine value of the value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den Arkus Sinus der Zahl zurück',
		},
	},
	ARCTAN: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Returns the arctangent value of the value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den Arkus Tangens der Zahl zurück',
		},
	},
	ARCTAN2: {
		category: 'math',
		en: {
			argumentList: 'X,Y',
			description: 'Returns the arctangent value based on the given x and y coordinates',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den Arkus Tangens basierend auf den übergebenen X und Y Koordinaten zurück',
		},
	},
	ARRAY: {
		category: 'streamsheet',
		en: {
			argumentList: 'Range,Nest',
			description: 'Creates a JSON array entry using the given keys and values',
		},
		de: {
			argumentList: 'Bereich,Verschachteln',
			description: 'Erzeugt ein JSON Array Objekt mit den gegebenen Schlüssel und Werten',
		},
	},
	AVERAGE: {
		category: 'statistical',
		en: {
			argumentList: 'Value1,[ValueN]',
			description: 'Returns the average of specified cell values.',
		},
		de: {
			argumentList: 'Wert1,[WertN]',
			description: 'Bestimmt den Mittelwert über alle aufgelisteten Zellwerte',
		},
	},
	BAR: {
		category: 'drawing',
		en: {
			argumentList: 'Value,Direction,FillColor,LineColor',
			description: 'Draw a bar in the cell, where the function resides',
		},
		de: {
			argumentList: 'Zahl,Richtung,Füllfarbe,Linienfarbe',
			description: 'Zeichnet einen vertikalen oder horizonalen Balken in der Zelle, wo die Funktion ist',
		},
	},
	BIN2DEC: {
		category: 'engineering',
		en: {
			argumentList: 'Value',
			description: 'Converts a binary number to decimal',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Konvertiert eine binäre Zahl in eine dezimale',
		},
	},
	BIN2HEX: {
		category: 'engineering',
		en: {
			argumentList: 'Value, [Places]',
			description: 'Converts a binary number to hexadecimal',
		},
		de: {
			argumentList: 'Zahl; [Stellen]',
			description: 'Konvertiert eine binäre Zahl in eine hexaddezimale',
		},
	},
	BIN2OCT: {
		category: 'engineering',
		en: {
			argumentList: 'Value, [Places]',
			description: 'Converts a binary number to octal',
		},
		de: {
			argumentList: 'Zahl; [Stellen]',
			description: 'Konvertiert eine binäre Zahl in eine oktale',
		},
	},
	CHAR: {
		category: 'text',
		en: {
			argumentList: 'Number,[CharacterSet]',
			description: 'Returns the character represented by given number',
		},
		de: {
			argumentList: 'Zahl,[CharacterSet]',
			description: 'Liefert das Zeichen, das der angegebenen Zahl entspricht, zurück',
		},
	},
	CHOOSE: {
		category: 'lookup',
		en: {
			argumentList: 'Index,Value1,[ValueN]',
			description: 'Returns the value at specified index from parameter list',
		},
		de: {
			argumentList: 'Index,Wert1,[WertN]',
			description: 'Gibt den Wert an der angebgebenen Stelle in der Parameterliste zurück',
		},
	},
	CLASSIFYPOINT: {
		category: 'drawing',
		en: {
			argumentList: 'X,Y,PointRange',
			description: 'Checks, if a point lies within a polygon',
		},
		de: {
			argumentList: 'X,Y,Punktebereich',
			description: 'Prüft, ob ein Punkt in einem Polygon liegt',
		},
	},
	CLEAN: {
		category: 'text',
		en: {
			argumentList: 'Text,[Extended]',
			description: 'Removes all non-printable characters from given text',
		},
		de: {
			argumentList: 'Text,[Extended]',
			description: 'Entfernt alle nicht darstellbaren Zeichen des übergebenen Textes',
		},
	},
	CODE: {
		category: 'text',
		en: {
			argumentList: 'Text,[CharacterSet]',
			description: 'Returns the numeric code for the first character of given text',
		},
		de: {
			argumentList: 'Text,[CharacterSet]',
			description: 'Gibt die Zahl, die dem 1. Zeichen des übergebenen Textes entspricht, zurück',
		},
	},
	'COLOR.CONVERT': {
		category: 'streamsheet',
		en: {
			argumentList: 'Color,SourceFormat,TargetFormat',
			description: 'Converts a color-string from its source format to specified target format',
		},
		de: {
			argumentList: 'Farbe,Quellformat,Zielformat',
			description: 'Konvertiert einen Farb-String aus seinem Quellformat ins Zielformat',
		},
	},
	COLUMN: {
		category: 'lookup',
		en: {
			argumentList: '[Reference]',
			description: 'Returns the column number of given cell reference',
		},
		de: {
			argumentList: '[Referenz]',
			description: 'Ermittelt die Spaltennummer der angegebenen Zellreferenz',
		},
	},
	CONCAT: {
		category: 'text',
		en: {
			argumentList: 'Value1,[ValueN]',
			description: 'Combines values of specified cells or cell ranges to one string',
		},
		de: {
			argumentList: 'Wert1,[WertN]',
			description: 'Fügt alle Werte der angegebenen Zellen oder Zellbereiche zu einem Text zusammen',
		},
	},
	COPYVALUES: {
		category: 'streamsheet',
		en: {
			argumentList: 'SourceRange,TargetRange',
			description: 'Copies the values of the source range to the target range',
		},
		de: {
			argumentList: 'Quellbereich,Zielbereich',
			description: 'Kopiert die Werte aus dem Quellbereich in den Zielbereich',
		},
	},
	COS: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Returns the cosine value of the value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den Cosinus der Zahl zurück',
		},
	},
	COUNT: {
		category: 'statistical',
		en: {
			argumentList: 'Value1,[ValueN]',
			description: 'Counts the amount of number values in specified cells',
		},
		de: {
			argumentList: 'Wert1,[WertN]',
			description: 'Zählt alle Werte, die einer Zahl entsprechen, aus den angegebenen Zellen oder Zellbereiche',
		},
	},
	COUNTER: {
		category: 'streamsheet',
		en: {
			argumentList: 'Start,Step[,End,Reset]',
			description:
				'Increments or decrements a cell value by specified Step amount until optional End is reached. Reset initialize counter to Start again.',
		},
		de: {
			argumentList: 'Start,Step[,End,Reset]',
			description:
				'Erhöht oder verringert den Start-Wert um Step bis der optionale End Wert erreicht wurde. Reset initialisiert den Zähler wieder mit Start-Wert.',
		},
	},
	DATE: {
		category: 'date',
		en: {
			argumentList: 'Years,Months,Days',
			description: 'Converts a date specified by given years, months and days to a corresponding serial number',
		},
		de: {
			argumentList: 'Jahre,Monate,Tage',
			description:
				'Konvertiert ein Datum, dass durch Jahre, Monate und Tage spezifiziert ist, in eine serielle Zahl',
		},
	},
	DATEVALUE: {
		category: 'date',
		en: {
			argumentList: 'Text',
			description: 'Converts a date specified by given text to a serial number',
		},
		de: {
			argumentList: 'Text',
			description: 'Konvertiert ein als Text gegebenes Datum in eine serielle Zahl',
		},
	},
	DAVERAGE: {
		category: 'database',
		en: {
			argumentList: 'CellRange,ColumnIndex,CriteriaRange',
			description: 'Returns the average of all cells at specified column in rows which match given criterias',
		},
		de: {
			argumentList: 'ZellBereich,SpaltenIndex,KriteriumBereich',
			description:
				'Berechnet den Durchschnitt aller Zellen in der angegebenen Spalte zu den Zeilen, die die Bedingungen erfüllen',
		},
	},
	DAY: {
		category: 'date',
		en: {
			argumentList: 'Value',
			description: 'Returns the day of the time value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den Tag eines Zeitwertes zurück',
		},
	},
	DCOUNT: {
		category: 'database',
		en: {
			argumentList: 'CellRange,ColumnIndex,CriteriaRange',
			description:
				'Counts all cells that represent a number at specified column in rows which match given criterias ',
		},
		de: {
			argumentList: 'ZellBereich,SpaltenIndex,KriteriumBereich',
			description:
				'Zählt alle Zellen, deren Wert einer Zahl entspricht, in der angegebenen Spalte, bei denen die Zeilen die Bedingungen erfüllen',
		},
	},
	DEC2BIN: {
		category: 'engineering',
		en: {
			argumentList: 'Value, [Places]',
			description: 'Converts a decimal number to binary',
		},
		de: {
			argumentList: 'Zahl; [Stellen]',
			description: 'Konvertiert eine dezimale Zahl in eine binäre',
		},
	},
	DEC2HEX: {
		category: 'engineering',
		en: {
			argumentList: 'Value, [Places]',
			description: 'Converts a decimal number to hexadecimal',
		},
		de: {
			argumentList: 'Zahl; [Stellen]',
			description: 'Konvertiert eine dezimale Zahl in eine hexaddezimale',
		},
	},
	DEC2OCT: {
		category: 'engineering',
		en: {
			argumentList: 'Value, [Places]',
			description: 'Converts a decimal number to octal',
		},
		de: {
			argumentList: 'Zahl; [Stellen]',
			description: 'Konvertiert eine dezimale Zahl in eine oktale',
		},
	},
	DEGREES: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Converts radians to degrees',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Wandelt einen radialen Winkel in Grad um',
		},
	},
	DELETE: {
		category: 'streamsheet',
		en: {
			argumentList: 'Key',
			description: 'Delete a message or message content based on the key',
		},
		de: {
			argumentList: 'Name',
			description: 'Löscht die angegebenen Nachrichten oder den Inhalt einer Nachricht.',
		},
	},
	DELETECELLS: {
		category: 'streamsheet',
		en: {
			argumentList: 'Range',
			description: 'Deletes the cells in the given range',
		},
		de: {
			argumentList: 'Bereich',
			description: 'Löscht die Zellen im angegebenen Bereich',
		},
	},
	// DELETEDRAWING: {
	// 	category: 'drawing',
	// 	en: {
	// 		argumentList: 'Name',
	// 		description: 'Remove a drawing with the given name',
	// 	},
	// 	de: {
	// 		argumentList: 'Name',
	// 		description: 'Löscht die angegebene Zeichnung',
	// 	},
	// },
	DETECTCHANGE: {
		category: 'streamsheet',
		en: {
			argumentList: 'Condition,Period,CondTargetCell,TimeTargetCell',
			description: 'Detects if a condition has changed',
		},
		de: {
			argumentList: 'Bedingung,Periode,ZielZelleBedingung,ZielZelleZeit',
			description: 'Ermittelt, ob sich eine Bedingung in einem Zeitraum geändert hat',
		},
	},
	DICTIONARY: {
		category: 'streamsheet',
		en: {
			argumentList: 'Range,Horizontal',
			description: 'Creates a JSON Object using the given keys and values',
		},
		de: {
			argumentList: 'Bereich,Horizontal',
			description: 'Erzeugt ein JSON Object mit den gegenen Schlüssel und Werten',
		},
	},
	DMAX: {
		category: 'database',
		en: {
			argumentList: 'CellRange,ColumnIndex,CriteriaRange',
			description:
				'Returns the largest number of all cells at specified column in rows which match given criterias ',
		},
		de: {
			argumentList: 'ZellBereich,SpaltenIndex,KriteriumBereich',
			description:
				'Gibt die größte Zahl der Zellen in der angegebenen Spalte zurück, bei denen die Zeilen die Bedingungen erfüllen',
		},
	},
	DMIN: {
		category: 'database',
		en: {
			argumentList: 'CellRange,ColumnIndex,CriteriaRange',
			description:
				'Returns the smallest number of all cells at specified column in rows which match given criterias ',
		},
		de: {
			argumentList: 'ZellBereich,SpaltenIndex,KriteriumBereich',
			description:
				'Gibt die kleinste Zahl der Zellen in der angegebenen Spalte zurück, bei denen die Zeilen die Bedingungen erfüllen',
		},
	},
	// DRAWING: {
	// 	category: 'drawing',
	// 	en: {
	// 		argumentList:
	// 			'Name,Range,Line,Fill,XMin,YMin,XMax,Ymax,EventFunction',
	// 		description: 'Erzeugt einen Zeichenbereich',
	// 	},
	// 	de: {
	// 		argumentList:
	// 			'Name,Bezug,Linienformat,Füllformat,XMin,XMax,YMin,YMax,EventFunktion',
	// 		description: 'Create a drawing are',
	// 	},
	// },
	'DRAW.BUTTON': {
		category: 'drawing',
		en: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Width,Height,Line,Fill,Attributes,Events,Angle,RotCenter,Label,LabelFont,Value',
			description: 'Creates a button control',
		},
		de: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Breite,Höhe,Linienformat,Füllformat,Attribute,Events,Winkel,Ankerpunkt,Label,Labelschrift,Wert',
			description: 'Erzeugt ein Button Objekt',
		},
	},
	'DRAW.CHECKBOX': {
		category: 'drawing',
		en: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Width,Height,Line,Fill,Attributes,Events,Angle,RotCenter,Label,LabelFont,Value',
			description: 'Creates a button control',
		},
		de: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Breite,Höhe,Linienformat,Füllformat,Attribute,Events,Winkel,Ankerpunkt,Label,Labelschrift,Wert',
			description: 'Erzeugt ein Button Objekt',
		},
	},
	'DRAW.ELLIPSE': {
		category: 'drawing',
		en: {
			argumentList: 'UniqueID,Container,Name,X,Y,Width,Height,Line,Fill,Attributes,Events,Angle,RotCenter',
			description: 'Creates an ellipse within the given drawing',
		},
		de: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Breite,Höhe,Linienformat,Füllformat,Attribute,Events,Winkel,Ankerpunkt',
			description: 'Erzeugt eine Ellipse in der angegebenen Zeichnung',
		},
	},
	'DRAW.LABEL': {
		category: 'drawing',
		en: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Width,Height,Line,Fill,Attributes,Events,Angle,RotCenter,Text,Font',
			description: 'Creates a text element',
		},
		de: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Breite,Höhe,LinienFormat,Füllformat,Attribute,Events,Winkel,Ankerpunkt,Text,Font',
			description: 'Erzeugt ein Textelement',
		},
	},
	'DRAW.LINE': {
		category: 'drawing',
		en: {
			argumentList: 'UniqueID,Container,Name,X1,Y1,X2,Y2,LineFormat',
			description: 'Creates a line',
		},
		de: {
			argumentList: 'UniqueID,Container,Name,X1,Y1,X2,Y2,Linienformat',
			description: 'Erzeugt eine Linie',
		},
	},
	'DRAW.PLOT': {
		category: 'drawing',
		en: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Width,Height,Line,Fill,Attributes,Events,Angle,RotCenter,ChartType,DataRange',
			description: 'Creates a chart',
		},
		de: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Breite,Höhe,Linienformat,Füllformat,Attribute,Events,Winkel,Ankerpunkt,Diagrammtyp,Datenbereich',
			description: 'Erzeugt ein Diagramm',
		},
	},
	'DRAW.POLYGON': {
		category: 'drawing',
		en: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Width,Height,Line,Fill,Attributes,Events,Angle,RotCenter,PointRange,Close',
			description: 'Creates a polygon within the given drawing using proportional coordinates',
		},
		de: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Breite,Höhe,Linienformat,Füllformat,Attribute,Events,Winkel,Ankerpunkt,PunkteBereich,Schließen',
			description: 'Erzeugt ein Polygon mit den angegebenen Koordinaten',
		},
	},
	'DRAW.RECTANGLE': {
		category: 'drawing',
		en: {
			argumentList: 'UniqueID,Parent,Name,X,Y,Width,Height,Line,Fill,Attributes,Events,Angle,RotCenter',
			description: 'Creates a rectangle within the given drawing',
		},
		de: {
			argumentList:
				'UniqueID,Zeichnung,Name,X,Y,Breite,Höhe,Linienformat,Füllformat,Attribute,Events,Winkel,Ankerpunkt',
			description: 'Erzeugt ein Rechteck in der angegebenen Zeichnung',
		},
	},
	'DRAW.SLIDER': {
		category: 'drawing',
		en: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Width,Height,Line,Fill,Attributes,Events,Angle,RotCenter,Label,LabelFont,Value,Min,Max,Step,ScaleFont,Marker,FormatRange',
			description: 'Creates a slider control',
		},
		de: {
			argumentList:
				'UniqueID,Container,Name,X,Y,Breite,Höhe,Linienformat,Füllformat,Attribute,Events,Winkel,Ankerpunkt,Label,Labelschrift,Wert,Minimum,Maximum,Schritt,Skalenschrift,Marker,Skalenformat',
			description: 'Erzeugt ein Schieberegler Objekt',
		},
	},
	DSUM: {
		category: 'database',
		en: {
			argumentList: 'CellRange,ColumnIndex,CriteriaRange',
			description: 'Adds all numbers at specified column in rows which match given criterias ',
		},
		de: {
			argumentList: 'ZellBereich,SpaltenIndex,KriteriumBereich',
			description:
				'Addiert alle Werte der Zellen in der angegebenen Spalte, bei denen die Zeilen die Bedingungen erfüllen',
		},
	},
	'EDGE.DETECT': {
		category: 'streamsheet',
		en: {
			argumentList: 'Condition,[Period],[Delay]',
			description: 'Detects if a condition has changed',
		},
		de: {
			argumentList: 'Bedingung,[Periode],[Verzögerung]',
			description: 'Ermittelt, ob sich eine Bedingung in einem Zeitraum geändert hat',
		},
	},
	EVEN: {
		category: 'math',
		en: {
			argumentList: 'Number',
			description: 'Returns the number rounded up to the nearest event integer',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Rundet eine Zahl auf die nächste gerade Ganzzahl auf',
		},
	},
	EXCEL2JSONTIME: {
		category: 'date',
		en: {
			argumentList: 'Number',
			description: 'Converts a date represented by given serial number to a JSON ISO 8601 date string',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Konvertiert das durch die serielle Zahl repräsentierte Datum ins JSON ISO 8601 Datumsformat ',
		},
	},
	EXECUTE: {
		category: 'streamsheet',
		en: {
			argumentList: 'StreamSheet,Repeat,JSON,Selector',
			description: 'Triggers the recalculation of another streamsheet',
		},
		de: {
			argumentList: 'StreamSheet,Wiederholen,JSON,Selektor',
			description: 'Aktiviert die Neuberechnung eines andere StreamSheets',
		},
	},
	FEEDINBOX: {
		category: 'streamsheet',
		en: {
			argumentList: 'JSON,Target',
			description: 'Sends a JSON directly to another Inbox',
		},
		de: {
			argumentList: 'JSON,Ziel',
			description: 'Sendet das JSON an die angegebene Inbox',
		},
	},
	'FILE.WRITE': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Range,Directory,Filename,Mode,Separator',
			description: 'Writes a range as CSV to a file',
		},
		de: {
			argumentList: 'Producer,Bereich,Verzeichnis,Dateiname,Mode,Separator',
			description: 'Schreibt einen Bereich als CSV in eine Datei',
		},
	},
	FIND: {
		category: 'text',
		en: {
			argumentList: 'Text,WithinText,[FromPos]',
			description: 'Returns index of first character of Text in WithinText if found, otherwise #VALUE!',
		},
		de: {
			argumentList: 'Text,InText,[StartAnPos]',
			description: 'Liefert den Index des ersten Zeichens von Text in InText zurück oder #VALUE!',
		},
	},
	FILLLINEARGRADIENT: {
		category: 'drawing',
		en: {
			argumentList: 'StartColor,EndColor,Angle',
			description: 'Creates a linear gradient fill definition',
		},
		de: {
			argumentList: 'Anfangsfarbe,Endfarbe,Winkel',
			description: 'Erzeugt eine Fülldefinition für lineare Verläufe',
		},
	},
	FILLPATTERN: {
		category: 'drawing',
		en: {
			argumentList: 'DataURI',
			description: 'Creates a pattern fill definition',
		},
		de: {
			argumentList: 'DataURI',
			description: 'Erzeugt eine Musterfülldefinition',
		},
	},
	FILLRADIALGRADIENT: {
		category: 'drawing',
		en: {
			argumentList: 'StartColor,EndColor,XOffset,YOffset',
			description: 'Creates a radial gradient fill definition',
		},
		de: {
			argumentList: 'Anfangsfarbe,Endfarbe,XVersatz,YVersatz',
			description: 'Erzeugt eine Fülldefinition für radiale Verläufe',
		},
	},
	FONTFORMAT: {
		category: 'drawing',
		en: {
			argumentList: 'Name,Size,Style,Color,HorizontalAlignment',
			description: 'Creates a font format to be used for drawing elements',
		},
		de: {
			argumentList: 'Name,Größe,Stil,Farbe,HorizontaleAusrichtung',
			description: 'Erzeugt ein Schriftformat für Zeichenobjekte.',
		},
	},
	GETCYCLE: {
		category: 'streamsheet',
		en: {
			argumentList: '',
			description: 'Returns the current cycle',
		},
		de: {
			argumentList: '',
			description: 'Ermittelt den aktuellen Zyklus.',
		},
	},
	GETCYCLETIME: {
		category: 'streamsheet',
		en: {
			argumentList: '',
			description: 'Returns the current cycle time',
		},
		de: {
			argumentList: '',
			description: 'Ermittelt die aktuelle Zykluszeit.',
		},
	},
	GETEXECUTESTEP: {
		category: 'streamsheet',
		en: {
			argumentList: '',
			description: 'Returns the current execute step count',
		},
		de: {
			argumentList: '',
			description: 'Ermittelt den aktuellen Execute Schritt im StreamSheet.',
		},
	},
	GETMACHINESTEP: {
		category: 'streamsheet',
		en: {
			argumentList: '',
			description: 'Returns the current machine step count',
		},
		de: {
			argumentList: '',
			description: 'Ermittelt den aktuellen Maschinenschritt.',
		},
	},
	GETSTEP: {
		category: 'streamsheet',
		en: {
			argumentList: '',
			description: 'Returns the current step count',
		},
		de: {
			argumentList: '',
			description: 'Ermittelt den aktuellen StreamSheet Schritt.',
		},
	},
	GOTO: {
		category: 'streamsheet',
		en: {
			argumentList: 'Cell',
			description: 'Jumps to the given cell for next cell to evaluate',
		},
		de: {
			argumentList: 'Zelle',
			description: 'Führt die Berechnung an der angegebenen Zelle fort.',
		},
	},
	HEX2BIN: {
		category: 'engineering',
		en: {
			argumentList: 'Value, [Places]',
			description: 'Converts a hexadecimal number to binary',
		},
		de: {
			argumentList: 'Zahl; [Stellen]',
			description: 'Konvertiert eine hexadezimale Zahl in eine binäre',
		},
	},
	HEX2DEC: {
		category: 'engineering',
		en: {
			argumentList: 'Value',
			description: 'Converts a hexadecimal number to decimal',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Konvertiert eine hexadezimale Zahl in eine dezimale',
		},
	},
	HEX2OCT: {
		category: 'engineering',
		en: {
			argumentList: 'Value, [Places]',
			description: 'Converts a hexadecimal number to octal',
		},
		de: {
			argumentList: 'Zahl; [Stellen]',
			description: 'Konvertiert eine hexadezimale Zahl in eine oktale',
		},
	},
	HOUR: {
		category: 'date',
		en: {
			argumentList: 'Value',
			description: 'Returns the hour of the time value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt die Stunde eines Zeitwertes zurück',
		},
	},
	'HTTP.RESPOND': {
		category: 'streamsheet',
		en: {
			argumentList: 'Consumer,DataObjectId,Body,StatusCode,Headers',
			description: 'Sends data to a Producer that send a data object previously',
		},
		de: {
			argumentList: 'Consumer,DataObjectId,Body,StatusCode,Headers',
			description: 'Sendet Daten an einen Producer mit Hilfe der DataObjectId.',
		},
	},
	IF: {
		category: 'logical',
		en: {
			argumentList: 'Condition,TrueValue,FalseValue',
			description: 'Returns depending on the condition, the True or the False value',
		},
		de: {
			argumentList: 'Bedingung,Wahrwert,Falschwert',
			description: 'Gibt abhängig von der Bedingung den Wahrwert oder Falschwert zurück',
		},
	},
	IFERROR: {
		category: 'info',
		en: {
			argumentList: 'Value,ValueOnError',
			description: 'Returns ValueOnError if given Value represents an error otherwise the Value itself',
		},
		de: {
			argumentList: 'Value,ValueOnError',
			description: 'Gibt ValueOnError zurück, falls der Value einem Fehlerwert entspricht, sonst Value',
		},
	},
	INBOX: {
		category: 'streamsheet',
		en: {
			argumentList: 'StreamSheet,Message',
			description: 'Creates a key to reference one or more messages from inbox',
		},
		de: {
			argumentList: 'StreamSheet,Nachricht',
			description: 'Erzeugt einen Schlüssel, der einen oder mehrere Nachrichten aus der Inbox referenziert',
		},
	},
	INBOXDATA: {
		category: 'streamsheet',
		en: {
			argumentList: 'StreamSheet,Source,ValuesOrRange',
			description: 'Creates a JSON key from the given values or range to retrieve data',
		},
		de: {
			argumentList: 'Ziel,WerteOderBereich',
			description: 'Erzeugt einen JSON Schlüssel mit den gegebenen Werten für den Datenbereich',
		},
	},
	INBOXMETADATA: {
		category: 'streamsheet',
		en: {
			argumentList: 'StreamSheet,Source,ValuesOrRange',
			description: 'Creates a JSON key from the given values or range to retrieve metadata',
		},
		de: {
			argumentList: 'Ziel,WerteOderBereich',
			description: 'Erzeugt einen JSON Schlüssel mit den gegebenen Werten für Metadaten',
		},
	},
	INDEX: {
		category: 'lookup',
		en: {
			argumentList: 'Range,Row,Column',
			description: 'Returns a cell within the range using the row and column offset',
		},
		de: {
			argumentList: 'Bereich,Zeile,Spalte',
			description: 'Ermittelt die Zelle aus dem Bereich mit dem Zeilen und Spaltenverweis',
		},
	},
	INT: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Rounds a number value down to its nearest integer',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Rundet eine Zahl zu ihrer nächsten Ganzen Zahl ab',
		},
	},
	ISERR: {
		category: 'info',
		en: {
			argumentList: 'Value',
			description: 'Returns TRUE if given value represents an error, except #NA',
		},
		de: {
			argumentList: 'Wert',
			description:
				'Gibt TRUE zurück, falls der angegebene Wert einem Fehlerwert entspricht, mit Ausnahme von #NA',
		},
	},
	ISERROR: {
		category: 'info',
		en: {
			argumentList: 'Value',
			description: 'Returns TRUE if given value represents an error',
		},
		de: {
			argumentList: 'Wert',
			description: 'Gibt TRUE zurück, falls der angegebene Wert einem Fehlerwert entspricht',
		},
	},
	ISEVEN: {
		category: 'info',
		en: {
			argumentList: 'Value',
			description: 'Returns TRUE if given value is an even number',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt TRUE zurück, falls die angegebene Zahl gerade ist',
		},
	},
	ISNA: {
		category: 'info',
		en: {
			argumentList: 'Value',
			description: 'Returns TRUE if given value represents a #NA error',
		},
		de: {
			argumentList: 'Wert',
			description: 'Gibt TRUE zurück, falls der angegebene Wert dem Fehlerwert #NA entspricht',
		},
	},
	ISODD: {
		category: 'info',
		en: {
			argumentList: 'Value',
			description: 'Returns TRUE if given value is an odd number',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt TRUE zurück, falls die angegebene Zahl ungerade ist',
		},
	},
	JSON: {
		category: 'streamsheet',
		en: {
			argumentList: 'Range',
			description: 'Converts given cell range to JSON',
		},
		de: {
			argumentList: 'Zellbereich',
			description: 'Konvertiert den angebenen Zellbereich in ein JSON Objekt',
		},
	},
	JSONTIME2EXCEL: {
		category: 'date',
		en: {
			argumentList: 'Text',
			description: 'Converts given date, which must be in JSON ISO 8601 format, to a serial number',
		},
		de: {
			argumentList: 'Text',
			description: 'Konvertiert das angegebene Datum von JSON ISO 8601 Format in eine serielle Zahl',
		},
	},
	'KAFKA.QUERY': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Query,Target,[Timeout]',
			description:
				'Fetches data from Kafka that matches query. REQUESTINFO can be used to check the status of the query',
		},
		de: {
			argumentList: 'Producer,Query,Ziel,[Timeout]',
			description:
				'Liest Daten aus Kafka mithilfe von Query. Status der Query kann mit REQUESTINFO abgefragt werden',
		},
		experimental: true,
	},
	'KAFKA.COMMAND': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Command,Target,[Timeout]',
			description: 'Sends a KSQL Command to Kafka. REQUESTINFO can be used to check the status of the query',
		},
		de: {
			argumentList: 'Producer,Command,Ziel,[Timeout]',
			description: 'Schickt einen KSQL Command an Kafka. Status der Query kann mit REQUESTINFO abgefragt werden',
		},
		experimental: true,
	},
	'KAFKA.PUBLISH': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Message,Topic',
			description: 'Publishes a referenced Outbox or Inbox message or a JSON via Kafka',
		},
		de: {
			argumentList: 'Producer,Message,Topic',
			description: 'Publiziert eine referenzierte Nachricht aus der Inbox oder Outbox oder ein JSON via Kafka',
		},
	},
	LEFT: {
		category: 'text',
		en: {
			argumentList: 'Text,[NumChars]',
			description: 'Return the given amount of characters starting at the beginning of the text',
		},
		de: {
			argumentList: 'Text,[Anzahl]',
			description: 'Gibt die gegebenen Anzahl von Zeichen vom Anfang des Textes zurück',
		},
	},
	LEN: {
		category: 'text',
		en: {
			argumentList: 'Text',
			description: 'Counts characters in given text',
		},
		de: {
			argumentList: 'Text',
			description: 'Zählt die Anzahl der Zeichen im Text',
		},
	},
	LINEFORMAT: {
		category: 'drawing',
		en: {
			argumentList: 'Color,Style,Width',
			description: 'Creates a line style to be used for drawing elements',
		},
		de: {
			argumentList: 'Farbe,Stil,Breite',
			description: 'Erzeugt einen Linienstil.',
		},
	},
	LOOPINDEX: {
		category: 'streamsheet',
		en: {
			argumentList: '',
			description: 'Returns the current loop index',
		},
		de: {
			argumentList: '',
			description: 'Gibt den aktuellen Loop Index zurück.',
		},
	},
	// LINES: {
	// 	category: 'drawing',
	// 	en: {
	// 		argumentList:
	// 			'DrawingName,Name,PointRange,LineFormat,FillFormat,Closed,EventFunction',
	// 		description:
	// 			'Creates a Polygon within the given drawing with absolute points given',
	// 	},
	// 	de: {
	// 		argumentList:
	// 			'Zeichnung,Name,PunkteBereich,Linienformat,Füllformat,Schließen,EventFunktion',
	// 		description:
	// 			'Erzeugt ein Polygon in der angegebenen Zeichnung mit absoluten Koordinaten',
	// 	},
	// },
	'MAIL.SEND': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Message,Subject,TO,CC,BCC,Attachments',
			description: 'Sends a mail to the given mail addresses (TO, CC, BCC)',
		},
		de: {
			argumentList: 'Producer,Nachricht,Betreff,TO,CC,BCC,Anhänge',
			description: 'Versendet eine E-Mail an die E-Mail Adressen (TO, CC, BCC)',
		},
	},
	MATCH: {
		category: 'lookup',
		en: {
			argumentList: 'Value,CellRange,[MatchType]',
			description: 'Returns relative column index of matching cell inside specified cell range',
		},
		de: {
			argumentList: 'Wert,ZellBereich,[MatchType]',
			description:
				'Liefert den relativen Spaltenindex, innerhalb des Zellbereichs, der Zelle zurück, die mit dem gegebenen Wert übereinstimmt ',
		},
	},
	MAX: {
		category: 'statistical',
		en: {
			argumentList: 'Value1,ValueN',
			description: 'Evaluates the maximum value',
		},
		de: {
			argumentList: 'Wert1,WertN',
			description: 'Berechnet den größten Wert',
		},
	},
	MID: {
		category: 'text',
		en: {
			argumentList: 'Text,Index,Count',
			description: 'Return the given amount of characters starting at the given index',
		},
		de: {
			argumentList: 'Text,Index,Anzahl',
			description: 'Gibt die gegebenene Anzahl von Zeichen ab dem angebenenen Index innerhalb Textes zurück',
		},
	},
	MIN: {
		category: 'statistical',
		en: {
			argumentList: 'Value1,Value2',
			description: 'Evaluates the minimum value',
		},
		de: {
			argumentList: 'Wert1, Wert2',
			description: 'Berechnet den kleinsten Wert',
		},
	},
	MINUTE: {
		category: 'date',
		en: {
			argumentList: 'Value',
			description: 'Returns the minute of the time value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt die Minute eines Zeitwertes zurück',
		},
	},
	MOD: {
		category: 'math',
		en: {
			argumentList: 'Number, Divisor',
			description: 'Returns the remainder of given number after it was divided by specified divisor',
		},
		de: {
			argumentList: 'Zahl;Divisor',
			description: 'Gibt den Rest einer Division zurück',
		},
	},
	'MONGO.STORE': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Collection,Message',
			description: 'Stores a JSON object in MongoDB',
		},
		de: {
			argumentList: 'Producer,Collection,Message',
			description: 'Speichert ein JSON Objekt in MongoDB',
		},
	},
	'MONGO.REPLACE': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Collection,Query,Document,Upsert',
			description: 'Replace a JSON object matching the query in MongoDB'
		},
		de: {
			argumentList: 'Producer,Collection,Query,Document,Upsert',
			description: 'Ersetzt ein JSON Objekt, dass die Query erfüllt, in MongoDB'
		}
	},
	'MONGO.DELETE': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Collection,QueryJSON,[Target],[Timeout]',
			description: 'Deletes matching objects from MongoDB',
		},
		de: {
			argumentList: 'Producer,Collection,QueryJSON,[Ziel],[Timeout]',
			description: 'Löscht gesuchte Objekte aus MongoDB',
		},
	},
	'MONGO.AGGREGATE': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Collection,AggregateJSON,[Target],[ResultKeys],[Timeout]',
			description: 'Execute the Aggregation Pipeline defined by AggregateJSON',
		},
		de: {
			argumentList: 'Producer,Collection,AggregateJSON,[Ziel],[ResultKeys],[Timeout]',
			description: 'Führt die Aggregation Pipeline in AggregateJSON aus',
		},
	},
	'MONGO.COUNT': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Collection,QueryJSON,[Target],[Timeout]',
			description: 'Count matching objects from MongoDB',
		},
		de: {
			argumentList: 'Producer,Collection,QueryJSON,[Ziel],[Timeout]',
			description: 'Zählt gesuchte Objekte aus MongoDB',
		},
	},
	'MONGO.QUERY': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Collection,QueryJSON,Target,[ResultKeys],[PageSize],[Page],[Timeout]',
			description:
				'Finds objects in MongoDB that math QueryJSON. REQUESTINFO can be used to check the status of the query',
		},
		de: {
			argumentList: 'Producer,Collection,QueryJSON,Ziel,[ResultKeys],[Seitengröße],[Seite],[Timeout]',
			description:
				'Findet Objekte in MongoDB die QueryJSON erfüllen. Status der Query kann mit REQUESTINFO abgefragt werden',
		},
		experimental: true,
	},
	MONTH: {
		category: 'date',
		en: {
			argumentList: 'Value',
			description: 'Returns the month of the time value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den Monat eines Zeitwertes zurück',
		},
	},
	MOVEVALUES: {
		category: 'streamsheet',
		en: {
			argumentList: 'SourceRange,TargetRange',
			description: 'Moves the values of the source range to the target range',
		},
		de: {
			argumentList: 'Quellbereich,Zielbereich',
			description: 'Verschiebt die Werte aus dem Quellbereich in den Zielbereich',
		},
	},
	'MQTT.PUBLISH': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,MessageOrValue,Topic,QoS,UserProperties',
			description: 'Publishes a referenced Outbox or Inbox message or a JSON via MQTT',
		},
		de: {
			argumentList: 'Producer,NachrichtOderWert,Topic,QoS,BenutzerAttribute',
			description: 'Publiziert eine referenzierte Nachricht aus der Inbox oder Outbox oder ein JSON via MQTT',
		},
	},
	MSTOSERIAL: {
		category: 'date',
		en: {
			argumentList: 'TimeValue',
			description: 'Converts the given ellapsed milliseconds to a date value',
		},
		de: {
			argumentList: 'Zeitwert',
			description: 'Wandelt die abgelaufenen Millisekunden in ein Datum um',
		},
	},
	NOT: {
		category: 'logical',
		en: {
			argumentList: 'Value1',
			description: 'Inverts the given boolean value',
		},
		de: {
			argumentList: 'Wert1',
			description: 'Kehrt den gegebenen Wahrheitswert um',
		},
	},
	NOW: {
		category: 'date',
		en: {
			argumentList: '',
			description: 'Returns the current time',
		},
		de: {
			argumentList: '',
			description: 'Gibt den aktuellen Zeitwert zurück',
		},
	},
	OCT2BIN: {
		category: 'engineering',
		en: {
			argumentList: 'Value, [Places]',
			description: 'Converts an octal number to binary',
		},
		de: {
			argumentList: 'Zahl; [Stellen]',
			description: 'Konvertiert eine oktale Zahl in eine binäre',
		},
	},
	OCT2DEC: {
		category: 'engineering',
		en: {
			argumentList: 'Value',
			description: 'Converts an octal number to decimal',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Konvertiert eine oktale Zahl in eine dezimale',
		},
	},
	OCT2HEX: {
		category: 'engineering',
		en: {
			argumentList: 'Value, [Places]',
			description: 'Converts an octal number to hexadecimal',
		},
		de: {
			argumentList: 'Zahl; [Stellen]',
			description: 'Konvertiert eine oktale Zahl in eine hexaddezimale',
		},
	},
	ODD: {
		category: 'math',
		en: {
			argumentList: 'Number',
			description: 'Returns the number rounded up to the nearest odd integer',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Rundet eine Zahl auf die nächste ungerade Ganzzahl auf',
		},
	},
	OFFSET: {
		category: 'lookup',
		en: {
			argumentList: 'Range,Rows,Cols,[Height],[Width]',
			description:
				'Returns range of cells that is a specified number of rows and columns from an initial specified range.',
		},
		de: {
			argumentList: 'Bereich,Zeilen,Spalten,[Höhe],[Breite]',
			description: 'Erzeugt einen Bereich mit dem angegebenen Versatz und der Höhe und Breite',
		},
	},
	// OLAPCUBECREATE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Name,Dimensions',
	// 		description: 'Create cube in database.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Name,Dimensionen',
	// 		description: 'Würfel in der Datenbank erzeugen.',
	// 	},
	// },
	// OLAPCUBEDELETE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Name',
	// 		description: 'Delete cube in database.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Name',
	// 		description: 'Würfel in der Datenbank löschen.',
	// 	},
	// },
	// OLAPCUBEDIMLIST: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Cube,Index',
	// 		description: 'Get id of dimension in database at index.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Würfel,Index',
	// 		description: 'Dimensions ID mit Index in der Datenbank abfragen.',
	// 	},
	// },
	// OLAPCUBELIST: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Index',
	// 		description: 'Get name of cube in database at index.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Index',
	// 		description: 'Würfelnamen mit Index in der Datenbank abfragen.',
	// 	},
	// },
	// OLAPDATA: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Cube,Elements',
	// 		description: 'Get value from cube. Elements for all dimensions must be provided.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Würfel,Elemente',
	// 		description: 'Wert aus Würfel abfragen. Es muss für jede Dimension ein Element angegeben werden.',
	// 	},
	// },
	// OLAPDATAS: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'SliceName,Element1,Element2',
	// 		description: 'Get value from defined slice.',
	// 	},
	// 	de: {
	// 		argumentList: 'SliceName,Element1,Element2',
	// 		description: 'Wert aus Schnitt abfragen.',
	// 	},
	// },
	// OLAPDBCREATE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Name',
	// 		description: 'Create database.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Name',
	// 		description: 'Datenbank erzeugen.',
	// 	},
	// },
	// OLAPDBDELETE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database',
	// 		description: 'Delete database.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank',
	// 		description: 'Datenbank löschen.',
	// 	},
	// },
	// OLAPDBLIST: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Index',
	// 		description: 'Get name of database at index.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Index',
	// 		description: 'Datenbanknamen mit Index abfragen.',
	// 	},
	// },
	// OLAPDIMCREATE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Name',
	// 		description: 'Create dimension in database.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Name',
	// 		description: 'Dimension in der Datenbank erzeugen.',
	// 	},
	// },
	// OLAPDIMDELETE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Name',
	// 		description: 'Delete dimension in database.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Name',
	// 		description: 'Dimension in der Datenbank löschen.',
	// 	},
	// },
	// OLAPDIMLIST: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Index',
	// 		description: 'Get name of dimension in database at index.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Index',
	// 		description: 'Dimensionsnamen mit Index in der Datenbank abfragen.',
	// 	},
	// },
	// OLAPDIMNAME: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,DimensionId',
	// 		description: 'Get name of dimension in database for Id.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,DimenionsId',
	// 		description: 'Dimensionsnamen mit Id in der Datenbank abfragen.',
	// 	},
	// },
	// OLAPECONSOLIDATE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Dimension,Element,Children,Weights',
	// 		description: 'Define consolidated element.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Dimenion,Element,Kinder,Gewichtungen',
	// 		description: 'Konsoliertes Elemente definieren.',
	// 	},
	// },
	// OLAPECREATE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Dimension,Name,Type,Children,Weights',
	// 		description: 'Create element in dimension.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Dimenion,Name,Type,Kinder,Gewichtungen',
	// 		description: 'Elemente erzeugen.',
	// 	},
	// },
	// OLAPEDELETE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Dimension,Name',
	// 		description: 'Delete element in dimension.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Dimenion,Name',
	// 		description: 'Elemente löschen.',
	// 	},
	// },
	// OLAPEDELETEALL: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Dimension',
	// 		description: 'Delete all elements in dimension.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Dimenion',
	// 		description: 'Alle Elemente in Dimension löschen.',
	// 	},
	// },
	// OLAPENAME: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Dimension,Index',
	// 		description: 'Get name of element in dimension using index.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Dimenion,Index',
	// 		description: 'Elementnamen am Index in der Dimension abfragen.',
	// 	},
	// },
	// OLAPLOGIN: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'User,Password',
	// 		description: 'Log into OLAP Server.',
	// 	},
	// 	de: {
	// 		argumentList: 'Benutzer,Passwort',
	// 		description: 'Im OLAP Server anmelden.',
	// 	},
	// },
	// OLAPLOGOUT: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token',
	// 		description: 'Logout from OLAP Server.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token',
	// 		description: 'Beim OLAP Server abmelden.',
	// 	},
	// },
	// OLAPSETDATA: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,Database,Cube,Value,Splash,Elements',
	// 		description: 'Set value to cube. Elements for all dimensions must be provided.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,Datenbank,Würfel,Wert,Verteilen,Elemente',
	// 		description: 'Wert in Würfel Schreiben. Es muss für jede Dimension ein Element angegeben werden.',
	// 	},
	// },
	// OLAPSERVERSAVE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token',
	// 		description: 'Persist Server.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token',
	// 		description: 'Server persistieren.',
	// 	},
	// },
	// OLAPSLICE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'Token,SliceName,Database,Cube,Elements',
	// 		description: 'Get two dimensional slice from cube. The elements for two dimensions can be ranges.',
	// 	},
	// 	de: {
	// 		argumentList: 'Token,SliceName,Datenbank,Würfel,Elemente',
	// 		description: 'Zweidimensionale Wertetabelle aus Würfel abfragen. Zwei Elemente können einen Bereich enthalten.',
	// 	},
	// },
	// OLAPSLICEDELETE: {
	// 	category: 'olap',
	// 	en: {
	// 		argumentList: 'SliceName',
	// 		description: 'Delete existing slice.',
	// 	},
	// 	de: {
	// 		argumentList: 'SliceName',
	// 		description: 'Vorhandene Wertetabelle löschen.',
	// 	},
	// },
	ONCLICK: {
		category: 'drawing',
		en: {
			argumentList: 'Function',
			description: 'Executes given function on a mouse click on top of a drawing or drawing item',
		},
		de: {
			argumentList: 'Funktion',
			description:
				'Führt die angegebene Funktion auf dem Server aus, wenn eine Zeichnung oder ein Objekt angeklickt wurde',
		},
	},
	ONDOUBLECLICK: {
		category: 'drawing',
		en: {
			argumentList: 'Function',
			description: 'Executes given function on a mouse double click on top of a drawing or drawing item',
		},
		de: {
			argumentList: 'Funktion',
			description:
				'Führt die angegebene Funktion auf dem Server aus, wenn eine Zeichnung oder ein Objekt doppelt angeklickt wurde',
		},
	},
	ONMOUSEDOWN: {
		category: 'drawing',
		en: {
			argumentList: 'Function',
			description: 'Executes given function on a mouse button down event on top of a drawing or drawing item',
		},
		de: {
			argumentList: 'Funktion',
			description:
				'Führt die angegebene Funktion auf dem Server aus, wenn auf einer Zeichnung oder einem Objekt der Mausschalter gedrückt wurde',
		},
	},
	ONMOUSEUP: {
		category: 'drawing',
		en: {
			argumentList: 'Function',
			description: 'Executes given function on a mouse button up event on top of a drawing or drawing item',
		},
		de: {
			argumentList: 'Funktion',
			description:
				'Führt die angegebene Funktion auf dem Server aus, wenn auf einer Zeichnung oder einem Objekt der Mausschalter losgelassen wurde',
		},
	},
	OR: {
		category: 'logical',
		en: {
			argumentList: 'Value1,Value2',
			description: 'Evaluates, if at least one of the given values is true',
		},
		de: {
			argumentList: 'Wert1, Wert2',
			description: 'Berechnet, ob mindestens ein Wert wahr ist',
		},
	},
	OUTBOX: {
		category: 'streamsheet',
		en: {
			argumentList: 'Message',
			description: 'Creates a key to reference one or more messages from outbox',
		},
		de: {
			argumentList: 'Nachricht',
			description: 'Erzeugt einen Schlüssel, der einen oder mehrere Nachrichten aus der Outbox referenziert',
		},
	},
	OUTBOXDATA: {
		category: 'streamsheet',
		en: {
			argumentList: 'Message,ValuesOrRange',
			description: 'Creates a JSON key from the given values or range to retrieve data',
		},
		de: {
			argumentList: 'Message,WerteOderBereich',
			description: 'Erzeugt einen JSON Schlüssel mit den gegebenen Werten für den Datenbereich',
		},
	},
	PI: {
		category: 'math',
		en: {
			argumentList: '',
			description: 'Returns the value of PI',
		},
		de: {
			argumentList: '',
			description: 'Gibt den Wert PI zurück',
		},
	},
	POWER: {
		category: 'math',
		en: {
			argumentList: 'Value,Exponent',
			description: 'Returns the value of base to the power of exponent',
		},
		de: {
			argumentList: 'Zahl,Potenz',
			description: 'Gibt den Wert der Zahl potenziert zurück',
		},
	},
	PRODUCE: {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,JSON',
			description: 'Produces data using the Producer and a JSON specific to the Producer',
		},
		de: {
			argumentList: 'Producer,JSON',
			description: 'Produziert Daten mithilfe des Producers und dem Producerspezifischen JSON',
		},
	},
	QRCODE: {
		category: 'drawing',
		en: {
			argumentList: 'Text',
			description: 'Create a QRCode key',
		},
		de: {
			argumentList: 'Text',
			description: 'Erzeugt einen QRCode Schlüssel, der für Füllmuster benutzt werden kann',
		},
	},
	RADIANS: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Converts the degrees value to radians',
		},
		de: {
			argumentList: 'Wert',
			description: 'Konvertiert den Winkel in Grad',
		},
	},
	RANDBETWEEN: {
		category: 'math',
		en: {
			argumentList: 'Min,Max',
			description: 'Creates a random value within the interval',
		},
		de: {
			argumentList: 'Min,Max',
			description: 'Erzeugt einen Zufallswert innerhalb der gegebenen Werte',
		},
	},
	RANDID: {
		category: 'text',
		en: {
			argumentList: 'Length',
			description: 'Creates a random key with the given amount of chars',
		},
		de: {
			argumentList: 'Länge',
			description: 'Erzeugt einen Schlüsselstring mit der angegebenen Anzahl Zeichen',
		},
	},
	READ: {
		category: 'streamsheet',
		en: {
			argumentList: 'Key,TargetCell,Type',
			description: 'Reads the values from a JSON object using the given key',
		},
		de: {
			argumentList: 'Schüssel,Zielzelle,Typ',
			description: 'Kopiert die Werte aus einem JSON Objekt mit dem gegebenen Schlüssel in die Zelle',
		},
	},
	REFRESH: {
		category: 'streamsheet',
		en: {
			argumentList: 'StreamSheet',
			description: 'Updates the current queue of the given streamsheet',
		},
		de: {
			argumentList: 'StreamSheet',
			description: 'Aktualisiert die aktuelle Warteschlange des StreamSheets',
		},
	},
	REPEATINDEX: {
		category: 'streamsheet',
		en: {
			argumentList: '',
			description: 'Returns the current repeat index of the EXECUTE function',
		},
		de: {
			argumentList: '',
			description: 'Gibt den aktuellen Repeat Index der EXECUTE Funktion zurück.',
		},
	},
	REPLACE: {
		category: 'text',
		en: {
			argumentList: 'Text,StartPos,NumChars,NewText',
			description: 'Replaces the amount of characters in text at specified start position with new text',
		},
		de: {
			argumentList: 'Text,StartPos,Anzahl,MitText',
			description:
				'Ersetzt die angegebene Anzahl an Zeichen im Text an angegebener Position durch einen neuen Text',
		},
	},
	REPT: {
		category: 'text',
		en: {
			argumentList: 'Text,NumTimes',
			description: 'Repeats given text specified number of times',
		},
		de: {
			argumentList: 'Text,Anzahl',
			description: 'Wiederholt den Text so oft wie durch Anzahl festgelegt',
		},
	},
	REQUEST: {
		category: 'streamsheet',
		en: {
			argumentList: 'Consumer,ParameterJSON,TargetSheet',
			description: 'Create an asynchronous calls to a REST service.',
		},
		de: {
			argumentList: 'Consumer,ParameterJSON,ZielSheet',
			description: 'Erlaubt Aufrufe in einen REST Dienst.',
		},
	},
	REQUESTINFO: {
		category: 'streamsheet',
		en: {
			argumentList: 'RequestId',
			description: 'Returns the current status of a previously executed REQUEST function.',
		},
		de: {
			argumentList: 'RequestId',
			description: 'Gibt den Status des letzten REQUEST Aufrufs zurück.',
		},
	},
	RESPOND: {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,DataObjectId,ObjectOrRange',
			description:
				'Sends JSON data from the outbox or the range to a Producer that send a data object previously',
		},
		de: {
			argumentList: 'Producer,DataObjectId,ObjektOderBereich',
			description: `Sendet JSON Daten aus der Outbox oder vom gegebenen Bereich an einen Producer mit Hilfe
				der DataObjectId`,
		},
	},
	'REST.REQUEST': {
		category: 'streamsheet',
		en: {
			argumentList: 'Producer,Path,Method,Target,ResultKeys,Body,Headers',
			description: 'Create an asynchronous calls to a REST service',
		},
		de: {
			argumentList: 'Producer,Pfad,Methode,Ziel,ResultKeys,Body,Headers',
			description: 'Erlaubt Aufrufe in einen REST Dienst',
		},
	},
	'REST.RESPOND': {
		category: 'streamsheet',
		en: {
			argumentList: 'Consumer,DataObjectId,Body,StatusCode,Headers',
			description: 'Sends data to a Producer that send a data object previously',
		},
		de: {
			argumentList: 'Consumer,DataObjectId,Body,StatusCode,Headers',
			description: 'Sendet Daten an einen Producer mit Hilfe der DataObjectId.',
		},
	},
	RETURN: {
		category: 'streamsheet',
		en: {
			argumentList: '',
			description: 'Interrupts the recalculation, if the recalculation is set to endlessly',
		},
		de: {
			argumentList: '',
			description: 'Unterbricht die Berechnung, wenn die Berechnung auf wiederholen gesetzt ist',
		},
	},
	RIGHT: {
		category: 'text',
		en: {
			argumentList: 'Text,Count',
			description: 'Return the given amount of characters from the end of the text',
		},
		de: {
			argumentList: 'Text,Anzahl',
			description: 'Gibt die gegebenen Anzahl von Zeichen vom Ende des Textes zurück',
		},
	},
	ROUND: {
		category: 'math',
		en: {
			argumentList: 'Value,Decimals',
			description: 'Rounds the value to the given decimals',
		},
		de: {
			argumentList: 'Wert,Nachkommastellen',
			description: 'Rundet den Wert auf die gegebene Anzahl an Nachkommastellen',
		},
	},
	ROW: {
		category: 'lookup',
		en: {
			argumentList: '[Reference]',
			description: 'Returns the row number of given cell reference',
		},
		de: {
			argumentList: '[Referenz]',
			description: 'Ermittelt die Zeilennummer der angegebenen Zellreferenz',
		},
	},
	SEARCH: {
		category: 'text',
		en: {
			argumentList: 'TextToSearch,Text,Index',
			description: 'Return the index of the search text within the text. The search starts at index',
		},
		de: {
			argumentList: 'Suchtext,Text, Index',
			description: 'Gibt den Index des ersten Auftretens des Suchtextes im Text aus, beginnend beim Index',
		},
	},
	SECOND: {
		category: 'date',
		en: {
			argumentList: 'Value',
			description: 'Returns the seconds of the time value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt die Sekunden eines Zeitwertes zurück',
		},
	},
	SELECT: {
		category: 'streamsheet',
		en: {
			argumentList: 'ListRange,CurrentValue',
			description: 'Display a pick list.',
		},
		de: {
			argumentList: 'Listenbereich,AktuellerWert',
			description: 'Zeigt eine Auswahlliste an.',
		},
	},
	SERIALTOMS: {
		category: 'date',
		en: {
			argumentList: 'Date',
			description: 'Converts the given date to the ellapsed milliseconds',
		},
		de: {
			argumentList: '',
			description: 'Wandelt das Datum in abgelaufenen Millisekunden um',
		},
	},
	SETCYCLETIME: {
		category: 'streamsheet',
		en: {
			argumentList: 'Milliseconds',
			description: 'Define the cycle time',
		},
		de: {
			argumentList: 'Millisekunden',
			description: 'Setzt den Berechnungsinterval.',
		},
	},
	SETPHASE: {
		category: 'streamsheet',
		en: {
			argumentList: 'Condition,Text,PhaseCell',
			description: 'If Condition is true, the Text will be written into PhaseCell',
		},
		de: {
			argumentList: 'Bedingung,PhasenID,PhasenZelle',
			description: 'Wenn die Bedingung TRUE ist, wird der Text in die Phasenzelle geschrieben',
		},
	},
	SETVALUE: {
		category: 'streamsheet',
		en: {
			argumentList: '[Condition],Value,Cell,[OverwriteFormula]',
			description: 'If Condition is TRUE, the Value will be written into Cell',
		},
		de: {
			argumentList: '[Bedingung],Wert,Zelle,[ErsetzeZellFormel]',
			description: 'Wenn die Bedingung TRUE ist, wird der Wert in die Zelle geschrieben',
		},
	},
	SIGN: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Returns the sign of given number',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Liefert das Vorzeichen der angebenenen Zahl zurück',
		},
	},
	SIN: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Returns the sine value of the value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den Sinus der Zahl zurück',
		},
	},
	SPLIT: {
		category: 'text',
		en: {
			argumentList: 'Text,Separator,Index',
			description: 'Splits given text by using specified separator and returns the part at given index',
		},
		de: {
			argumentList: 'Text,Separator,Index',
			description:
				'Unterteilt den Text anhand des Separators und liefert das durch Index spezifizierte Teilstück zurück',
		},
	},
	SQRT: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Returns square root of the value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt die Wurzel des Wertes zurück',
		},
	},
	STACKADD: {
		category: 'stack',
		en: {
			argumentList: 'StackRange,SourceRange,Position,TargetRange',
			description:
				'This function adds a row to the stack at the defined Position and copies the removed cells to the target range',
		},
		de: {
			argumentList: 'Stackbereich,Quellbereich,Position,Zielbereich',
			description:
				'Diese Funktion füget dem Stack eine Zeile an der angegebenen Position zu und kopiert die gelöschte Zeile in den Zielbereich',
		},
	},
	STACKDROP: {
		category: 'stack',
		en: {
			argumentList: 'StackRange,Direction,TargetRange',
			description: 'This function removes one row from the Stack. All rows below move one row up.',
		},
		de: {
			argumentList: 'Stackbereich,Richtung,Zielbereich',
			description:
				'Diese Funktion enfernt eine Zeile aus dem Stack. Die anderen Zeilen werden entsprechend der Richtung bewegt.',
		},
	},
	STACKFIND: {
		category: 'stack',
		en: {
			argumentList: 'StackRange,CriteriaRange,TargetRange,Drop',
			description:
				'This function uses the criteria range to select and copy one or multiple rows from the StackRange to the TargetRange.',
		},
		de: {
			argumentList: 'StackBereich,Suchkriterien,Zielbereich,Löschen',
			description:
				'Diese Funktion nutzt die Suchkriterien, um  einen Bereich von dem Stackbereich in der Zielbereich zu kopieren.',
		},
	},
	STACKROTATE: {
		category: 'stack',
		en: {
			argumentList: 'StackRange,Count,TargetRange',
			description: 'This function rotates the complete stack by Count positions up or down.',
		},
		de: {
			argumentList: 'Stackbereich,Anzahl,Zielbereich',
			description: 'Diese Funktion rotiert den Stack um die Anzahl der angegebnen Zeilen hoch oder runter.',
		},
	},
	STACKSORT: {
		category: 'stack',
		en: {
			argumentList: 'StackRange,SortSettingsRange',
			description: 'This function sorts the Stack according to the Settings in the SortSettingsRange.',
		},
		de: {
			argumentList: 'StackBereich,Sortierbereich',
			description: 'Diese Funktion sortiert den Stack nach den Sortierkriterien',
		},
	},
	SUBSTITUTE: {
		category: 'text',
		en: {
			argumentList: 'Text,OldText,NewText,[Occurrence]',
			description: 'Substitute specified text in given old text with new text',
		},
		de: {
			argumentList: 'Text,OriginalerText,NeuerText,[Vorkommen]',
			description: 'Ersetzt angegebenen Text im originalen Text durch einen neuen Text',
		},
	},
	SUBTREE: {
		category: 'streamsheet',
		en: {
			argumentList: 'TopElement,[IncludeElementKey]',
			description: 'Extracts a sub tree from the current message',
		},
		de: {
			argumentList: 'ÜbergeordnetesElement,[InklusiveElementKey]',
			description: 'Extrahiert einen Teilbaum aus der aktuellen Nachricht',
		},
	},
	SUM: {
		category: 'math',
		en: {
			argumentList: 'Range',
			description: 'Sums up all values in given range',
		},
		de: {
			argumentList: 'Bereich',
			description: 'Summiert die Zahlen im angegebenen Bereich auf',
		},
	},
	SWAPVALUES: {
		category: 'streamsheet',
		en: {
			argumentList: 'SourceRange,TargetRange',
			description: 'Swaps the values in the source range with the values in the target range',
		},
		de: {
			argumentList: 'Quellbereich,Zielbereich',
			description: 'Tauscht die Werte aus dem Quellbereich mit denen im Zielbereich',
		},
	},
	SWITCH: {
		category: 'logical',
		en: {
			argumentList: 'Value,KeyValue-Pairs,[DefaultValue]',
			description: 'Evaluates a value against a list of key-value pairs and returns value of first matched key',
		},
		de: {
			argumentList: 'Wert,SchlüsselWert-Paare,[DefaultWert]',
			description:
				'Evaluiert den Wert gegen eine Liste von Schlüssel-Wert-Paare und liefert den Wert zum ersten passenden Schlüssel zurück',
		},
	},
	TAN: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Returns the tangent value of the value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den Tangens der Zahl zurück',
		},
	},
	TEXT: {
		category: 'text',
		en: {
			argumentList: 'Number,FormatString',
			description: 'Formats given number and converts it to text',
		},
		de: {
			argumentList: 'Zahl,FormatString',
			description: 'Formatiert und wandelt die angegebene Zahl in einen Text um',
		},
	},
	TIME: {
		category: 'date',
		en: {
			argumentList: 'Hours,Minutes,Seconds',
			description:
				'Calculates the serial number which corresponds to a time specified by given hours, minutes and seconds',
		},
		de: {
			argumentList: 'Stunden,Minuten,Sekunden',
			description:
				'Berechnet die serielle Zahl, die der Zeit entspricht, die durch Stunden, Minuten und Sekunden festgelegt ist',
		},
	},
	TIMEAGGREGATE: {
		category: 'streamsheet',
		en: {
			argumentList: 'Data,Backperiod,Method,BaseTime,Interval,TargetRange',
			description: 'Aggregates values with the BackPeriod using the given method within the interval',
		},
		de: {
			argumentList: 'Wert,Gesamtperiode,Methode,BasisZeit,Intervall,Zielbereich',
			description:
				'Aggregiert Werte in der Gesamtperiode mit der angebenen Methode für den angegebenen Intervall',
		},
	},
	TIMEVALUE: {
		category: 'date',
		en: {
			argumentList: 'Text',
			description: 'Converts time given as text to a corresponding serial number',
		},
		de: {
			argumentList: 'Text',
			description: 'Konvertiert die als Text gegebene Zeit in eine serielle Zahl',
		},
	},
	TRUNC: {
		category: 'math',
		en: {
			argumentList: 'Value',
			description: 'Truncates a number to an integer',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Schneidet die Nachkommastellen der angegebenen Zahl ab',
		},
	},
	UNICHAR: {
		category: 'text',
		en: {
			argumentList: 'Number',
			description: 'Returns the character represented by given unicode number',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Liefert das Zeichen, das der angegebenen unicode-Zahl entspricht, zurück',
		},
	},
	UNICODE: {
		category: 'text',
		en: {
			argumentList: 'Text',
			description: 'Returns the numeric unicode for the first character of given text',
		},
		de: {
			argumentList: 'Text',
			description: 'Gibt die unicode-Zahl, die dem 1. Zeichen des übergebenen Textes entspricht, zurück',
		},
	},
	VALUE: {
		category: 'text',
		en: {
			argumentList: 'Text,[Locale]',
			description: 'Converts given text to number using optional locale code',
		},
		de: {
			argumentList: 'Text,[Locale]',
			description: 'Konvertiert den Text in eine Zahl unter Berücksichtigung des optionalen Länder-Codes',
		},
	},
	VLOOKUP: {
		category: 'lookup',
		en: {
			argumentList: 'Value,Range,Index,[ExactMatch]',
			description: 'Looks in the first column of an array and moves across the row to return the value of a cell',
		},
		de: {
			argumentList: 'Wert,Bereich,Index,[ExakteÜbereinstimmung]',
			description:
				'Ermittelt die Zelle mit einem Index in einem Bereich, die dem Wert in der ersten Spalte entspricht',
		},
	},
	// WEBPAGE: {
	// 	category: 'streamsheet',
	// 	en: {
	// 		argumentList: 'URL, HTMLJSON, Refresh',
	// 		description: 'Create a webpage at the given URL',
	// 	},
	// 	de: {
	// 		argumentList: 'URL, HTMLJSON, Erneuern',
	// 		description: 'Erzeuge eine Webseite an der angegebenen URL',
	// 	},
	// },
	WEEKDAY: {
		category: 'date',
		en: {
			argumentList: 'Value',
			description: 'Returns the week day of the time value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt den Wochentag eines Zeitwertes zurück',
		},
	},
	WRITE: {
		category: 'streamsheet',
		en: {
			argumentList: 'Key,Value,Type',
			description: 'Adds the key and value to a JSON object',
		},
		de: {
			argumentList: 'Schüssel,Value,Typ',
			description: 'Fügt den Schlüssel und den Wert einem JSON Objekt zu',
		},
	},
	YEAR: {
		category: 'date',
		en: {
			argumentList: 'Value',
			description: 'Returns the year of the time value',
		},
		de: {
			argumentList: 'Zahl',
			description: 'Gibt das Jahr eines Zeitwertes zurück',
		},
	},
};

export default class FunctionStrings {
	enumerateFunctions(category, callback) {
		const items = Object.keys(Strings);
		const { locale } = 'de'; // TODO store.getState().locales; // appStrings.getLanguage();

		items.forEach((item) => {
			const data = Strings[item];
			if (category === 'all' || data.category === category) {
				callback.call(
					this,
					item,
					data.category,
					data[locale].argumentList,
					data[locale].description,
					data.experimental,
				);
			}
		});
	}

	enumerateCategories(callback) {
		const items = Object.keys(Categories);
		const { locale } = 'de'; // TODO store.getState().locales; // appStrings.getLanguage();

		items.sort((a, b) => {
			const dataA = Categories[a];
			const dataB = Categories[b];
			const textA = dataA[locale].toUpperCase();
			const textB = dataB[locale].toUpperCase();
			if (textA < textB) {
				return -1;
			}
			return textA > textB ? 1 : 0;
		});

		items.forEach((item) => {
			const data = Categories[item];
			callback.call(this, item, data[locale]);
		});
	}

	getStrings() {
		return Strings;
	}
}

export const functionStrings = new FunctionStrings();

CellEditor.setFunctionInfo(functionStrings);
