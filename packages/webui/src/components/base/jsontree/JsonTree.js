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
/* eslint-disable react/no-unused-state,react/prop-types */
import React from 'react';
import JSG from '@cedalo/jsg-ui';
import PropTypes from 'prop-types';
import GraphManager  from './JSONTreeGraphManager';
import DefaultTreeDataHandler from './DefaultTreeDataHandler';

const EDITOR_CONFIG_DEF = {
	canvasZoomLevel: 1,
};

const JSON_DEF = [
	{
		title: 'ROOT',
		children: [
			{
				title: 'New',
			},
		],
	},
];

const STYLE_DEF = {
	width: '300px',
	height: '800px',
	marginTop: '80px',
};
export default class JsonTree extends React.Component {
	static propTypes = {
		id: PropTypes.string.isRequired,
		dataHandler: PropTypes.func,
		onTreeItemSelected: PropTypes.func,
		onTreeChanged: PropTypes.func,
		onValidate: PropTypes.func,
		// eslint-disable-next-line react/forbid-prop-types
		editorOptions: PropTypes.object
	};

	static defaultProps = {
		dataHandler: DefaultTreeDataHandler,
		onTreeItemSelected: () => {},
		onTreeChanged: () => {},
		onValidate: () => {},
		editorOptions: {}
	};

	static getDerivedStateFromProps(props, state) {
		const {graphManager} = state;
		if (
			props.json &&
			JSON.stringify(props.json) !== JSON.stringify(state.json)
		) {
			graphManager.update(props.json);
			return { json: props.json };
		}
		if(!!graphManager.editorOptions && JSON.stringify(props.editorOptions)!==JSON.stringify(graphManager.editorOptions)) {
			graphManager.updateEditorOptions(props.editorOptions);
		}
		graphManager.update(props.json);

		return null;
	}

	constructor(props) {
		super(props);
		this.state = {
			graphManager: props.graphManager || new GraphManager('/lib'),
			graphEditor: null,
			graph: null,
			style: this.props.style || STYLE_DEF,
			config: EDITOR_CONFIG_DEF,
			json: this.props.json || JSON_DEF,
		};
		const DataHandler = this.props.dataHandler;
		this.dataHandler = new DataHandler({
			listener: this.props.listener || this,
			id: this.props.id
		});
	}


	componentDidMount() {
		const graphEditor = this.initGraphEditor();
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.NotificationCenter.ZOOM_NOTIFICATION,
			'onZoom',
		);
		const nc = JSG.NotificationCenter.getInstance();
		nc.register(
			this,
			JSG.TreeItemsNode.SELECTION_CHANGED_NOTIFICATION,
			'onTreeSelectionChanged',
		);

		/* eslint-disable react/no-did-mount-set-state */
		this.setState({ graphEditor });
		/* eslint-enable react/no-did-mount-set-state */
	}

	componentWillUnmount() {
		const { canvas } = this;
		JSG.NotificationCenter.getInstance().unregister(
			this,
			JSG.TreeItemsNode.SELECTION_CHANGED_NOTIFICATION,
		);
		canvas._jsgEditor.destroy();
		delete canvas._jsgEditor;
		window.removeEventListener('resize', this.updateDimensions);
	}

	onTreeSelectionChanged = (/* notification */) => {
		// const treeItems = notification.object;
		// treeItems.setName(this.props.id);
		// const item = treeItems.getSelectedItem();
		// this.props.onTreeItemSelected(item, treeItems, notification, this.canvas);
	};

	onSelect(id, item) {
		this.props.onTreeItemSelected(id, item);
	}

	onValidate(id, item) {
		return this.props.onValidate(id, item);
	}

	onTreeChanged(eventType, id, treeitem, ...args) {
		const {graphManager} = this.state;
		if (typeof this.props.onTreeChanged === 'function') {
			const UPDATES_EVENTS = ['onDelete', 'onUpdate', 'onAdd', 'OnPaste', 'OnInit', 'onCheck'];
			if (UPDATES_EVENTS.includes(eventType)) {
				const json = graphManager.getJson();
				args.push(json);
				this.props.onTreeChanged(eventType, id, treeitem, ...args);
			}
		}
	}

	onZoom() {
		const { canvas } = this;
		if (canvas) {
			const { width, height } = canvas;
			const graphEditor = canvas._jsgEditor;
			const cs = graphEditor.getCoordinateSystem();
			// force layout
			const viewer = graphEditor.getGraphViewer();
			viewer.layout(cs.deviceToLogX(width), cs.deviceToLogY(height));
			graphEditor.setScrollPosition(0, 0);
			graphEditor.resizeContent(width, height);
		}
	}


	initGraphEditor() {
		const { json, graphManager } = this.state;
		const { canvas } = this;
		const { editorOptions } = this.props;
		if (canvas) {
			const graphEditor = graphManager.createEditor(
				canvas,
				json,
				editorOptions,
				this.dataHandler,
			);
			const graph = graphEditor.getGraph();
			graphEditor.setZoom(this.state.config.canvasZoomLevel);
			window.addEventListener('resize', () => this.updateDimensions());
			this.updateDimensions();
			graphEditor.invalidate();
			this.setState({ graphEditor, graph });
			return graphEditor;
		}
		return null;
	}

	updateDimensions() {
		const {graphManager} = this.state;
		if (this.canvas) {
			graphManager.updateDimensions();
		}
	}

	render() {
		return (
			<div style={this.state.style}>
				<canvas
					id={this.props.id}
					style={{
						width: '100%',
						height: '100%',
						outline: 'none',
						display: 'inherit',
						overflow: 'scroll',
					}}
					ref={(c) => {
						this.canvas = c;
					}}
					width="800"
					height="800"
					tabIndex="0"
				/>
			</div>
		);
	}
}
