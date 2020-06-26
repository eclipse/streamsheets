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
/* eslint-disable import/prefer-default-export */
import core from '../core';
import SheetPlotView from './SheetPlotView';

const { SheetPlotNode } = core;

let JSG = {};

export const createView = (model) => {
	if (model instanceof SheetPlotNode) {
		return new SheetPlotView(JSG, model);
	}
	return undefined;
};

export { SheetPlotView };

export const init = (jsgMod) => {
	JSG = jsgMod;
};
