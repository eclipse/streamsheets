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
const bar = require('./bar');
const help = require('./help');
const { Functions } = require('@cedalo/parser');

const {
	ATTRIBUTES,
	CLASSIFYPOINT,
	EVENTS,
	FILLLINEARGRADIENT,
	FILLPATTERN,
	FILLVIDEO,
	FILLRADIALGRADIENT,
	FONTFORMAT,
	LINEFORMAT,
	SERIES,
	SERIESTIME,
	CELLCHART,
	AXIS,
	SHOWDIALOG,
	LOCALNOW,
	VALUERANGE,
	ONCLICK,
	ONDOUBLECLICK,
	ONMOUSEDOWN,
	ONMOUSEUP,
	ONVALUECHANGE,
	QRCODE
} = Functions;

module.exports = {
	help,
	functions: {
		ATTRIBUTES,
		BAR: bar,
		CLASSIFYPOINT,
		'OPEN.URL': Functions['OPEN.URL'],
		'DRAW.BUTTON': Functions['DRAW.BUTTON'],
		'DRAW.CHECKBOX': Functions['DRAW.CHECKBOX'],
		'DRAW.ELLIPSE': Functions['DRAW.ELLIPSE'],
		'DRAW.LABEL': Functions['DRAW.LABEL'],
		'DRAW.LINE': Functions['DRAW.LINE'],
		'DRAW.KNOB': Functions['DRAW.KNOB'],
		'DRAW.PLOT': Functions['DRAW.PLOT'],
		'DRAW.STREAMCHART': Functions['DRAW.STREAMCHART'],
		'DRAW.POLYGON': Functions['DRAW.POLYGON'],
		'DRAW.BEZIER': Functions['DRAW.BEZIER'],
		'DRAW.RECTANGLE': Functions['DRAW.RECTANGLE'],
		'DRAW.SLIDER': Functions['DRAW.SLIDER'],
		EVENTS,
		FILLLINEARGRADIENT,
		FILLPATTERN,
		FILLVIDEO,
		FILLRADIALGRADIENT,
		FONTFORMAT,
		LINEFORMAT,
		SERIES,
		SERIESTIME,
		CELLCHART,
		AXIS,
		VALUERANGE,
		SHOWDIALOG,
		LOCALNOW,
		ONCLICK,
		ONDOUBLECLICK,
		ONMOUSEDOWN,
		ONMOUSEUP,
		ONVALUECHANGE,
		QRCODE
	}
};
