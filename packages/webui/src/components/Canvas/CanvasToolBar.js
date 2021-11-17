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
/* eslint-disable react/prop-types */
/* eslint-disable no-bitwise */

import JSG from '@cedalo/jsg-ui';
import { NumberFormatter } from '@cedalo/number-format';
import { ToolbarExtensions, ChartExtensions } from '@cedalo/webui-extensions';
import {
	Button, Divider, GridList, GridListTile, IconButton, Input, MenuItem, MenuList,
} from '@material-ui/core';
import Popover from '@material-ui/core/Popover';
import Select from '@material-ui/core/Select';
import SvgIcon from '@material-ui/core/SvgIcon';
import AppBar from '@material-ui/core/AppBar';
import Tooltip from '@material-ui/core/Tooltip';
import BorderAllIcon from '@material-ui/icons/BorderAll';
import BorderBottomIcon from '@material-ui/icons/BorderBottom';
import BorderClearIcon from '@material-ui/icons/BorderClear';
import BorderHorizontalIcon from '@material-ui/icons/BorderHorizontal';
import BorderInnerIcon from '@material-ui/icons/BorderInner';
import BorderLeftIcon from '@material-ui/icons/BorderLeft';
import BorderOuterIcon from '@material-ui/icons/BorderOuter';
import BorderRightIcon from '@material-ui/icons/BorderRight';
import BorderTopIcon from '@material-ui/icons/BorderTop';
import BorderVerticalIcon from '@material-ui/icons/BorderVertical';
import ToolRectangleIcon from '@material-ui/icons/Crop32';
import FormatAlignCenter from '@material-ui/icons/FormatAlignCenter';
import FormatAlignJustify from '@material-ui/icons/FormatAlignJustify';
import FormatAlignLeft from '@material-ui/icons/FormatAlignLeft';
import FormatAlignRight from '@material-ui/icons/FormatAlignRight';
import BoldIcon from '@material-ui/icons/FormatBold';
import ItalicIcon from '@material-ui/icons/FormatItalic';
import MessageIcon from '@material-ui/icons/VerticalSplit';
import ToolEllipseIcon from '@material-ui/icons/PanoramaFishEye';
import RedoIcon from '@material-ui/icons/Redo';
import ToolStar from '@material-ui/icons/StarBorder';
import ToolPolylineIcon from '@material-ui/icons/Timeline';
import ToolArrowIcon from '@material-ui/icons/TrendingFlat';
import UndoIcon from '@material-ui/icons/Undo';
import VerticalAlignBottom from '@material-ui/icons/VerticalAlignBottom';
import VerticalAlignCenter from '@material-ui/icons/VerticalAlignCenter';
import VerticalAlignTop from '@material-ui/icons/VerticalAlignTop';
import ZoomIcon from '@material-ui/icons/ZoomIn';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import React, { Component, useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import { accessManager } from '../../helper/AccessManager';
import { intl } from '../../helper/IntlGlobalProvider';
import CommandStack from '../../helper/synchronization/CommandStack';
import { numberFormatTemplates } from '../../languages/NumberFormatTemplates';
import CustomTooltip from '../base/customTooltip/CustomTooltip';
import { withStyles } from '@material-ui/core/styles';
import ListItemText from '@material-ui/core/ListItemText';

const ToolTextIcon = FormatAlignCenter;
const {
	Point,
	Size,
	Strings,
	Dictionary,
	AttributeUtils,
	SetAttributeAtPathCommand,
	BooleanAttribute,
	ItemAttributes,
	CompoundCommand,
	SetSizeCommand,
	MoveItemCommand,
	FormatAttributes,
	TextFormatAttributes,
	SelectionProvider,
	MatrixLayout,
	SheetPlotNode,
	SheetCommandFactory
} = JSG;
const { RESOURCE_TYPES, RESOURCE_ACTIONS } = accessManager;

const marks = {
	50: '50%', 100: '100%', 150: '150%', 200: '200%'
};

const buttonStyle = {
	height: '34px', width: '34px', padding: '4px 0px 0px 0px'
};

const borderStyle = { borderRadius: '0%', padding: '0px 5px', width: '100px', height: '20px' };

const styles = {
	default: {
		background: 'inherit'
	}, select: {
		'&:before': {
			// normal
			border: 'none !important'
		}, '&:after': {
			// focused
			border: 'none'
		}, '&:hover:not(.Mui-disabled):not(.Mui-focused):not(.Mui-error):before': {
			// hover
			border: 'none'
		}
	}
};

const WidthHelper = (props) => {
	const [currentWidth, setCurrentWidth] = useState(window.outerWidth);
	useEffect(() => {
		const handleResize = () => {
			setCurrentWidth(window.outerWidth);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);
	return props.width < currentWidth ? props.children : null;
};

const numberFormats = [{ id: 'NumberFormat.General', type: 'general', nf: 'General', local: 'general', value: 1234.56 },
	{ id: '-1' },
	{ id: 'NumberFormat.NumberRounded', type: 'number', nf: '#,##0', local: 'number;0;true', value: 1234.56 },
	{ id: 'NumberFormat.Number', type: 'number', nf: '#,##0.00', local: 'number;2;true', value: 1234.56 },
	{ id: 'NumberFormat.Percent', type: 'percent', nf: '0.00%', local: 'percent;2;false', value: 0.123 },
	{ id: 'NumberFormat.Currency', type: 'currency', nf: '#,##0.00 €', local: 'currency;2;true', value: 1234.56 },
	{ id: 'NumberFormat.Scientific', type: 'science', nf: '0.00E+00', local: 'science;2', value: 1234.56 },
	{ id: '-2' }, { id: 'NumberFormat.Date', type: 'date', nf: 'd\\.m\\.yy', local: 'date;de', value: 43500 },
	{ id: 'NumberFormat.Time', type: 'time', nf: 'h:mm:ss', local: 'time;de', value: 0.5 },
	{ id: 'NumberFormat.DateTime', type: 'date', nf: 'd\\.m\\.yyyy h:mm', local: 'date;de', value: 43500.5 },
	{ id: '-3' }, { id: 'NumberFormat.Text', type: 'text', nf: '@', local: 'text', value: 1234.56 }];

// eslint-disable-next-line react/prefer-stateless-function
export class CanvasToolBar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			cellTextFormat: undefined,
			cellFormat: undefined,
			cellAttributes: undefined,
			showHAlign: false,
			showVAlign: false,
			showFillColor: false,
			showFontColor: false,
			showBorderColor: false,
			showBorderStyle: false,
			showNumberFormat: false,
			showDependencies: false,
			anchorEl: undefined,
			zoomOpen: false,
			toolsOpen: false,
			chartsOpen: false,
			borderOpen: false,
			graphSelected: false,
			treeSelected: false
		};
	}

	componentDidMount() {
		JSG.NotificationCenter.getInstance()
			.register(this, CommandStack.STACK_CHANGED_NOTIFICATION, 'onCommandStackChanged');
		JSG.NotificationCenter.getInstance()
			.register(this, JSG.WorksheetNode.SELECTION_CHANGED_NOTIFICATION, 'onSheetSelectionChanged');
		JSG.NotificationCenter.getInstance()
			.register(this, SelectionProvider.SELECTION_CHANGED_NOTIFICATION, 'onGraphSelectionChanged');
		JSG.NotificationCenter.getInstance()
			.register(this, JSG.TreeItemsNode.SELECTION_CHANGED_NOTIFICATION, 'onTreeSelectionChanged');

	}

	componentWillUnmount() {
		JSG.NotificationCenter.getInstance().unregister(this, CommandStack.STACK_CHANGED_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.WorksheetNode.SELECTION_CHANGED_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, SelectionProvider.SELECTION_CHANGED_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.TreeItemsNode.SELECTION_CHANGED_NOTIFICATION);
	}

	onTreeSelectionChanged() {
		const graphView = graphManager.getGraphViewer().getGraphView();
		const focus = graphView.getFocus();
		const treeSelected = focus && (focus.getView() instanceof JSG.TreeItemsView)

		if (this.state.treeSelected !== treeSelected) {
			this.setState({ treeSelected });
		}
	}

	onSheetSelectionChanged(notification) {
		const { item } = notification.object;
		const { updateFinal } = notification.object;

		if (!item || !updateFinal) {
			return;
		}
		const activeCell = item.getOwnSelection().getActiveCell();
		if (!(item instanceof JSG.StreamSheet) || activeCell === undefined) {
			return;
		}

		this.props.setJsgState({ cellSelected: true });
		this.updateState({ graphSelected: false, treeSelected: false });
	}

	onGraphSelectionChanged() {
		const selection = graphManager.getGraphViewer().getSelection();

		if (!selection.length) {
			return;
		}

		const conts = selection.filter((controller) => controller.getModel() instanceof JSG.StreamSheetContainer);

		if (conts.length === 0) {
			this.updateState({ graphSelected: true, treeSelected: false });
		}
	}

	onShowZoom = (event) => {
		this.setState({
			zoomOpen: true, anchorEl: event.currentTarget
		});
	};

	onShowOutbox = () => {
		const container = graphManager.getGraph().getMachineContainer();
		const attr = container.getMachineContainerAttributes();
		const path = AttributeUtils.createPath(JSG.MachineContainerAttributes.NAME,
			JSG.MachineContainerAttributes.OUTBOXVISIBLE);
		const cmd = new CompoundCommand();
		cmd.add(new SetAttributeAtPathCommand(container, path, !attr.getOutboxVisible().getValue()));

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.execute(cmd);
		graphManager.getCanvas().focus();
	};

	onShowNumberFormat = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showNumberFormat: true, anchorEl: event.currentTarget
		});
	};

	onCloseNumberFormat = () => {
		this.setState({
			showNumberFormat: false
		});
	};

	onShowDependencies = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showDependencies: true, anchorEl: event.currentTarget
		});
	};

	onCloseDependencies = () => {
		this.setState({
			showDependencies: false
		});
	};

	onShowTools = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			toolsOpen: true, anchorEl: event.currentTarget
		});
	};

	onShowCharts = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			chartsOpen: true, anchorEl: event.currentTarget
		});
	};

	onShowBorder = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			borderOpen: true, anchorEl: event.currentTarget
		});
	};

	onShowFillColor = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showFillColor: true, anchorEl: event.currentTarget
		});
	};

	onCloseFillColor = () => {
		this.setState({
			showFillColor: false
		});
	};

	onShowFontColor = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showFontColor: true, anchorEl: event.currentTarget
		});
	};

	onCloseFontColor = () => {
		this.setState({
			showFontColor: false
		});
	};

	onShowHAlign = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showHAlign: true, anchorEl: event.currentTarget
		});
	};

	onCloseHAlign = () => {
		this.setState({
			showHAlign: false
		});
	};

	onShowVAlign = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showVAlign: true, anchorEl: event.currentTarget
		});
	};

	onCloseVAlign = () => {
		this.setState({
			showVAlign: false
		});
	};

	onShowBorderColor = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showBorderColor: true, anchorEl: event.currentTarget
		});
	};

	onCloseBorderColor = () => {
		this.setState({
			showBorderColor: false
		});
	};

	onShowBorderStyle = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showBorderStyle: true, anchorEl: event.currentTarget
		});
	};

	onCloseBorderStyle = () => {
		this.setState({
			showBorderStyle: false
		});
	};

	onToolsClose = () => {
		this.setState({
			toolsOpen: false
		});
	};

	onChartsClose = () => {
		this.setState({
			chartsOpen: false
		});
	};

	onZoomClose = () => {
		this.setState({
			zoomOpen: false
		});
	};

	onBorderClose = () => {
		this.setState({
			borderOpen: false
		});
	};

	onEditNames = () => {
		this.handleState({
			formulaOpen: false, showEditNamesDialog: true
		});
	};

	onStreamFunction = () => {
		this.props.showFunctionWizard();
	};

	onShowPredecessors = () => {
		const sheetView = graphManager.getActiveSheetView();
		if (!sheetView) {
			return;
		}

		this.setState({
			showDependencies: false
		});

		sheetView.getItem().collectPredecessors();
		graphManager.redraw();
	};

	onShowDependants = () => {
		const sheetView = graphManager.getActiveSheetView();
		if (!sheetView) {
			return;
		}

		this.setState({
			showDependencies: false
		});

		sheetView.getItem().collectDependants();
		graphManager.redraw();
	};

	onRemoveArrows = () => {
		const sheetView = graphManager.getActiveSheetView();
		if (!sheetView) {
			return;
		}

		this.setState({
			showDependencies: false
		});

		sheetView.getItem().removeArrows();
		graphManager.redraw();
	}

	onPasteFunction = () => {
		// const sheetView = graphManager.getActiveSheetView();
		// if (sheetView) {
		// 	sheetView.deActivateReferenceMode();
		// }
		this.handleState({
			formulaOpen: false, showPasteFunctionsDialog: true
		});
	};

	onCreateLine = () => {
		this.setState({
			toolsOpen: false
		});
		const edge = new JSG.Edge(new JSG.LineShape());
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateEdgeInteraction(edge));
	};

	onCreateArrow = () => {
		this.setState({
			toolsOpen: false
		});
		const edge = new JSG.Edge(new JSG.LineShape());
		edge.getFormat().setLineArrowEnd(1);
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateEdgeInteraction(edge));
	};

	onCreateRectangle = () => {
		this.setState({
			toolsOpen: false
		});

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateNodeInteraction(new JSG.RectangleShape()));
	};

	onCreateEllipse = () => {
		this.setState({
			toolsOpen: false
		});

		const node = new JSG.Node(new JSG.EllipseShape());
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateItemInteraction(node));
	};

	onCreateText = () => {
		this.setState({
			toolsOpen: false
		});

		const textnode = new JSG.TextNode('Text');
		const f = textnode.getTextFormat();
		f.setHorizontalAlignment(TextFormatAttributes.TextAlignment.LEFT);
		f.setVerticalAlignment(TextFormatAttributes.VerticalTextAlignment.TOP);
		f.setRichText(false);
		textnode.associate(false);

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateItemInteraction(textnode));
	};

	onCreatePolyline = () => {
		this.setState({
			toolsOpen: false
		});
		const polynode = new JSG.Node(new JSG.PolygonShape());
		polynode.setItemAttribute(ItemAttributes.CLOSED, false);
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreatePolyLineInteraction(polynode));
	};

	onCreateTool = (type) => {
		this.setState({
			toolsOpen: false
		});
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateItemInteraction(JSG.graphItemFactory.createItemFromString(type)));
	};

	onSelectShapes = () => {
		const viewer = graphManager.getGraphViewer();
		viewer.clearSelection();
		viewer.getInteractionHandler().setActiveInteraction(new JSG.MarqueeInteraction(true));
	};

	onUndo = () => {
		graphManager.undo();
		this.setState({});
		graphManager.getCanvas().focus();
	};

	onRedo = () => {
		graphManager.redo();
		this.setState({});
		graphManager.getCanvas().focus();
	};

	onCreateContainer = (type) => {
		this.setState({
			toolsOpen: false
		});

		const node = new JSG.Node();
		switch (type) {
		case 'matrix1':
			node.setLayout(MatrixLayout.TYPE);
			node.getLayoutSettings().set(MatrixLayout.COLUMNS, 1);
			break;
		case 'matrix2':
			node.setLayout(MatrixLayout.TYPE);
			node.getLayoutSettings().set(MatrixLayout.COLUMNS, 2);
			break;
		case 'matrix3':
			node.setLayout(MatrixLayout.TYPE);
			node.getLayoutSettings().set(MatrixLayout.COLUMNS, 3);
			break;
		default:
			break;
		}

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateItemInteraction(node));
		graphManager.getCanvas().focus();
	};

	onCreateControl = (type) => {
		let node;

		this.setState({
			toolsOpen: false
		});

		switch (type) {
		case 'layout':
			node = new JSG.LayoutNode();
			break;
		case 'button':
			node = new JSG.SheetButtonNode();
			break;
		case 'checkbox':
			node = new JSG.SheetCheckboxNode();
			break;
		case 'slider':
			node = new JSG.SheetSliderNode();
			break;
		case 'knob':
			node = new JSG.SheetKnobNode();
			break;
		default:
			break;
		}

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateItemInteraction(node));
		graphManager.getCanvas().focus();
	};

	onCreatePlot = (type) => {
		this.setState({
			chartsOpen: false
		});

		if (this.isChartSelected()) {
			const selection = graphManager.getGraphViewer().getSelection();
			const item = selection[0].getModel();
			const cmd = new JSG.CompoundCommand();
			const cmdAxis = item.prepareCommand('axes');
			const cmdChart = item.prepareCommand('chart');
			const cmdSeries = item.prepareCommand('series');

			type = item.setChartType(type);

			item.series.forEach((serie) => {
				serie.type = type;
			});

			item.setChartTypeForSeries(type);

			item.finishCommand(cmdSeries, 'series');
			item.finishCommand(cmdChart, 'chart');
			item.finishCommand(cmdAxis, 'axes');
			cmd.add(cmdChart);
			cmd.add(cmdAxis);
			cmd.add(cmdSeries);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else {
			const node = new JSG.SheetPlotNode();
			const attr = node.addAttribute(new BooleanAttribute('showwizard', true));
			attr.setTransient(true);
			graphManager.chartType = type;
			const sheetView = graphManager.getActiveSheetView();
			if (sheetView) {
				const selection = sheetView.getOwnSelection();
				if (selection) {
					graphManager.chartSelection = selection.copy();
				}
			}

			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.setActiveInteraction(new JSG.CreateItemInteraction(node));
		}
		graphManager.getCanvas().focus();
	};

	onFormatCells = () => {
		this.handleState({
			formatOpen: false, showFormatCellsDialog: true
		});
	};

	onFormatHorizontalAlign = (align) => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.HORIZONTALALIGN, align);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = SheetCommandFactory.create('command.TextFormatCellsCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.setState({
			showHAlign: false
		});
		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatVerticalAlign = (align) => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.VERTICALALIGN, align);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = SheetCommandFactory.create('command.TextFormatCellsCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.setState({
			showVAlign: false
		});
		this.updateState();
	};

	onFormatFontSize = (event) => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.FONTSIZE, Number(event.target.value));

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = SheetCommandFactory.create('command.TextFormatCellsCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatFontName = (event) => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.FONTNAME, event.target.value);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = SheetCommandFactory.create('command.TextFormatCellsCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatPercent = () => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.NUMBERFORMAT, '0%');
		attributesMap.put(TextFormatAttributes.LOCALCULTURE, 'percent;0');

		if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager.getGraphEditor().getInteractionHandler().applyTextFormatMap(attributesMap);
		} else {
			const sheetView = graphManager.getActiveSheetView();
			if (sheetView) {
				const cmd = SheetCommandFactory.create('command.TextFormatCellsCommand',
					sheetView.getOwnSelection().getRanges(), attributesMap);
				graphManager
					.getGraphViewer()
					.getInteractionHandler()
					.execute(cmd);
			}
		}
		this.updateState();
		graphManager.getCanvas().focus();
	};

	isNumberFormatAvailable = () => {
		if (this.props.cellSelected) {
			return true;
		}

		if (this.state.graphSelected) {
			const selection = graphManager.getGraphViewer().getSelection();
			if (selection && selection.length) {
				const cont = selection[0];
				if (cont.getModel() instanceof SheetPlotNode) {
					const sel = cont.getView().chartSelection;
					if (!sel) {
						return false;
					}
					return sel.element === 'serieslabel' || sel.element === 'xAxis' || sel.element === 'yAxis';
				} else if (cont.getModel() instanceof JSG.TextNode) {
					return true;
				}
			}
			return false;
		}

		return false;
	};

	onFormatNumberFormat = (format) => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.NUMBERFORMAT, format.nf);
		attributesMap.put(TextFormatAttributes.LOCALCULTURE, format.local);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = SheetCommandFactory.create('command.TextFormatCellsCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}

		this.setState({
			showNumberFormat: false
		});

		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatDecimals = (more, thousandsFlag) => {
		const attributesMap = new Dictionary();
		const sheetView = graphManager.getActiveSheetView();
		const tf = this.state.cellTextFormat;
		if (!tf) {
			return;
		}

		let decimals = 0;
		let category = 'number';
		let currency = '€';
		let thousands = false;

		let sections = tf.getLocalCulture() ? tf.getLocalCulture().getValue() : '';
		sections = sections.split(';');
		if (sections.length) {
			switch (sections[0]) {
			case 'general':
				category = 'number';
				break;
			case 'currency':
				[, , , currency] = sections;
				currency = currency === 'undefined' ? '€' : currency;
				decimals = Number(sections[1]);
				[category] = sections;
				thousands = sections[2] === 'true';
				break;
			case 'number':
				decimals = Number(sections[1]);
				[category] = sections;
				thousands = sections[2] === 'true';
				break;
			case 'percent':
			case 'science':
				decimals = Number(sections[1]);
				[category] = sections;
				break;
			default:
				category = 'number';
				break;
			}
		}

		if (decimals !== undefined) {
			decimals = Math.max(0, more ? decimals + 1 : decimals - 1);
		}
		if (thousandsFlag !== undefined) {
			thousands = true;
		}

		let template;
		let culture;

		switch (category) {
		default:
		case 'number':
			template =
				numberFormatTemplates.getNegativeNumberTemplates(thousands, Number(decimals), 'red', 0, 0, undefined,
					0);
			culture = `number;${decimals};${thousands}`;
			break;
		case 'currency':
			template =
				numberFormatTemplates.getNegativeNumberTemplates(thousands, Number(decimals), 'red', 0, 0, currency, 0);
			culture = `currency;${decimals};${thousands};${currency}`;
			break;
		case 'percent':
			template = numberFormatTemplates.getNumberTemplate(Number(decimals), 0, 5, 0);
			culture = `percent;${decimals}`;
			break;
		case 'science':
			template = numberFormatTemplates.getNumberTemplate(Number(decimals), 0, 7, 0);
			culture = `science;${decimals}`;
			break;
		}

		attributesMap.put(TextFormatAttributes.NUMBERFORMAT, template.format);
		attributesMap.put(TextFormatAttributes.LOCALCULTURE, culture);

		if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager.getGraphEditor().getInteractionHandler().applyTextFormatMap(attributesMap);
		} else {
			const cmd = SheetCommandFactory.create('command.TextFormatCellsCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		}
		this.updateState();

		graphManager.getCanvas().focus();
	};

	onFormatBold = () => {
		const attributesMap = new Dictionary();
		const tf = this.state.cellTextFormat;

		if (!tf) {
			return;
		}

		const style = tf.getFontStyle() ? tf.getFontStyle().getValue() : 0;
		const newStyle = style & TextFormatAttributes.FontStyle.BOLD ? style & ~TextFormatAttributes.FontStyle.BOLD :
			style | TextFormatAttributes.FontStyle.BOLD;

		attributesMap.put(TextFormatAttributes.FONTSTYLE, newStyle);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = SheetCommandFactory.create('command.TextFormatCellsCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatItalic = () => {
		const attributesMap = new Dictionary();
		const tf = this.state.cellTextFormat;

		if (!tf) {
			return;
		}

		const style = tf.getFontStyle() ? tf.getFontStyle().getValue() : 0;
		const newStyle = style & TextFormatAttributes.FontStyle.ITALIC ?
			style & ~TextFormatAttributes.FontStyle.ITALIC : style | TextFormatAttributes.FontStyle.ITALIC;

		attributesMap.put(TextFormatAttributes.FONTSTYLE, newStyle);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = SheetCommandFactory.create('command.TextFormatCellsCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}

		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatFillColor = (color, event) => {
		const attributesMap = new Dictionary();
		if (color.hex === 'transparent') {
			attributesMap.put(FormatAttributes.FILLSTYLE, FormatAttributes.FillStyle.NONE);
		} else if (color.hex.toUpperCase() === '#FFFFFE') {
			attributesMap.put(FormatAttributes.FILLCOLOR, 'auto');
			const f = this.state.cellFormat;
			const style = f && f.getFillStyle() ? f.getFillStyle().getValue() : '';
			if (style === FormatAttributes.FillStyle.NONE) {
				attributesMap.put(FormatAttributes.FILLSTYLE, FormatAttributes.FillStyle.SOLID);
			}
		} else {
			attributesMap.put(FormatAttributes.FILLCOLOR, color.hex);
			attributesMap.put(FormatAttributes.FILLSTYLE, FormatAttributes.FillStyle.SOLID);
		}
		if (this.isChartSelected()) {
			attributesMap.put(FormatAttributes.TRANSPARENCY, color.rgb.a * 100);
		}

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = SheetCommandFactory.create('command.FormatCellsCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyFormatMap(attributesMap);
		}
		this.updateState();

		if (event.target && event.target.style.cursor === 'pointer') {
			this.setState({
				showFillColor: false
			});
		}
		// graphManager.getCanvas().focus();
	};

	onFormatBorderStyle = (style) => {
		const sheetView = graphManager.getActiveSheetView();
		let cmd;
		const attributesMap = new Dictionary();

		if (sheetView) {
			const selection = sheetView.getOwnSelection();
			attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, style);
			attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, style);
			attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, style);
			attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, style);
			cmd = SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			attributesMap.put(FormatAttributes.LINESTYLE, style);
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyFormatMap(attributesMap);
		}

		this.updateState();
		graphManager.getCanvas().focus();

		this.setState({
			showBorderStyle: false
		});
	};

	onFormatBorderWidth = (width) => {
		const sheetView = graphManager.getActiveSheetView();
		let cmd;
		const attributesMap = new Dictionary();

		if (sheetView) {
			const selection = sheetView.getOwnSelection();
			switch (width) {
			case -1:
				width = 1;
				break;
			case 25:
				width = 1.5;
				break;
			case 50:
				width = 2;
				break;
			case 75:
				width = 3;
				break;
			case 100:
				width = 4;
				break;
			case 200:
				width = 8;
				break;
			case 300:
				width = 12;
				break;
			case 400:
				width = 16;
				break;
			default:
				break;
			}
			attributesMap.put(JSG.CellAttributes.LEFTBORDERWIDTH, width);
			attributesMap.put(JSG.CellAttributes.TOPBORDERWIDTH, width);
			attributesMap.put(JSG.CellAttributes.RIGHTBORDERWIDTH, width);
			attributesMap.put(JSG.CellAttributes.BOTTOMBORDERWIDTH, width);
			cmd = SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			attributesMap.put(FormatAttributes.LINEWIDTH, width);
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyFormatMap(attributesMap);
		}

		this.updateState();
		graphManager.getCanvas().focus();

		this.setState({
			showBorderStyle: false
		});
	};

	onFormatBorder = (type) => {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const attributesMap = new Dictionary();

			if (graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()) {
				// graphManager.getGraphEditor().getInteractionHandler().applyFormatMap(attributesMap);
			} else {
				let selection = sheetView.getOwnSelection();
				let cmd;
				let rangeCopy;

				switch (type) {
				case 'all':
					attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					cmd = SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap);
					break;
				case 'clear':
					attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.NONE);
					attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.NONE);
					attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.NONE);
					attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.NONE);
					attributesMap.put(JSG.CellAttributes.LEFTBORDERWIDTH, 1);
					attributesMap.put(JSG.CellAttributes.TOPBORDERWIDTH, 1);
					attributesMap.put(JSG.CellAttributes.RIGHTBORDERWIDTH, 1);
					attributesMap.put(JSG.CellAttributes.BOTTOMBORDERWIDTH, 1);
					attributesMap.put(JSG.CellAttributes.LEFTBORDERCOLOR, JSG.theme.border);
					attributesMap.put(JSG.CellAttributes.TOPBORDERCOLOR, JSG.theme.border);
					attributesMap.put(JSG.CellAttributes.RIGHTBORDERCOLOR, JSG.theme.border);
					attributesMap.put(JSG.CellAttributes.BOTTOMBORDERCOLOR, JSG.theme.border);
					cmd = new CompoundCommand();
					cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap));
					selection.getRanges().forEach((range) => {
						if (range._y1) {
							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.NONE);
							attributesMap.put(JSG.CellAttributes.BOTTOMBORDERWIDTH, 1);
							attributesMap.put(JSG.CellAttributes.BOTTOMBORDERCOLOR, JSG.theme.border);

							rangeCopy = range.copy();
							rangeCopy._y1 -= 1;
							rangeCopy._y2 = rangeCopy._y1;
							cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', [rangeCopy],
								attributesMap));
						}
						if (range._y2 < range.getSheet().getRowCount()) {
							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.NONE);
							attributesMap.put(JSG.CellAttributes.TOPBORDERWIDTH, 1);
							attributesMap.put(JSG.CellAttributes.TOPBORDERCOLOR, JSG.theme.border);

							rangeCopy = range.copy();
							rangeCopy._y1 = rangeCopy._y2 + 1;
							rangeCopy._y2 = rangeCopy._y1;
							cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', [rangeCopy],
								attributesMap));
						}
						if (range._x1) {
							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.NONE);
							attributesMap.put(JSG.CellAttributes.RIGHTBORDERWIDTH, 1);
							attributesMap.put(JSG.CellAttributes.RIGHTBORDERCOLOR, JSG.theme.border);

							rangeCopy = range.copy();
							rangeCopy._x1 -= 1;
							rangeCopy._x2 = rangeCopy._x1;
							cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', [rangeCopy],
								attributesMap));
						}
						if (range._x2 < range.getSheet().getColumnCount()) {
							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.NONE);
							attributesMap.put(JSG.CellAttributes.LEFTBORDERWIDTH, 1);
							attributesMap.put(JSG.CellAttributes.LEFTBORDERCOLOR, JSG.theme.border);

							rangeCopy = range.copy();
							rangeCopy._x1 = rangeCopy._x2 + 1;
							rangeCopy._x2 = rangeCopy._x1;
							cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', [rangeCopy],
								attributesMap));
						}
					});
					break;
				case 'left':
					attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					selection = sheetView.getOwnSelection().copy();
					selection.getRanges().forEach((range) => {
						range.setWidth(1);
					});
					cmd = SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap);
					break;
				case 'top':
					attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					selection = sheetView.getOwnSelection().copy();
					selection.getRanges().forEach((range) => {
						range.setHeight(1);
					});
					cmd = SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap);
					break;
				case 'right':
					attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					selection = sheetView.getOwnSelection().copy();
					selection.getRanges().forEach((range) => {
						range._x1 = range._x2;
					});
					cmd = SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap);
					break;
				case 'bottom':
					attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					selection = sheetView.getOwnSelection().copy();
					selection.getRanges().forEach((range) => {
						range._y1 = range._y2;
					});
					cmd = SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap);
					break;
				case 'bottomfat':
					attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					attributesMap.put(JSG.CellAttributes.BOTTOMBORDERWIDTH, 3);
					selection = sheetView.getOwnSelection().copy();
					selection.getRanges().forEach((range) => {
						range._y1 = range._y2;
					});
					cmd = SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap);
					break;
				case 'inner': {
					let copyRanges;
					cmd = new CompoundCommand();
					selection.getRanges().forEach((range) => {
						if (range.getWidth() > 1) {
							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
							rangeCopy = range.copy();
							rangeCopy.setWidth(1);
							copyRanges = [];
							copyRanges.push(rangeCopy);
							cmd.add(
								SheetCommandFactory.create('command.CellAttributesCommand', copyRanges, attributesMap));

							if (range.getWidth() > 2) {
								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
								attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE,
									FormatAttributes.LineStyle.SOLID);

								rangeCopy = range.copy();
								rangeCopy._x1 += 1;
								rangeCopy._x2 -= 1;
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', copyRanges,
									attributesMap));
							}

							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
							rangeCopy = range.copy();
							rangeCopy._x1 = rangeCopy._x2;
							copyRanges = [];
							copyRanges.push(rangeCopy);
							cmd.add(
								SheetCommandFactory.create('command.CellAttributesCommand', copyRanges, attributesMap));
						}
					});

					selection.getRanges().forEach((range) => {
						if (range.getHeight() > 1) {
							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
							rangeCopy = range.copy();
							rangeCopy.setHeight(1);
							copyRanges = [];
							copyRanges.push(rangeCopy);
							cmd.add(
								SheetCommandFactory.create('command.CellAttributesCommand', copyRanges, attributesMap));

							if (range.getHeight() > 2) {
								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
								attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE,
									FormatAttributes.LineStyle.SOLID);

								rangeCopy = range.copy();
								rangeCopy._y1 += 1;
								rangeCopy._y2 -= 1;
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', copyRanges,
									attributesMap));
							}

							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
							rangeCopy = range.copy();
							rangeCopy._y1 = rangeCopy._y2;
							copyRanges = [];
							copyRanges.push(rangeCopy);
							cmd.add(
								SheetCommandFactory.create('command.CellAttributesCommand', copyRanges, attributesMap));
						}
					});
					if (!cmd.hasCommands()) {
						cmd = undefined;
					}
					break;
				}
				case 'outer':
				case 'outerfat':
					cmd = new CompoundCommand();
					attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					if (type === 'outerfat') {
						attributesMap.put(JSG.CellAttributes.LEFTBORDERWIDTH, 3);
					}
					selection = sheetView.getOwnSelection().copy();
					selection.getRanges().forEach((range) => {
						range.setWidth(1);
					});
					cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap));
					attributesMap.clear();
					attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					if (type === 'outerfat') {
						attributesMap.put(JSG.CellAttributes.TOPBORDERWIDTH, 3);
					}
					selection = sheetView.getOwnSelection().copy();
					selection.getRanges().forEach((range) => {
						range.setHeight(1);
					});
					cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap));
					attributesMap.clear();
					attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					if (type === 'outerfat') {
						attributesMap.put(JSG.CellAttributes.RIGHTBORDERWIDTH, 3);
					}
					selection = sheetView.getOwnSelection().copy();
					selection.getRanges().forEach((range) => {
						range._x1 = range._x2;
					});
					cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap));
					attributesMap.clear();
					attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
					if (type === 'outerfat') {
						attributesMap.put(JSG.CellAttributes.BOTTOMBORDERWIDTH, 3);
					}
					selection = sheetView.getOwnSelection().copy();
					selection.getRanges().forEach((range) => {
						range._y1 = range._y2;
					});
					cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', selection.getRanges(),
						attributesMap));
					break;
				case 'vertical': {
					let copyRanges;
					cmd = new CompoundCommand();
					selection.getRanges().forEach((range) => {
						if (range.getWidth() > 1) {
							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
							rangeCopy = range.copy();
							rangeCopy.setWidth(1);
							copyRanges = [];
							copyRanges.push(rangeCopy);
							cmd.add(
								SheetCommandFactory.create('command.CellAttributesCommand', copyRanges, attributesMap));

							if (range.getWidth() > 2) {
								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
								attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE,
									FormatAttributes.LineStyle.SOLID);

								rangeCopy = range.copy();
								rangeCopy._x1 += 1;
								rangeCopy._x2 -= 1;
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', copyRanges,
									attributesMap));
							}

							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
							rangeCopy = range.copy();
							rangeCopy._x1 = rangeCopy._x2;
							copyRanges = [];
							copyRanges.push(rangeCopy);
							cmd.add(
								SheetCommandFactory.create('command.CellAttributesCommand', copyRanges, attributesMap));
						}
					});
					if (!cmd.hasCommands()) {
						cmd = undefined;
					}
					break;
				}
				case 'horizontal': {
					let copyRanges;
					cmd = new CompoundCommand();
					selection.getRanges().forEach((range) => {
						if (range.getHeight() > 1) {
							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
							rangeCopy = range.copy();
							rangeCopy.setHeight(1);
							copyRanges = [];
							copyRanges.push(rangeCopy);
							cmd.add(
								SheetCommandFactory.create('command.CellAttributesCommand', copyRanges, attributesMap));

							if (range.getHeight() > 2) {
								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
								attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE,
									FormatAttributes.LineStyle.SOLID);

								rangeCopy = range.copy();
								rangeCopy._y1 += 1;
								rangeCopy._y2 -= 1;
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(SheetCommandFactory.create('command.CellAttributesCommand', copyRanges,
									attributesMap));
							}

							attributesMap.clear();
							attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
							rangeCopy = range.copy();
							rangeCopy._y1 = rangeCopy._y2;
							copyRanges = [];
							copyRanges.push(rangeCopy);
							cmd.add(
								SheetCommandFactory.create('command.CellAttributesCommand', copyRanges, attributesMap));
						}
					});
					if (!cmd.hasCommands()) {
						cmd = undefined;
					}
					break;
				}
				default:
					return;
				}

				if (cmd) {
					graphManager
						.getGraphViewer()
						.getInteractionHandler()
						.execute(cmd);
				}
			}
			this.updateState();
			graphManager.getCanvas().focus();

			this.setState({
				borderOpen: false
			});
		}
	};

	onFormatFontColor = (color, event) => {
		const attributesMap = new Dictionary();
		attributesMap.put(TextFormatAttributes.FONTCOLOR, color.hex);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = SheetCommandFactory.create('command.TextFormatCellsCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.updateState();
		graphManager.getCanvas().focus();

		if (event.target && event.target.style.cursor === 'pointer') {
			this.setState({
				showFontColor: false
			});
		}
	};

	onFormatBorderColor = (color, event) => {
		const attributesMap = new Dictionary();

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			if (color.hex === 'transparent') {
				this.onFormatBorder('clear');
				return;
			}

			attributesMap.put(JSG.CellAttributes.LEFTBORDERCOLOR, color.hex);
			attributesMap.put(JSG.CellAttributes.TOPBORDERCOLOR, color.hex);
			attributesMap.put(JSG.CellAttributes.RIGHTBORDERCOLOR, color.hex);
			attributesMap.put(JSG.CellAttributes.BOTTOMBORDERCOLOR, color.hex);

			const cmd = SheetCommandFactory.create('command.CellAttributesCommand',
				sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			if (color.hex === 'transparent') {
				attributesMap.put(FormatAttributes.LINESTYLE, FormatAttributes.LineStyle.NONE);
			} else if (color.hex.toUpperCase() === '#FFFFFE') {
				attributesMap.put(FormatAttributes.LINECOLOR, 'auto');
				const f = this.state.cellFormat;
				const style = f && f.getLineStyle() ? f.getLineStyle().getValue() : '';
				if (style === FormatAttributes.LineStyle.NONE) {
					attributesMap.put(FormatAttributes.LINESTYLE, FormatAttributes.LineStyle.SOLID);
				}
			} else {
				attributesMap.put(FormatAttributes.LINECOLOR, color.hex);
				const f = this.state.cellFormat;
				const style = f && f.getLineStyle() ? f.getLineStyle().getValue() : '';
				if (style === FormatAttributes.LineStyle.NONE) {
					attributesMap.put(FormatAttributes.LINESTYLE, FormatAttributes.LineStyle.SOLID);
				}
			}
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyFormatMap(attributesMap);
		}

		this.updateState();
		graphManager.getCanvas().focus();

		if (event.target && event.target.style.cursor === 'pointer') {
			this.setState({
				showBorderColor: false
			});
		}
	};

	onCommandStackChanged = (notification) => {
		const { commandStack } = notification.object;
		this.props.setJsgState({
			canUndo: commandStack.canUndo(), canRedo: commandStack.canRedo()
		});
	};

	onAlignSheets = () => {
		const container = graphManager.getGraph().getStreamSheetsContainer();
		if (container === undefined) {
			return;
		}

		const cmd = new CompoundCommand();
		const size = container.getSizeAsPoint();
		const getSheetAt = (index) => {
			let current = 0;
			let ret;
			container.enumerateStreamSheetContainers((sheet) => {
				if (index === current) {
					ret = sheet;
				}
				if (sheet
					.getItemAttributes()
					.getViewMode()
					.getValue() !== 1) {
					current += 1;
				}
			});

			return ret;
		};

		let x = 500;
		let y = 500;
		let count = 0;
		let maximizedSheet;

		container.enumerateStreamSheetContainers((sheet) => {
			if (sheet
				.getItemAttributes()
				.getViewMode()
				.getValue() !== 1) {
				count += 1;
			}
			if (sheet
				.getItemAttributes()
				.getViewMode()
				.getValue() === 2) {
				maximizedSheet = sheet;
			}
		});

		if (maximizedSheet) {
			graphManager.getGraph().setViewMode(maximizedSheet, 0);
			maximizedSheet._oldBoundingBox = undefined;
		}

		const horizontal = Math.ceil(Math.sqrt(count));
		const vertical = Math.ceil(count / horizontal);

		const height = (size.y - vertical * 500 - 500) / vertical;
		let width = (size.x - horizontal * 500 - 500) / horizontal;

		for (let i = 0; i < vertical; i += 1) {
			if (i === vertical - 1) {
				const rest = count - i * horizontal;
				width = (size.x - rest * 500 - 500) / rest;
			}
			for (let j = 0; j < horizontal; j += 1) {
				const sheet = getSheetAt(i * horizontal + j);
				if (sheet) {
					cmd.add(new MoveItemCommand(sheet, new Point(x + width / 2, y + height / 2)));
					cmd.add(new SetSizeCommand(sheet, new Size(width, height)));
					x += width + 500;
				}
			}
			y += height + 500;
			x = 500;
		}

		const controller = graphManager
			.getGraphViewer()
			.getGraphController()
			.getControllerByModelId(container.getId());
		if (controller) {
			controller.getView().getViewPort()._vpOffset.x = 0;
			controller.getView().getViewPort()._vpOffset.y = 0;
			controller
				.getView()
				.getScrollView()
				.setScrollPosition(0, 0);
		}

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.execute(cmd);
		graphManager.getCanvas().focus();
	};

	getFormatBorderColor() {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const attr = this.state.cellAttributes;
			if (attr) {
				let lcolor = attr.getLeftBorderColor() ? attr.getLeftBorderColor().getValue() : '';
				const tcolor = attr.getTopBorderColor() ? attr.getTopBorderColor().getValue() : '';
				const rcolor = attr.getRightBorderColor() ? attr.getRightBorderColor().getValue() : '';
				const bcolor = attr.getBottomBorderColor() ? attr.getBottomBorderColor().getValue() : '';
				if (lcolor !== rcolor || lcolor !== tcolor || lcolor !== bcolor) {
					lcolor = '';
				}
				return lcolor;
			}
		} else if (graphManager.getGraphEditor() && graphManager.getGraphEditor().getGraphViewer() && graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			const f = this.state.cellFormat;
			return f && f.getLineColor() ? f.getLineColor().getValue() : '';
		}

		return '';
	}

	getFormatBorderStyle() {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const attr = this.state.cellAttributes;
			if (attr) {
				let lStyle = attr.getLeftBorderStyle() ? attr.getLeftBorderStyle().getValue() : '';
				const tStyle = attr.getTopBorderStyle() ? attr.getTopBorderStyle().getValue() : '';
				const rStyle = attr.getRightBorderStyle() ? attr.getRightBorderStyle().getValue() : '';
				const bStyle = attr.getBottomBorderStyle() ? attr.getBottomBorderStyle().getValue() : '';
				if (lStyle !== rStyle || lStyle !== tStyle || lStyle !== bStyle) {
					lStyle = '';
				}
				return lStyle;
			}
		} else if (graphManager.getGraphEditor() && graphManager.getGraphEditor().getGraphViewer() && graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			const f = this.state.cellFormat;
			return f && f.getLineStyle() ? f.getLineStyle().getValue() : '';
		}

		return '';
	}

	getFormatBorderWidth() {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const attr = this.state.cellAttributes;
			if (attr) {
				let lWidth = attr.getLeftBorderWidth() ? attr.getLeftBorderWidth().getValue() : '';
				const tWidth = attr.getTopBorderWidth() ? attr.getTopBorderWidth().getValue() : '';
				const rWidth = attr.getRightBorderWidth() ? attr.getRightBorderWidth().getValue() : '';
				const bWidth = attr.getBottomBorderWidth() ? attr.getBottomBorderWidth().getValue() : '';
				if (lWidth !== rWidth || lWidth !== tWidth || lWidth !== bWidth) {
					return '';
				}
				lWidth = Math.max(1, lWidth);
				if (lWidth !== 1.5) {
					// compensate old approach
					lWidth = Math.round(lWidth);
				}
				switch (lWidth) {
				case 1:
					return 1;
				case 1.5:
					return 25;
				case 2:
					return 50;
				case 3:
					return 75;
				case 4:
					return 100;
				case 8:
					return 200;
				case 12:
					return 300;
				case 16:
					return 400;
				default:
					break;
				}

			}
		} else if (graphManager.getGraphEditor() && graphManager.getGraphEditor().getGraphViewer() && graphManager
			.getGraphEditor()
			.getSelectionProvider()
			.hasSelection()) {
			const f = this.state.cellFormat;
			return f && f.getLineWidth() ? f.getLineWidth().getValue() : '';
		}

		return '';
	}

	isChartSelected() {
		const selection = graphManager.getGraphViewer().getSelection();
		return selection && selection.length > 0 && (selection[0].getModel() instanceof SheetPlotNode);
	}

	isChartElementSelected() {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection && selection.length) {
			const cont = selection[0];
			if (cont.getModel() instanceof SheetPlotNode) {
				return cont.getView().chartSelection !== undefined;
			}
		}
		return false;
	}

	isChartElementWithoutFontSelected() {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection && selection.length) {
			const cont = selection[0];
			if (cont.getModel() instanceof SheetPlotNode) {
				const sel = cont.getView().chartSelection;
				if (!sel) {
					return true;
				}
				return sel.element === 'point' || sel.element === 'series';
			}
		}
		return false;
	}

	fillColorToRGBAObject(format) {
		let color = format && format.getFillColor() ? format.getFillColor().getValue() : '#FFFFFF';
		if (color.length && color[0] !== '#') {
			return color;
		}

		color = Strings.cut(color, '#');
		// cut off a leading #
		color = parseInt(color, 16);
		const r = color >> 16;
		const g = (color >> 8) & 0xff;
		const b = color & 0xff;
		const a = format ? format.getTransparency().getValue() / 100 : 1;

		return { r, g, b, a };
	}

	updateState(state = {}) {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection.length) {
			if (selection[0].getModel() instanceof SheetPlotNode) {
				state.cellTextFormat = selection[0].getView().getSelectedTextFormat();
				state.cellFormat = selection[0].getView().getSelectedFormat();
			} else {
				state.cellTextFormat = TextFormatAttributes.retainFromSelection(selection);
				state.cellFormat = FormatAttributes.retainFromSelection(selection);
			}
		} else if (this.props.cellSelected) {
			const sheetView = graphManager.getActiveSheetView();
			if (sheetView) {
				const item = sheetView.getItem();
				const cell = item.getOwnSelection().getActiveCell();
				if (cell !== undefined) {
					state.cellTextFormat = item.getTextFormatAt(cell);
					state.cellFormat = item.getFormatAt(cell);
					state.cellAttributes = item.getCellAttributesAt(cell);
				}
			}
		}

		this.setState(state);
	}

	handleState = (state) => {
		this.props.setAppState(state);
	};

	handleZoom = (factor) => {
		graphManager.getGraphEditor().setZoom(factor / 100);
		this.updateState();
	};

	redo = () => {
		this.props.redoCommand(this.props.machineId);
		graphManager.getCanvas().focus();
	};

	undo = () => {
		this.props.undoCommand(this.props.machineId);
		graphManager.getCanvas().focus();
	};

	isMachinePage() {
		return window.location.href.indexOf('/machines/') > 0;
	}

	handleFocus = () => {
		graphManager.getCanvas().focus();
	};

	getPresetColors(color) {
		const colors = [{ title: 'Black', color: '#000000' }, { title: 'Tundora', color: '#434343' },
			{ title: 'Dove Gray', color: '#666666' }, { title: 'Dusty Gray', color: '#999999' },
			{ title: 'Nobel', color: '#b7b7b7' }, { title: 'Silver', color: '#cccccc' },
			{ title: 'Alto', color: '#d9d9d9' }, { title: 'Gallery', color: '#efefef' },
			{ title: 'Concrete', color: '#f3f3f3' }, { title: 'White', color: '#ffffff' },
			{ title: 'Dark Red', color: '#980000' }, { title: 'Red', color: '#ff0000' },
			{ title: 'Orange', color: '#ff9900' }, { title: 'Yellow', color: '#ffff00' },
			{ title: 'Green', color: '#00ff00' }, { title: 'Light Blue', color: '#00ffff' },
			{ title: 'Cornflower Blue', color: '#4a86e8' }, { title: 'Blue', color: '#0000ff' },
			{ title: 'Electric Violet', color: '#9900ff' }, { title: 'Magenta ', color: '#ff00ff' },
			{ title: '#e6b8af', color: '#e6b8af' }, { title: '#f4cccc', color: '#f4cccc' },
			{ title: '#fce5cd', color: '#fce5cd' }, { title: '#fff2cc', color: '#fff2cc' },
			{ title: '#d9ead3', color: '#d9ead3' }, { title: '#d0e0e3', color: '#d0e0e3' },
			{ title: '#c9daf8', color: '#c9daf8' }, { title: '#cfe2f3', color: '#cfe2f3' },
			{ title: '#d9d2e9', color: '#d9d2e9' }, { title: '#ead1dc', color: '#ead1dc' },
			{ title: '#dd7e6b', color: '#dd7e6b' }, { title: '#ea9999', color: '#ea9999' },
			{ title: '#f9cb9c', color: '#f9cb9c' }, { title: '#ffe599', color: '#ffe599' },
			{ title: '#b6d7a8', color: '#b6d7a8' }, { title: '#a2c4c9', color: '#a2c4c9' },
			{ title: '#a4c2f4', color: '#a4c2f4' }, { title: '#9fc5e8', color: '#9fc5e8' },
			{ title: '#b4a7d6', color: '#b4a7d6' }, { title: '#d5a6bd', color: '#d5a6bd' },
			{ title: '#cc4125', color: '#cc4125' }, { title: '#e06666', color: '#e06666' },
			{ title: '#f6b26b', color: '#f6b26b' }, { title: '#ffd966', color: '#ffd966' },
			{ title: '#93c47d', color: '#93c47d' }, { title: '#76a5af', color: '#76a5af' },
			{ title: '#6d9eeb', color: '#6d9eeb' }, { title: '#6fa8dc', color: '#6fa8dc' },
			{ title: '#8e7cc3', color: '#8e7cc3' }, { title: '#c27ba0', color: '#c27ba0' },
			{ title: '#a61c00', color: '#a61c00' }, { title: '#cc0000', color: '#cc0000' },
			{ title: '#e69138', color: '#e69138' }, { title: '#f1c232', color: '#f1c232' },
			{ title: '#6aa84f', color: '#6aa84f' }, { title: '#45818e', color: '#45818e' },
			{ title: '#3c78d8', color: '#3c78d8' }, { title: '#3d85c6', color: '#3d85c6' },
			{ title: '#674ea7', color: '#674ea7' }, { title: '#a64d79', color: '#a64d79' },
			{ title: '#85200c', color: '#85200c' }, { title: '#990000', color: '#990000' },
			{ title: '#b45f06', color: '#b45f06' }, { title: '#bf9000', color: '#bf9000' },
			{ title: '#38761d', color: '#38761d' }, { title: '#134f5c', color: '#134f5c' },
			{ title: '#1155cc', color: '#1155cc' }, { title: '#0b5394', color: '#0b5394' },
			{ title: '#351c75', color: '#351c75' }, { title: '#741b47', color: '#741b47' },
			{ title: '#5b0f00', color: '#5b0f00' }, { title: '#660000', color: '#660000' },
			{ title: '#783f04', color: '#783f04' }, { title: '#7f6000', color: '#7f6000' },
			{ title: '#274e13', color: '#274e13' }, { title: '#0c343d', color: '#0c343d' },
			{ title: '#1c4587', color: '#1c4587' }, { title: '#073763', color: '#073763' },
			{ title: '#20124d', color: '#20124d' }, { title: '#4c1130', color: '#4c1130' }];

		colors.push({ title: 'None', color: 'transparent' });
		if (this.isChartElementSelected()) {
			colors.push({ title: 'Automatic', color: '#FFFFFE' });
		}

		if (color) {
			colors.forEach(colorl => {
				if (colorl.color === color.toLowerCase()) {
					colorl.title += `${intl.formatMessage({ id: 'Current' }, {})}`;
				}
			});
		}

		return colors;
	}

	render() {
		const canEdit = accessManager.can(RESOURCE_TYPES.MACHINE, RESOURCE_ACTIONS.EDIT);
		const { classes } = this.props;
		if (!this.isMachinePage(this.props) || !canEdit) {
			return null;
		}
		const { viewMode } = this.props;
		if (viewMode.active === true) {
			return null;
		}
		const tf = this.state.cellTextFormat;
		const f = this.state.cellFormat;
		const noChartFont = this.isChartElementWithoutFontSelected();
		const gridTitleColor = this.props.theme.overrides.MuiAppBar.colorPrimary.backgroundColor;
		const selBorderStyle = this.getFormatBorderStyle();
		const selBorderWidth = this.getFormatBorderWidth();
		return (<AppBar
				id="stream-app-toolbar"
				elevation={0}
				color='default'
				style={{
					height: '37px',
					minHeight: '37px',
					margin: 0,
					padding: '0px 0px 0px 6px',
					position: 'relative',
					width: '100%',
					borderBottom: '1px solid #AAAAAA',
					borderTop: '1px solid #AAAAAA',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'row'
				}}
			>
				<Tooltip enterDelay={300} title={<FormattedMessage id='Tooltip.Undo' defaultMessage='Undo' />}>
					<div>
						<IconButton style={buttonStyle} onClick={(e) => this.onUndo(e)} disabled={!this.props.canUndo}>
							<UndoIcon />
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip enterDelay={300} title={<FormattedMessage id='Tooltip.Redo' defaultMessage='Redo' />}>
					<div>
						<IconButton style={buttonStyle} onClick={(e) => this.onRedo(e)} disabled={!this.props.canRedo}>
							<RedoIcon />
						</IconButton>
					</div>
				</Tooltip>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA', height: '40px', margin: '0px 8px'
					}}
				/>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatCells' defaultMessage='Format Cells' />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onFormatCells}
							disabled={!this.props.cellSelected}
						>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d='M21.7,13.35L20.7,14.35L18.65,12.3L19.65,11.3C19.86,11.08 20.21,11.08 20.42,11.3L21.7,12.58C21.92,12.79 21.92,13.14 21.7,13.35M12,18.94L18.07,12.88L20.12,14.93L14.06,21H12V18.94M4,2H18A2,2 0 0,1 20,4V8.17L16.17,12H12V16.17L10.17,18H4A2,2 0 0,1 2,16V4A2,2 0 0,1 4,2M4,6V10H10V6H4M12,6V10H18V6H12M4,12V16H10V12H4Z'
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA', height: '40px', margin: '0px 8px'
					}}
				/>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatThousands' defaultMessage='Show Thousand Separators' />}
				>
					<div>
						<IconButton
							onClick={() => this.onFormatDecimals(undefined, true)}
							disabled={!this.isNumberFormatAvailable()}
							style={buttonStyle}
						>
							<SvgIcon>
								<text x='12' y='12' fontWeight='bold' fontSize='9pt' dy='0.25em' textAnchor='middle'>
									000
								</text>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatPercent' defaultMessage='Numberformat Percent' />}
				>
					<div>
						<IconButton
							onClick={this.onFormatPercent}
							disabled={!this.isNumberFormatAvailable()}
							style={buttonStyle}
						>
							<SvgIcon>
								<text x='12' y='12' fontWeight='bold' fontSize='12pt' dy='0.25em' textAnchor='middle'>
									%
								</text>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatDecimalsLess' defaultMessage='Show less deoimals' />}
				>
					<div>
						<IconButton
							onClick={() => this.onFormatDecimals(false)}
							disabled={!this.isNumberFormatAvailable()}
							style={buttonStyle}
						>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d='M12,17L15,20V18H21V16H15V14L12,17M9,5A3,3 0 0,1 12,8V11A3,3 0 0,1 9,14A3,3 0 0,1 6,11V8A3,3 0 0,1 9,5M9,7A1,1 0 0,0 8,8V11A1,1 0 0,0 9,12A1,1 0 0,0 10,11V8A1,1 0 0,0 9,7M4,12A1,1 0 0,1 5,13A1,1 0 0,1 4,14A1,1 0 0,1 3,13A1,1 0 0,1 4,12Z'
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatDecimalsMore' defaultMessage='Show more deoimals' />}
				>
					<div>
						<IconButton
							onClick={() => this.onFormatDecimals(true)}
							disabled={!this.isNumberFormatAvailable()}
							style={buttonStyle}
						>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d='M22,17L19,20V18H13V16H19V14L22,17M9,5A3,3 0 0,1 12,8V11A3,3 0 0,1 9,14A3,3 0 0,1 6,11V8A3,3 0 0,1 9,5M9,7A1,1 0 0,0 8,8V11A1,1 0 0,0 9,12A1,1 0 0,0 10,11V8A1,1 0 0,0 9,7M16,5A3,3 0 0,1 19,8V11A3,3 0 0,1 16,14A3,3 0 0,1 13,11V8A3,3 0 0,1 16,5M16,7A1,1 0 0,0 15,8V11A1,1 0 0,0 16,12A1,1 0 0,0 17,11V8A1,1 0 0,0 16,7M4,12A1,1 0 0,1 5,13A1,1 0 0,1 4,14A1,1 0 0,1 3,13A1,1 0 0,1 4,12Z'
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatDecimalsSelect' defaultMessage='Choose Numberformat' />}
				>
					<div>
						<IconButton
							onClick={this.onShowNumberFormat}
							disabled={!this.isNumberFormatAvailable()}
							style={{
								height: '34px', width: '70px', padding: '0px', marginTop: '1px'
							}}
						>
							<span
								style={{
									fontWeight: 'bold', fontSize: '10pt'
								}}
							>
								123
							</span>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d='M7,10L12,15L17,10H7Z'
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.showNumberFormat}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onCloseNumberFormat}
					onExited={this.handleFocus}
				>
					<MenuList>
						{numberFormats.map((format) => format.id[0] === '-' ? (<Divider key={format.id} />) : (<MenuItem
								dense
								key={format.id}
								onClick={() => this.onFormatNumberFormat(format)}
							>
								<div>
									<div
										style={{
											textAlign: 'left', display: 'inline-block', width: '125px'
										}}
									>
										{intl.formatMessage({ id: format.id }, {})}
									</div>
									<div
										style={{
											textAlign: 'right', display: 'inline-block', width: '125px'
										}}
									>
										{NumberFormatter.formatNumber(format.nf, format.value,
											format.type).formattedValue}
									</div>
								</div>
							</MenuItem>))}
					</MenuList>
				</Popover>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA', height: '40px', margin: '0px 8px 0px 0px'
					}}
				/>
				<Select
					style={{
						width: '120px', fontSize: '0.85rem'
					}}
					id='font-name'
					value={tf && tf.getFontName() ? tf.getFontName().getValue() : ''}
					onChange={(event) => this.onFormatFontName(event)}
					input={<Input name='font-name' id='font-name' />}
					className={classes.select}
					disabled={noChartFont}
					inputProps={{
						style: { paddingLeft: '5px', paddingTop: '6px' }
					}}
				>
					{/*<option style={optionStyle} hidden value="" />*/}
					<MenuItem dense value='Arial' key='s1'>
						Arial
					</MenuItem>
					<MenuItem dense value='Courier New' key='s2'>
						Courier New
					</MenuItem>
					<MenuItem dense value='Georgia' key='s3'>
						Georgia
					</MenuItem>
					<MenuItem dense value='Lucida Console' key='s4'>
						Lucida Console
					</MenuItem>
					<MenuItem dense value='Lucida Sans' key='s5'>
						Lucida Sans
					</MenuItem>
					<MenuItem dense value='Palatino' key='s6'>
						Palatino
					</MenuItem>
					<MenuItem dense value='Tahoma' key='s7'>
						Tahoma
					</MenuItem>
					<MenuItem dense value='Trebuchet MS' key='s8'>
						Trebuchet MS
					</MenuItem>
					<MenuItem dense value='Verdana' key='s10'>
						Verdana
					</MenuItem>
					{/* <option value="MetaPlusLF">MetaPlusLF</option> */}
				</Select>
				<Select
					style={{
						width: '50px', marginLeft: '10px', fontSize: '0.85rem'
					}}
					id='font-size'
					value={tf && tf.getFontSize() ? tf.getFontSize().getValue() : ''}
					onChange={(event) => this.onFormatFontSize(event)}
					input={<Input name='font-size' id='font-size' />}
					className={classes.select}
					disabled={noChartFont}
					inputProps={{
						style: { paddingLeft: '5px', paddingTop: '6px' }
					}}
				>
					<MenuItem dense value='6' key='fs1'>
						6
					</MenuItem>
					<MenuItem dense value='7' key='fs2'>
						7
					</MenuItem>
					<MenuItem dense value='8' key='fs3'>
						8
					</MenuItem>
					<MenuItem dense value='9' key='fs4'>
						9
					</MenuItem>
					<MenuItem dense value='10' key='fs5'>
						10
					</MenuItem>
					<MenuItem dense value='11' key='fs6'>
						11
					</MenuItem>
					<MenuItem dense value='12' key='fs7'>
						12
					</MenuItem>
					<MenuItem dense value='14' key='fs8'>
						14
					</MenuItem>
					<MenuItem dense value='18' key='fs9'>
						18
					</MenuItem>
					<MenuItem dense value='24' key='fs10'>
						24
					</MenuItem>
					<MenuItem dense value='36' key='fs11'>
						36
					</MenuItem>
					<MenuItem dense value='48' key='fs12'>
						48
					</MenuItem>
					<MenuItem dense value='60' key='fs13'>
						60
					</MenuItem>
					<MenuItem dense value='72' key='fs14'>
						72
					</MenuItem>
					<MenuItem dense value='96' key='fs15'>
						96
					</MenuItem>
					<MenuItem dense value='120' key='fs16'>
						120
					</MenuItem>
					<MenuItem dense value='144' key='fs17'>
						144
					</MenuItem>
				</Select>
				<Tooltip enterDelay={300} title={<FormattedMessage id='Tooltip.FormatBold' defaultMessage='Bold' />}>
					<div>
						<IconButton
							style={{
								marginLeft: '10px',
								fontSize: '16pt',
								width: '34px',
								height: '27px',
								margin: '5px 0px 0px 0px',
								borderRadius: '0%',
								backgroundColor: tf && tf.getFontStyle() && tf.getFontStyle()
									.getValue() & TextFormatAttributes.FontStyle.BOLD ? '#CCCCCC' : 'transparent'
							}}
							onClick={this.onFormatBold}
							disabled={(!this.props.cellSelected && !this.state.graphSelected) || noChartFont}
						>
							<BoldIcon fontSize='inherit' />
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatItalic' defaultMessage='Italic' />}
				>
					<div>
						<IconButton
							style={{
								width: '34px',
								height: '27px',
								margin: '5px 0px 0px 0px',
								fontSize: '16pt',
								borderRadius: '0%',
								backgroundColor: tf && tf.getFontStyle() && tf.getFontStyle()
									.getValue() & TextFormatAttributes.FontStyle.ITALIC ? '#CCCCCC' : 'transparent'
							}}
							onClick={this.onFormatItalic}
							disabled={(!this.props.cellSelected && !this.state.graphSelected) || noChartFont}
						>
							<ItalicIcon fontSize='inherit' />
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatFontColor' defaultMessage='Font Color' />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onShowFontColor}
							disabled={(!this.props.cellSelected && !this.state.graphSelected) || noChartFont}
						>
							<SvgIcon fontSize='inherit'>
								<path
									fill={tf && tf.getFontColor() ? tf.getFontColor().getValue() : ''}
									d='M0 20h24v4H0z'
								/>
								<path
									d='M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z' />
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.showFontColor}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onCloseFontColor}
					onExited={this.handleFocus}
				>
					<SketchPicker
						style={{
							boxShadow: 'none !important', backgroundColor: 'inherit'
						}}
						classes={{ 'sketch-picker': classes.default }}
						width={250}
						disableAlpha
						presetColors={this.getPresetColors(tf && tf.getFontColor() ? tf.getFontColor().getValue() : '')}
						color={tf && tf.getFontColor() ? tf.getFontColor().getValue() : ''}
						onChange={(color, event) => this.onFormatFontColor(color, event)}
					/>
				</Popover>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA', height: '40px', margin: '0px 8px'
					}}
				/>
				<CustomTooltip header='Tooltip.FormatHAlignHeader' message='Tooltip.FormatHAlignMessage'>
					<div>
						<IconButton
							style={{
								height: '34px', width: '50px', padding: '0px', fontSize: '16pt'
							}}
							onClick={this.onShowHAlign}
							disabled={(!this.props.cellSelected && !this.state.graphSelected) || this.isChartSelected()}
						>
							{tf && tf.getHorizontalAlignment() && tf.getHorizontalAlignment().getValue() === 3 ?
								(<FormatAlignJustify fontSize='inherit' />) : null}
							{tf && tf.getHorizontalAlignment() && tf.getHorizontalAlignment().getValue() === 0 ?
								(<FormatAlignLeft fontSize='inherit' />) : null}
							{tf && tf.getHorizontalAlignment() && tf.getHorizontalAlignment().getValue() === 1 ?
								(<FormatAlignCenter fontSize='inherit' />) : null}
							{tf && tf.getHorizontalAlignment() && tf.getHorizontalAlignment().getValue() === 2 ?
								(<FormatAlignRight fontSize='inherit' />) : null}
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d='M7,10L12,15L17,10H7Z'
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</CustomTooltip>
				<Popover
					open={this.state.showHAlign}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onCloseHAlign}
					onExited={this.handleFocus}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={4}
						cellHeight={30}
						spacing={0}
						style={{
							width: '160px', margin: '3px'
						}}
					>
						<GridListTile cols={1}>
							<CustomTooltip
								header='Tooltip.FormatHAlignStandardHeader'
								message='Tooltip.FormatHAlignStandardMessage'
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatHorizontalAlign(3)}>
									<FormatAlignJustify />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<CustomTooltip
								header='Tooltip.FormatHAlignLeftHeader'
								message='Tooltip.FormatHAlignLeftMessage'
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatHorizontalAlign(0)}>
									<FormatAlignLeft />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<CustomTooltip
								header='Tooltip.FormatHAlignCenterHeader'
								message='Tooltip.FormatHAlignCenterMessage'
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatHorizontalAlign(1)}>
									<FormatAlignCenter />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<CustomTooltip
								header='Tooltip.FormatHAlignRightHeader'
								message='Tooltip.FormatHAlignRightMessage'
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatHorizontalAlign(2)}>
									<FormatAlignRight />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
					</GridList>
				</Popover>
				<CustomTooltip header='Tooltip.FormatVAlignHeader' message='Tooltip.FormatVAlignMessage'>
					<div>
						<IconButton
							style={{
								height: '34px', width: '50px', padding: '0px', fontSize: '16pt'
							}}
							onClick={this.onShowVAlign}
							disabled={!this.props.cellSelected}
						>
							{tf && tf.getVerticalAlignment() && tf.getVerticalAlignment().getValue() === 0 ?
								(<VerticalAlignTop fontSize='inherit' />) : null}
							{tf && tf.getVerticalAlignment() && tf.getVerticalAlignment().getValue() === 1 ?
								(<VerticalAlignCenter fontSize='inherit' />) : null}
							{tf && tf.getVerticalAlignment() && tf.getVerticalAlignment().getValue() === 2 ?
								(<VerticalAlignBottom fontSize='inherit' />) : null}
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d='M7,10L12,15L17,10H7Z'
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</CustomTooltip>
				<Popover
					open={this.state.showVAlign}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onCloseVAlign}
					onExited={this.handleFocus}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={3}
						cellHeight={30}
						spacing={2}
						style={{
							width: '120px', margin: '3px'
						}}
					>
						<GridListTile cols={1}>
							<CustomTooltip
								header='Tooltip.FormatVAlignTopHeader'
								message='Tooltip.FormatVAlignTopMessage'
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatVerticalAlign(0)}>
									<VerticalAlignTop />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<CustomTooltip
								header='Tooltip.FormatVAlignCenterHeader'
								message='Tooltip.FormatVAlignCenterMessage'
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatVerticalAlign(1)}>
									<VerticalAlignCenter />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<CustomTooltip
								header='Tooltip.FormatVAlignBottomHeader'
								message='Tooltip.FormatVAlignBottomMessage'
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatVerticalAlign(2)}>
									<VerticalAlignBottom />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
					</GridList>
				</Popover>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA', height: '40px', margin: '0px 8px 0px 0px'
					}}
				/>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatFillColor' defaultMessage='Fill Color' />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onShowFillColor}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
						>
							<SvgIcon fontSize='inherit'>
								<path
									d='M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z' />
								<path
									fill={f && f.getFillColor() ? f.getFillColor().getValue() : 'none'}
									d='M0 20h24v4H0z'
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.showFillColor}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onExited={this.handleFocus}
					onClose={this.onCloseFillColor}
				>
					<SketchPicker
						disableAlpha={!this.isChartSelected()}
						width={250}
						color={this.fillColorToRGBAObject(f)}
						presetColors={this.getPresetColors(f && f.getFillColor() ? f.getFillColor().getValue() : '')}
						onChange={(color, event) => this.onFormatFillColor(color, event)}
					/>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatLine' defaultMessage='Line Format' />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onShowBorderColor}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
						>
							<SvgIcon fontSize='inherit'>
								<path
									d='M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96c.39-.39.39-1.02 0-1.41L18.37.29a.9959.9959 0 0 0-1.41 0L15 2.25 18.75 6l1.96-1.96z' />
								<path fill={this.getFormatBorderColor()} d='M0 20h24v4H0z' />
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.showBorderColor}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onExited={this.handleFocus}
					onClose={this.onCloseBorderColor}
				>
					<SketchPicker
						disableAlpha
						width={250}
						color={this.getFormatBorderColor()}
						onChange={(color, event) => this.onFormatBorderColor(color, event)}
						presetColors={this.getPresetColors(this.getFormatBorderColor())}
					/>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.FormatBorder' defaultMessage='Border Format' />}
				>
					<div>
						<IconButton style={buttonStyle} onClick={this.onShowBorder} disabled={!this.props.cellSelected}>
							<BorderAllIcon fontSize='inherit' />
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.borderOpen}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onBorderClose}
					onExited={this.handleFocus}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={6}
						cellHeight={30}
						spacing={2}
						style={{
							width: '240px', margin: '4px'
						}}
					>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('all')}>
								<BorderAllIcon fontSize='inherit' />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('inner')}>
								<BorderInnerIcon fontSize='inherit' />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('horizontal')}>
								<BorderHorizontalIcon fontSize='inherit' />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('vertical')}>
								<BorderVerticalIcon fontSize='inherit' />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('outer')}>
								<BorderOuterIcon fontSize='inherit' />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('left')}>
								<BorderLeftIcon fontSize='inherit' />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('top')}>
								<BorderTopIcon fontSize='inherit' />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('right')}>
								<BorderRightIcon fontSize='inherit' />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('bottom')}>
								<BorderBottomIcon fontSize='inherit' />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('clear')}>
								<BorderClearIcon fontSize='inherit' />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('outerfat')}>
								<SvgIcon>
									<path
										d='M 9 11 L 7 11 L 7 13 L 9 13 M 13 15 L 11 15 L 11 17 L 13 17 M 19 19 L 5 19 L 5 5 L 19 5 M 1.77 22.23 L 22.246 22.322 L 22.276 1.462 L 1.662 1.432 M 17 11 L 15 11 L 15 13 L 17 13 M 13 11 L 11 11 L 11 13 L 13 13 M 13 7 L 11 7 L 11 9 L 13 9 L 13 7 Z' />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('bottomfat')}>
								<SvgIcon>
									<path
										d='M 5 15 L 3 15 L 3 17 L 5 17 M 3.027 22.305 L 20.973 22.414 L 21 19 L 3.041 19 M 5 11 L 3 11 L 3 13 L 5 13 M 19 9 L 21 9 L 21 7 L 19 7 M 19 5 L 21 5 L 21 3 L 19 3 M 5 7 L 3 7 L 3 9 L 5 9 M 19 17 L 21 17 L 21 15 L 19 15 M 19 13 L 21 13 L 21 11 L 19 11 M 17 3 L 15 3 L 15 5 L 17 5 M 13 3 L 11 3 L 11 5 L 13 5 M 17 11 L 15 11 L 15 13 L 17 13 M 13 7 L 11 7 L 11 9 L 13 9 M 5 3 L 3 3 L 3 5 L 5 5 M 13 11 L 11 11 L 11 13 L 13 13 M 9 3 L 7 3 L 7 5 L 9 5 M 13 15 L 11 15 L 11 17 L 13 17 M 9 11 L 7 11 L 7 13 L 9 13 L 9 11 Z' />
								</SvgIcon>
							</IconButton>
						</GridListTile>
					</GridList>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.BorderStyle' defaultMessage='Border Style' />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onShowBorderStyle}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
						>
							<SvgIcon>
								<path
									d='M3,16H8V14H3V16M9.5,16H14.5V14H9.5V16M16,16H21V14H16V16M3,20H5V18H3V20M7,20H9V18H7V20M11,20H13V18H11V20M15,20H17V18H15V20M19,20H21V18H19V20M3,12H11V10H3V12M13,12H21V10H13V12M3,4V8H21V4H3Z' />
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.showBorderStyle}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onExited={this.handleFocus}
					onClose={this.onCloseBorderStyle}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={1}
						cellHeight={22}
						spacing={4}
						style={{
							width: '110px', margin: '1px'
						}}
					>
						<GridListTile
							cols={1}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='BorderStyle' defaultMessage='Border Style' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.NONE)}
							>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderStyle === FormatAttributes.LineStyle.NONE ?
										<path stroke='none' fill={JSG.theme.selectionback}
											  d='M1,1 H99 V24 H-99 V-24' /> : null}
									<text
										x='50'
										y='14'
										fontWeight='normal'
										fontSize='9pt'
										dy='0.25em'
										textAnchor='middle'
									>
										{intl.formatMessage({ id: 'None' }, {})}
									</text>
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.SOLID)}
							>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									stroke='currentColor'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderStyle === FormatAttributes.LineStyle.SOLID ?
										<path stroke='none' fill={JSG.theme.selectionback}
											  d='M1,1 H99 V24 H-99 V-24' /> : null}
									<path d='M5,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.DOT)}
							>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									stroke='currentColor'
									strokeDasharray='1,2'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderStyle === FormatAttributes.LineStyle.DOT ?
										<path stroke='none' fill={JSG.theme.selectionback}
											  d='M1,1 H98 V24 H-98 V-24' /> : null}
									<path d='M5,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.DASH)}
							>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									stroke='currentColor'
									strokeDasharray='5,5'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderStyle === FormatAttributes.LineStyle.DASH ?
										<path stroke='none' fill={JSG.theme.selectionback}
											  d='M1,1 H98 V24 H-98 V-24' /> : null}
									<path d='M5,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.DASHDOT)}
							>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									stroke='currentColor'
									strokeDasharray='5,5,1,5'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderStyle === FormatAttributes.LineStyle.DASHDOT ?
										<path stroke='none' fill={JSG.theme.selectionback}
											  d='M1,1 H98 V24 H-98 V-24' /> : null}
									<path d='M5,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.DASHDOTDOT)}
							>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									stroke='currentColor'
									strokeDasharray='5,5,1,2,1,5'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderStyle === FormatAttributes.LineStyle.DASHDOTDOT ?
										<path stroke='none' fill={JSG.theme.selectionback}
											  d='M1,1 H98 V24 H-98 V-24' /> : null}
									<path d='M5,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={1}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='BorderWidth' defaultMessage='Border Width' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(-1)}>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderWidth === -1 || selBorderWidth === 1 ?
										<path stroke='none' fill={JSG.theme.selectionback}
											  d='M1,1 H99 V24 H-99 V-24' /> : null}
									<text x='35' y='14' fontWeight='normal' fontSize='8pt' dy='0.25em' textAnchor='end'>
										1 px
									</text>
									<path stroke='currentColor' d='M42,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(25)}>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderWidth === 25 ? <path stroke='none' fill={JSG.theme.selectionback}
																   d='M1,1 H99 V24 H-99 V-24' /> : null}
									<text x='35' y='14' fontWeight='normal' fontSize='8pt' dy='0.25em' textAnchor='end'>
										1/4 mm
									</text>
									<path stroke='currentColor' strokeWidth='0.25mm' d='M42,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(50)}>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderWidth === 50 ? <path stroke='none' fill={JSG.theme.selectionback}
																   d='M1,1 H99 V24 H-99 V-24' /> : null}
									<text x='35' y='14' fontWeight='normal' fontSize='8pt' dy='0.25em' textAnchor='end'>
										1/2 mm
									</text>
									<path stroke='currentColor' strokeWidth='0.5mm' d='M42,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(75)}>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderWidth === 75 ? <path stroke='none' fill={JSG.theme.selectionback}
																   d='M1,1 H99 V24 H-99 V-24' /> : null}
									<text x='35' y='14' fontWeight='normal' fontSize='8pt' dy='0.25em' textAnchor='end'>
										3/4 mm
									</text>
									<path stroke='currentColor' strokeWidth='0.75mm' d='M42,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(100)}>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderWidth === 100 ? <path stroke='none' fill={JSG.theme.selectionback}
																	d='M1,1 H99 V24 H-99 V-24' /> : null}
									<text x='35' y='14' fontWeight='normal' fontSize='8pt' dy='0.25em' textAnchor='end'>
										1 mm
									</text>
									<path stroke='currentColor' strokeWidth='1mm' d='M42,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(200)}>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderWidth === 200 ? <path stroke='none' fill={JSG.theme.selectionback}
																	d='M1,1 H99 V24 H-99 V-24' /> : null}
									<text x='35' y='14' fontWeight='normal' fontSize='8pt' dy='0.25em' textAnchor='end'>
										2 mm
									</text>
									<path stroke='currentColor' strokeWidth='2mm' d='M42,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(300)}>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderWidth === 300 ? <path stroke='none' fill={JSG.theme.selectionback}
																	d='M1,1 H99 V24 H-99 V-24' /> : null}
									<text x='35' y='14' fontWeight='normal' fontSize='8pt' dy='0.25em' textAnchor='end'>
										3 mm
									</text>
									<path stroke='currentColor' strokeWidth='3mm' d='M42,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(400)}>
								<svg
									width='100'
									height='28'
									viewBox='0 0 100 28'
									fill='currentColor'
									xmlns='http://www.w3.org/2000/svg'
								>
									{selBorderWidth === 400 ? <path stroke='none' fill={JSG.theme.selectionback}
																	d='M1,1 H99 V24 H-99 V-24' /> : null}
									<text x='35' y='14' fontWeight='normal' fontSize='8pt' dy='0.25em' textAnchor='end'>
										4 mm
									</text>
									<path stroke='currentColor' strokeWidth='4mm' d='M42,14 L95,14' />
								</svg>
							</IconButton>
						</GridListTile>
					</GridList>
				</Popover>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA', height: '40px', margin: '0px 8px'
					}}
				/>
				{/*<Tooltip*/}
				{/*	enterDelay={300}*/}
				{/*	title={<FormattedMessage id="Tooltip.PasteFunction" defaultMessage="PasteFunction" />}*/}
				{/*>*/}
				{/*	<div>*/}
				{/*		<IconButton*/}
				{/*			style={buttonStyle}*/}
				{/*			onClick={(e) => this.onPasteFunction(e)}*/}
				{/*			disabled={!this.props.cellSelected}*/}
				{/*		>*/}
				{/*			<SvgIcon>*/}
				{/*				<text*/}
				{/*					x="10"*/}
				{/*					y="12"*/}
				{/*					fontStyle="italic"*/}
				{/*					fontWeight="bold"*/}
				{/*					fontSize="12pt"*/}
				{/*					dy="0.25em"*/}
				{/*					textAnchor="end"*/}
				{/*				>*/}
				{/*					f*/}
				{/*				</text>*/}
				{/*				<text x="12" y="12" fontWeight="bold" fontSize="8pt" dy="0.25em" textAnchor="left">*/}
				{/*					(x)*/}
				{/*				</text>*/}
				{/*			</SvgIcon>*/}
				{/*		</IconButton>*/}
				{/*	</div>*/}
				{/*</Tooltip>*/}
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.InsertStreamFunction'
											 defaultMessage='Insert Stream Function' />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={(e) => this.onStreamFunction(e)}
							disabled={!this.props.cellSelected}
						>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d='M16.79,23C16.37,22.83 16.07,22.45 16,22C15.95,21.74 16,21.56 16.4,20.84C17.9,18.14 18.67,15.09 18.63,12C18.67,9 17.94,6.07 16.5,3.44C16.29,3 16.1,2.58 15.94,2.13C16,1.75 16.19,1.4 16.5,1.19C16.95,0.95 17.5,1 17.91,1.28C18.19,1.64 18.43,2 18.63,2.42C19.71,4.5 20.44,6.7 20.8,9C21.03,10.81 21.06,12.65 20.89,14.47C20.58,16.81 19.89,19.07 18.83,21.18C18.19,22.46 17.83,23 17.45,23C17.37,23 17.28,23 17.2,23C17.06,23 16.93,23 16.79,23V23M12.43,20.79C11.86,20.63 11.5,20.05 11.62,19.47C11.62,19.35 11.93,18.8 12.21,18.24C13.39,15.97 13.9,13.41 13.67,10.86C13.53,9.03 13,7.25 12.13,5.64C11.5,4.38 11.46,4.18 11.83,3.64C12.27,3.15 13,3.08 13.54,3.5C14.26,4.56 14.83,5.72 15.25,6.94C16.53,10.73 16.33,14.86 14.69,18.5C13.85,20.39 13.26,21 12.43,20.74V20.79M7.93,18.56C7.57,18.4 7.3,18.08 7.2,17.7C7.2,17.5 7.2,17.24 7.65,16.44C9.14,13.74 9.14,10.46 7.65,7.76C7,6.5 7,6.24 7.53,5.76C7.72,5.54 8,5.43 8.3,5.47C8.94,5.47 9.3,5.78 9.84,6.91C10.69,8.47 11.13,10.22 11.12,12C11.16,13.81 10.72,15.61 9.85,17.2C9.31,18.25 9.04,18.5 8.5,18.59C8.31,18.61 8.11,18.59 7.93,18.5V18.56M3.72,16.43C3.39,16.27 3.13,16 3,15.65C2.9,15.3 3,15 3.4,14.36C3.9,13.68 4.14,12.84 4.09,12C4.16,11.15 3.93,10.31 3.44,9.61C3.27,9.36 3.13,9.09 3,8.82C2.89,8.19 3.31,7.59 4,7.47C4.54,7.37 4.92,7.6 5.42,8.36C6.87,10.57 6.87,13.42 5.42,15.63C4.91,16.4 4.33,16.63 3.73,16.43H3.72Z'
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
			<Tooltip
				enterDelay={300}
				title={<FormattedMessage id='Tooltip.ShowReferences'
										 defaultMessage='Visualize Cell Dependencies' />}
			>
				<div>
					<IconButton
						style={buttonStyle}
						onClick={(e) => this.onShowDependencies(e)}
						disabled={!this.props.cellSelected}
					>
						<SvgIcon>
							<path
								// eslint-disable-next-line max-len
								d="M12 2L16 6H13V13.85L19.53 17.61L21 15.03L22.5 20.5L17 21.96L18.53 19.35L12 15.58L5.47 19.35L7 21.96L1.5 20.5L3 15.03L4.47 17.61L11 13.85V6H8L12 2M21 5H19V3H21V5M22 10V12H18V10H19V8H18V6H21V10H22Z"
							/>
						</SvgIcon>
					</IconButton>
				</div>
			</Tooltip>
				<Popover
					open={this.state.showDependencies}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onCloseDependencies}
					onExited={this.handleFocus}
				>
					<MenuList>
						<MenuItem
							dense
							onClick={() => this.onShowPredecessors()}
						>
							<ListItemText
								primary={<FormattedMessage id="ShowPredecessors" defaultMessage="Show Predecessors" />}
							/>
						</MenuItem>
						<MenuItem
							dense
							onClick={() => this.onShowDependants()}
						>
							<ListItemText
								primary={<FormattedMessage id="ShowDependants" defaultMessage="Show depending Cells" />}
							/>
						</MenuItem>
						<Divider />
						<MenuItem
							dense
							onClick={() => this.onRemoveArrows()}
						>
							<ListItemText
								primary={<FormattedMessage id="RemoveCellInfo" defaultMessage="Remove Arrows" />}
							/>
						</MenuItem>
					</MenuList>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.EditNames' defaultMessage='Edit Names' />}
				>
					<div>
						<IconButton style={buttonStyle} onClick={(e) => this.onEditNames(e)}>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d='M21.4 11.6L12.4 2.6C12 2.2 11.5 2 11 2H4C2.9 2 2 2.9 2 4V11C2 11.5 2.2 12 2.6 12.4L11.6 21.4C12 21.8 12.5 22 13 22C13.5 22 14 21.8 14.4 21.4L21.4 14.4C21.8 14 22 13.5 22 13C22 12.5 21.8 12 21.4 11.6M13 20L4 11V4H11L20 13M6.5 5C7.3 5 8 5.7 8 6.5S7.3 8 6.5 8 5 7.3 5 6.5 5.7 5 6.5 5M10.1 8.9L11.5 7.5L17 13L15.6 14.4L10.1 8.9M7.6 11.4L9 10L13 14L11.6 15.4L7.6 11.4Z'
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA', height: '40px', margin: '0px 8px'
					}}
				/>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.InsertTool' defaultMessage='Insert Tool' />}
				>
					<div>
						<IconButton style={buttonStyle} onClick={this.onShowTools}>
							<SvgIcon
								stroke='currentColor'
								strokeWidth='2px'
							>
								<rect fillOpacity='0.7' fill='currentColor' x='2' y='3' width='12' height='12' />
								<circle fill='white' cx='14' cy='15' r={7} />
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.toolsOpen}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'right', vertical: 'top' }}
					transitionDuration={{ exit: 0 }}
					onExited={this.handleFocus}
					onClose={this.onToolsClose}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={6}
						cellHeight={35}
						spacing={2}
						style={{
							width: '240px', margin: '2px'
						}}
					>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='ToolsStandard' defaultMessage='Standard' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreateLine}>
								<SvgIcon>
									<path d='M3.5 22 L22 3.5 L20.5 2 L2 20.5 Z' />
								</SvgIcon>
								{/* <ToolLineIcon /> */}
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreateArrow}>
								<ToolArrowIcon />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreateRectangle}>
								<ToolRectangleIcon />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreateEllipse}>
								<ToolEllipseIcon />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreateText}>
								<ToolTextIcon />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreatePolyline}>
								<ToolPolylineIcon />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arc')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 32'>
									<path
										fill='none'
										strokeWidth='2.5px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M24,12 C24,5.42 18.58,0 12,0 C5.42,0 0,5.42 0,12 C0,18.58 5.42,24 12,24'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arcclosed')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 32'>
									<path
										fill='none'
										strokeWidth='2.5px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M24,12 C24,5.42 18.58,0 12,0 C5.42,0 0,5.42 0,12 C0,18.58 5.42,24 12,24 C12,24 24,12 24,12 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('pie')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 32'>
									<path
										fill='none'
										strokeWidth='2.5px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M24,12 C24,5.42 18.58,0 12,0 C5.42,0 0,5.42 0,12 C0,18.58 5.42,24 12,24 C12,24 12,12 12,12 C12,12 24,12 24,12 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='ToolsRectangles' defaultMessage='Rectangles' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('roundRect')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M6.6,0 C8.8,0 13.2,0 21.4,0 C25.03,0 28,2.97 28,6.6 C28,8.8 28,13.2 28,15.4 C28,19.03 25.03,22 21.4,22 C13.2,22 8.8,22 6.6,22 C2.97,22 0,19.03 0,15.4 C0,13.2 0,8.8 0,6.6 C0,2.97 2.97,0 6.6,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('roundRectCornerCut')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M0,0 C4.4,0 13.2,0 17.01,0 C23.06,0 28.01,4.95 28.01,11 C28.01,8.8 28.01,17.6 28.01,22 C17.6,22 4.4,22 0,22 C0,17.6 0,4.4 0,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('roundRectCornerCutSame')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M11,0 C8.8,0 13.2,0 17,0 C23.05,0 28,4.95 28,11 C28,8.8 28,13.2 28,22 C28,22 28,22 28,22 C13.2,22 8.8,22 0,22 C0,22 0,22 0,22 C0,13.2 0,8.8 0,11 C0,4.95 4.95,0 11,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('roundRectCornerCutDiagonal')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M0,0 C8.8,0 13.2,0 17.01,0 C23.06,0 28.01,4.95 28.01,11 C28.01,8.8 28.01,13.2 28.01,22 C28.01,22 28.01,22 28.01,22 C13.2,22 8.8,22 11,22 C4.95,22 0,17.05 0,11 C0,13.2 0,8.8 0,0 C0,0 0,0 0,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('rectCornerCut')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M0,0 L0,22 L28.01,22 L28.01,8.14 L19.87,0 L0,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('rectCornerCutSame')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M8.14,0 L0,8.14 L0,22 L0,22 L28.01,22 L28.01,22 L28.01,8.14 L19.87,0 L8.14,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('rectCornerCutDiagonal')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M8.2,0 L0,8.2 L0,22 L0,22 L19.8,22 L28,13.8 L28,0 L28,0 L8.2,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('trapezoidalTop')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M4.4,0 L23.6,0 L28,22 L0,22 L4.4,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('trapezoidalBottom')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M0,0 L28.01,0 L23.61,22 L4.4,22 L0,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('parallelogrammTopToRight')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M5.6,0 L28.01,0 L22.41,22 L0,22 L5.6,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('parallelogrammLeftToBottom')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M0,4.4 L28.01,0 L28.01,17.6 L0,22 L0,4.4 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='ToolsStars' defaultMessage='Stars' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('star3')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d='M12,9.5L13.2,13.5L16,16.5L12,15.6L7.9,16.5L10.7,13.5L12,9.5M12,2.6L9,12.4L2,19.9L12,17.6L22,20L15,12.5L12,2.6Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('star4')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d='M12,6.7L13.45,10.55L17.3,12L13.45,13.45L12,17.3L10.55,13.45L6.7,12L10.55,10.55L12,6.7M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('star5')}>
								<ToolStar />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('star6')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 32'>
									<path
										fill='none'
										strokeWidth='2px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M12,0 L14.4,7.82 L22.44,6 L16.8,12 L22.44,18 L14.4,16.18 L12,24 L9.6,16.18 L1.56,18 L7.2,12 L1.56,6 L9.6,7.82 L12,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('star8')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 32'>
									<path
										fill='none'
										strokeWidth='2px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M12,0 L13.82,7.58 L20.52,3.48 L16.42,10.18 L24,12 L16.42,13.82 L20.52,20.52 L13.82,16.42 L12,24 L10.18,16.42 L3.48,20.52 L7.58,13.82 L0,12 L7.58,10.18 L3.48,3.48 L10.18,7.58 L12,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='ToolsArrows' defaultMessage='Arrows' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowLeft')}>
								<SvgIcon>
									<path d='M13,22L3,12L13,2V8H21V16H13V22M6,12L11,17V14H19V10H11V7L6,12Z' />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowRight')}>
								<SvgIcon>
									<path d='M11,16H3V8H11V2L21,12L11,22V16M13,7V10H5V14H13V17L18,12L13,7Z' />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowUp')}>
								<SvgIcon>
									<path d='M16,13V21H8V13H2L12,3L22,13H16M7,11H10V19H14V11H17L12,6L7,11Z' />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowDown')}>
								<SvgIcon>
									<path d='M22,11L12,21L2,11H8V3H16V11H22M12,18L17,13H14V5H10V13H7L12,18Z' />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowDblHorz')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d='M14,16V22L24,12L14,2V8H10V2L0,12L10,22V16H14M8,14V17L3,12L8,7V10H16V7L21,12L16,17V14H8Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowDblVert')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d='M16,10H22L12,0L2,10H8V14H2L12,24L22,14H16V10M14,16H17L12,21L7,16H10V8H7L12,3L17,8H14V16Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowTopLeft')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 32'>
									<path
										fill='none'
										strokeWidth='2px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										d='M16.8,4.8 L14.4,4.8 L19.2,0 L24,4.8 L21.6,4.8 L21.6,21.6 L4.8,21.6 L4.8,24 L0,19.2 L4.8,14.4 L4.8,16.8 L16.8,16.8 L16.8,4.8 Z'
										// eslint-disable-next-line max-len
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowTopRight')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 32'>
									<path
										fill='none'
										strokeWidth='2px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M7.2,4.8 L9.6,4.8 L4.8,0 L0,4.8 L2.4,4.8 L2.4,21.6 L19.2,21.6 L19.2,24 L24,19.2 L19.2,14.4 L19.2,16.8 L7.2,16.8 L7.2,4.8 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='ToolsLegends' defaultMessage='Legends' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('callout')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M0,0 L28,0 L28,22 L9.8,22 L2.8,30.8 L4.2,22 L0,22 L0,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('calloutline')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M0,0 L28,0 L28,22 L7,22 L-0.28,34.32 L7,22 L0,22 L0,0 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('calloutroundrect')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M0,4.4 C0,1.98 1.98,0 4.4,0 C4.4,0 23.6,0 23.6,0 C26.02,0 28,1.98 28,4.4 C28,4.4 28,17.6 28,17.6 C28,20.02 26.02,22 23.6,22 C23.6,22 11.2,22 11.2,22 C11.2,22 2.8,30.8 2.8,30.8 C2.8,30.8 5.6,22 5.6,22 C5.6,22 4.4,22 4.4,22 C1.98,22 0,20.02 0,17.6 C0,17.6 0,4.4 0,4.4 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('calloutroundrectline')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M0,4.4 C0,1.98 1.98,0 4.4,0 C4.4,0 23.6,0 23.6,0 C26.02,0 28,1.98 28,4.4 C28,4.4 28,17.6 28,17.6 C28,20.02 26.02,22 23.6,22 C23.6,22 8.4,22 8.4,22 C8.4,22 2.8,30.8 2.8,30.8 C2.8,30.8 8.4,22 8.4,22 C8.4,22 4.4,22 4.4,22 C1.98,22 0,20.02 0,17.6 C0,17.6 0,4.4 0,4.4 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('calloutround')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M11.08,21.76 C18.08,22.93 25.15,19.71 27.33,14.36 C29.52,9.01 26.14,3.15 19.58,0.91 C13.02,-1.33 5.28,0.72 1.78,5.63 C-1.71,10.53 0.11,16.79 5.98,20.01 C5.98,20.01 3.36,30.36 3.36,30.36 C3.36,30.36 11.08,21.76 11.08,21.76 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('calloutroundline')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox='-5 -5 32 38'>
									<path
										fill='none'
										strokeWidth='3px'
										strokeLinejoin='miter'
										strokeMiterlimit='5'
										// eslint-disable-next-line max-len
										d='M8.31,21.05 C15.33,23.5 23.67,20.98 26.79,15.47 C29.91,9.95 26.7,3.4 19.69,0.95 C12.67,-1.5 4.33,1.02 1.21,6.53 C-1.91,12.05 1.29,18.6 8.31,21.05 C8.31,21.05 2.8,30.8 2.8,30.8 C2.8,30.8 8.31,21.05 8.31,21.05 Z'
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='ToolsControls' defaultMessage='Controls' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='Tooltip.InsertButton' defaultMessage='Create Push Button' />}
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateControl('button')}>
									<SvgIcon>
										<rect stroke="none" x="2" y="5" width="22" height="14"/>
										<text fill="white" textAnchor="middle" fontSize="6pt" dominantBaseline="central" x="12" y="12">OK</text>
									</SvgIcon>
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='Tooltip.InsertCheckbox' defaultMessage='Create Checkbox Control' />}
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateControl('checkbox')}>
									<SvgIcon>
										<rect fill="none" strokeWidth="3" stroke="#888888" x="4" y="4" width="16" height="16"/>
										<path fill="none" strokeWidth="2" stroke="#888888" d="M7 12 L12 16 L17 7"/>
									</SvgIcon>
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='Tooltip.InsertSlider' defaultMessage='Create Slider Control' />}
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateControl('slider')}>
									<SvgIcon>
										<path fill="none" strokeWidth="1.5" stroke="#888888" d="M2 10 h20 v4 h-20 z"/>
										<path fill="none" stroke="#888888" d="M7 10 v4"/>
										<path fill="none" stroke="#888888" d="M12 10 v4"/>
										<path fill="none" stroke="#888888" d="M17 10 v4"/>
										<path fill="888888" stroke="#888888" d="M10 6 L8 9 L6 6z"/>
									</SvgIcon>
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='Tooltip.InsertKnob' defaultMessage='Create Knob Control' />}
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateControl('knob')}>
									<SvgIcon>
										<path
											// eslint-disable-next-line max-len
											d="M22,15C22,17.6 20.8,19.9 18.9,21.3L18.4,20.8L16.3,18.7L17.7,17.3L18.9,18.5C19.4,17.8 19.8,16.9 19.9,16H18V14H19.9C19.7,13.1 19.4,12.3 18.9,11.5L17.7,12.7L16.3,11.3L17.5,10.1C16.8,9.6 15.9,9.2 15,9.1V11H13V9.1C12.1,9.3 11.3,9.6 10.5,10.1L13.5,13.1C13.7,13.1 13.8,13 14,13A2,2 0 0,1 16,15A2,2 0 0,1 14,17A2,2 0 0,1 12,15C12,14.8 12,14.7 12.1,14.5L9.1,11.5C8.6,12.2 8.2,13.1 8.1,14H10V16H8.1C8.3,16.9 8.6,17.7 9.1,18.5L10.3,17.3L11.7,18.7L9.1,21.3C7.2,19.9 6,17.6 6,15A8,8 0 0,1 14,7A8,8 0 0,1 22,15"
										/>
									</SvgIcon>
								</IconButton>
							</Tooltip>
						</GridListTile>
					</GridList>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.InsertChart' defaultMessage='Show Chart Types' />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onShowCharts}
							disabled={!this.props.cellSelected && !this.isChartSelected() && !this.state.treeSelected}
						>
							<SvgIcon>
								<path d='M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z' />
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.chartsOpen}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'right', vertical: 'top' }}
					onExited={this.handleFocus}
					onClose={this.onChartsClose}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={6}
						cellHeight={40}
						spacing={4}
						style={{
							width: '270px', margin: '1px'
						}}
					>
						<GridListTile
							cols={6}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='StreamChart.TypesColumn' defaultMessage='Bar and Column Charts' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Column' defaultMessage='Column' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('column')}
								>
									<img alt='' src='images/charts/column.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.ColumnStacked'
														 defaultMessage='Column Stacked' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('columnstacked')}
								>
									<img alt='' src='images/charts/columnstacked.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage
									id='StreamChart.ColumnStacked100'
									defaultMessage='Column Stacked 100'
								/>}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('columnstacked100')}
								>
									<img alt='' src='images/charts/columnstacked100.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Bar' defaultMessage='Bar' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('bar')}
								>
									<img alt='' src='images/charts/bar.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.BarStacked' defaultMessage='Bar Stacked' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('barstacked')}
								>
									<img alt='' src='images/charts/barstacked.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.BarStacked100'
														 defaultMessage='Bar Stacked 100' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('barstacked100')}
								>
									<img alt='' src='images/charts/barstacked100.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='StreamChart.TypesLine' defaultMessage='Line Charts' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Line' defaultMessage='Line' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('line')}
								>
									<img alt='' src='images/charts/line.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.LineStacked' defaultMessage='Line Stacked' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('linestacked')}
								>
									<img alt='' src='images/charts/linestacked.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage
									id='StreamChart.LineStacked100'
									defaultMessage='Line Stacked 100'
								/>}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('linestacked100')}
								>
									<img alt='' src='images/charts/linestacked100.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Step' defaultMessage='Line Step' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('linestep')}
								>
									<img alt='' src='images/charts/linestep.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Profile' defaultMessage='Profile' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('profile')}
								>
									<img alt='' src='images/charts/profile.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='StreamChart.TypesArea' defaultMessage='Area Charts' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Area' defaultMessage='Area' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('area')}
								>
									<img alt='' src='images/charts/area.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.AreaStacked' defaultMessage='Area Stacked' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('areastacked')}
								>
									<img alt='' src='images/charts/areastacked.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage
									id='StreamChart.AreaStacked100'
									defaultMessage='Area Stacked 100'
								/>}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('areastacked100')}
								>
									<img alt='' src='images/charts/areastacked100.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='StreamChart.TypesXY' defaultMessage='XY Charts' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Scatter' defaultMessage='Scatter' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('scattermarker')}
								>
									<img alt='' src='images/charts/scattermarker.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage
									id='StreamChart.ScatterLineMarker'
									defaultMessage='Scatter with Line and Markers'
								/>}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('scatterlinemarker')}
								>
									<img alt='' src='images/charts/scatterlinemarker.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.ScatterLine'
														 defaultMessage='Scatter with Line' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('scatterline')}
								>
									<img alt='' src='images/charts/scatterline.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Bubble' defaultMessage='Bubble' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('bubble')}
								>
									<img alt='' src='images/charts/bubble.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Heatmap' defaultMessage='Heatmap' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('heatmap')}
								>
									<img alt='' src='images/charts/heatmap.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor, color: 'white', fontSize: '9pt', padding: '3px'
								}}
							>
								<FormattedMessage id='StreamChart.TypesPie' defaultMessage='Pie and Doughnut Charts' />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Pie' defaultMessage='Pie' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('pie')}
								>
									<img alt='' src='images/charts/pie.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.HalfPie' defaultMessage='Half Pie' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('piehalf')}
								>
									<img alt='' src='images/charts/halfpie.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.3dPie' defaultMessage='3D Pie' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('pie3d')}
								>
									<img alt='' src='images/charts/pie3d.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id='StreamChart.Doughnut' defaultMessage='Doughnut' />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('doughnut')}
								>
									<img alt='' src='images/charts/doughnut.png' />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<ChartExtensions titleColor={gridTitleColor} onCreatePlot={this.onCreatePlot} />
					</GridList>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Tooltip.SelectShapes' defaultMessage='Select Shapes' />}
				>
					<div>
						<IconButton onClick={this.onSelectShapes} style={buttonStyle}>
							<SvgIcon>
								<g>
									<path
										d='M11,17V19H9V17H11M7,17V19H5V17H7M19,9V11H17V9H19M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M7,13V15H5V13H7M7,9V11H5V9H7Z' />
									<path
										transform='translate(10 10) scale(0.6 0.6)'
										d='M10.07,14.27C10.57,14.03 11.16,14.25 11.4,14.75L13.7,19.74L15.5,18.89L13.19,13.91C12.95,13.41 13.17,12.81 13.67,12.58L13.95,12.5L16.25,12.05L8,5.12V15.9L9.82,14.43L10.07,14.27M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.47,2.09 7.64,2.23L7.65,2.22L19.14,11.86C19.57,12.22 19.62,12.85 19.27,13.27C19.12,13.45 18.91,13.57 18.7,13.61L15.54,14.23L17.74,18.96C18,19.46 17.76,20.05 17.26,20.28L13.64,21.97Z'
									/>
								</g>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA', height: '40px', margin: '0px 8px'
					}}
				/>
				<WidthHelper width={1250}>
					<div
						style={{
							right: '10px', position: 'absolute'
						}}
					>
						<CustomTooltip header='Tooltip.ZoomHeader' message='Tooltip.ZoomMessage'>
							<IconButton style={buttonStyle} aria-label='Zoom' onClick={this.onShowZoom}>
								<ZoomIcon fontSize='inherit' />
							</IconButton>
						</CustomTooltip>
						<Tooltip
							enterDelay={300}
							title={<FormattedMessage id='Tooltip.OutboxShow' defaultMessage='Show Outbox' />}
						>
							<IconButton style={buttonStyle} aria-label='Zoom' onClick={this.onShowOutbox}>
								<MessageIcon fontSize='inherit' />
							</IconButton>
						</Tooltip>
						<Tooltip
							enterDelay={300}
							title={<FormattedMessage id='Tooltip.ArrangeSheets'
													 defaultMessage='Arrange StreamSheets' />}
						>
							<IconButton style={buttonStyle} aria-label='Zoom' onClick={this.onAlignSheets}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d='M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3'
									/>
								</SvgIcon>
							</IconButton>
						</Tooltip>
						<ToolbarExtensions />
					</div>
				</WidthHelper>
				<Popover
					open={this.state.zoomOpen}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'right', vertical: 'top' }}
					onClose={this.onZoomClose}
					onExited={this.handleFocus}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={6}
						cellHeight={40}
						spacing={2}
						style={{
							width: '360px', margin: '0px'
						}}
					>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(50)}
								variant='outlined'
								style={{
									minWidth: '50px', padding: '0px', margin: '4px'
								}}
							>
								50%
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(75)}
								variant='outlined'
								style={{
									minWidth: '50px', padding: '0px', margin: '4px'
								}}
							>
								75%
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(100)}
								variant='outlined'
								style={{
									minWidth: '50px', padding: '0px', margin: '4px'
								}}
							>
								100%
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(125)}
								variant='outlined'
								style={{
									minWidth: '50px', padding: '0px', margin: '4px'
								}}
							>
								125%
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(150)}
								variant='outlined'
								style={{
									minWidth: '50px', padding: '0px', margin: '4px'
								}}
							>
								150%
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(200)}
								variant='outlined'
								style={{
									minWidth: '50px', padding: '0px', margin: '4px'
								}}
							>
								200%
							</Button>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '60px'
							}}
						>
							<Slider
								step={5}
								value={graphManager.getZoom() * 100}
								min={50}
								max={200}
								onChange={this.handleZoom}
								marks={marks}
								style={{
									margin: '14px 0px 0px 20px', width: '90%'
								}}
							/>
						</GridListTile>
					</GridList>
				</Popover>
			</AppBar>);
	}
}

function mapStateToProps(state) {
	return {
		cellSelected: state.jsgState.cellSelected,
		showDeleteCellContentDialog: state.appState.showDeleteCellContentDialog,
		showInsertCellContentDialog: state.appState.showInsertCellContentDialog,
		showFormatCellsDialog: state.appState.showFormatCellsDialog,
		showPasteFunctionsDialog: state.appState.showPasteFunctionsDialog,
		showEditNamesDialog: state.appState.showEditNamesDialog,
		experimental: state.appState.experimental,
		viewMode: state.appState.viewMode,
		canUndo: state.jsgState.canUndo,
		canRedo: state.jsgState.canRedo,
		machineId: state.monitor.machine.id
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles, { withTheme: true })(connect(mapStateToProps, mapDispatchToProps)(CanvasToolBar));
