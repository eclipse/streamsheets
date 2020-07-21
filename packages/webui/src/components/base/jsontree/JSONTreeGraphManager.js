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
import JSG from '@cedalo/jsg-ui';
import { defaultTreeDataHandler } from './DefaultTreeDataHandler';

const {
	GraphEditor,
	GraphSettings,
	EditTextActivator,
	MarqueeActivator,
	PanActivator,
	PinchActivator,
	TooltipActivator,
	TreeActivator,
	ViewActivator,
} = JSG;

export default class JSONTreeGraphManager {
	constructor(home = '/lib') {
		this._home = home;
	}

	static initFw(path, disabled = false) {
		JSG.init('/lib');
		JSG.setDrawingDisabled(disabled);
	}

	updateEditorOptions(editorOptions = {}) {
		if(this.jsonEditor) {
			this.editorOptions = editorOptions;
			this.jsonEditor.getTreeItemsNode().
				setOnlyKeys(!!this.editorOptions.onlyKeys);
			this.jsonEditor.getTreeItemsNode().
				setCheckboxes(!!this.editorOptions.checkboxes);
			this.jsonEditor.getTreeItemsNode().
				setDisableElementChanges(!!this.editorOptions.disableElementChanges);
		}
	}

	createEditor(canvas, json, editorOptions = {}, dataHandler) {
		this.canvas = canvas;

		JSONTreeGraphManager.initFw(this._home);
		this._graphEditor = new GraphEditor(this.canvas);

		const graph = new JSG.Graph();
		this._graphEditor.setGraph(graph);
		const settings = graph.getSettings();
		settings.setPortHighlightsVisible(false);
		settings.setGridVisible(false);
		settings.setScaleVisible(false);
		settings.setDisplayMode(0); // ENDLESS
		settings.setPanningEnabled(false);
		settings.setPortHighlightsVisible(false);

		// config graph as needed for machine app
		const viewer = this._graphEditor.getGraphViewer();

		// remove later, just for testing purpose...
		// graph.init();

		this._graphEditor.setDisplayMode(GraphSettings.DisplayMode.ENDLESS);
		this._graphEditor.setScrollPosition(0, 0);
		viewer.getScrollPanel().getViewPanel().setBoundsMargin(0);
		viewer.getScrollPanel().
			setScrollBarsMode(JSG.ScrollBarMode.HIDDEN);
		this._graphEditor.setZoom(1);

		const defInteraction = this._graphEditor.getGraphViewer().
			getDefaultInteraction();

		defInteraction.removeAllActivators();
		defInteraction.addActivator(
			ViewActivator.KEY,
			new ViewActivator(),
		);
		defInteraction.addActivator(
			EditTextActivator.KEY,
			new EditTextActivator(),
		);
		defInteraction.addActivator(
			MarqueeActivator.KEY,
			new MarqueeActivator(),
		);
		defInteraction.addActivator(
			PinchActivator.KEY,
			new PinchActivator(),
		);
		defInteraction.addActivator(
			PanActivator.KEY,
			new PanActivator(),
		);
		defInteraction.addActivator(
			TooltipActivator.KEY,
			new TooltipActivator(),
		);
		defInteraction.addActivator(TreeActivator.KEY, new TreeActivator());

		this.jsonEditor = new JSG.TreeNode();
		graph.addItem(this.jsonEditor);
		this.jsonEditor.setSize(8000, 10000);
		this.jsonEditor.setOrigin(0, 0);
		this.jsonEditor.getTreeItemsNode().setCustomDataHandler(
			'_custom',
			dataHandler || defaultTreeDataHandler,
		);
		this.updateEditorOptions(editorOptions);
		this.jsonEditor.getFormat().setLineColor('#FFFFFF');
		return this._graphEditor;
	}

	get ready() {
		return this.jsonEditor && !!this.jsonEditor.getTreeItemsNode();
	}

	update(json) {
		try {
			this.jsonEditor.getTreeItemsNode().setTree(json);
		} catch (e) {
			// console.warn(e);
		}
		this.redraw();
	}

	getJson() {
		return this.jsonEditor.getTreeItemsNode().getJson();
	}

	getJsonTree() {
		return this.jsonEditor.getTreeItemsNode().getJsonTree();
	}

	getChildren(parent) {
		const tree = this.jsonEditor.getTreeItemsNode();
		const children = [];
		tree.enumerateChildren(parent, (item/* , i */) => {
			children.push(item);
		});
		return children;
	}

	redraw() {
		try {
			if (this.getGraph()) {
				JSG.setDrawingDisabled(false);
				this._graphEditor.invalidate();
			}
		} catch (e) {
			// console.warn(e);
		}
	}

	updateDimensions() {
		const ctx = this.canvas.getContext('2d');
		const devicePixelRatio = window.devicePixelRatio || 1;
		const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
			ctx.mozBackingStorePixelRatio ||
			ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio ||
			ctx.backingStorePixelRatio || 1;
		const ratio = devicePixelRatio / backingStoreRatio;

		this._graphEditor.getCoordinateSystem().setDeviceRatio(ratio);
		JSG.graphics.getCoordinateSystem().setDeviceRatio(ratio);
		const oldWidth = this.canvas.clientWidth;
		const oldHeight = this.canvas.clientHeight;
		this.canvas.width = oldWidth * ratio;
		this.canvas.height = oldHeight * ratio;

		const cs = this._graphEditor.getCoordinateSystem();
		const width = cs.deviceToLogX(this.canvas.width) / cs.getDeviceRatio();
		const height = cs.deviceToLogY(this.canvas.height) /
			cs.getDeviceRatio();

		this.jsonEditor.setSize(width, height);
		this.jsonEditor.setOrigin(0, 0);

		this._graphEditor.resizeContent(this.canvas.width, this.canvas.height);
		this.redraw();
	}

	getGraph() {
		return this._graphEditor ? this._graphEditor.getGraph() : undefined;
	}
}
