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
