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
/* eslint-disable */
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Divider from '@material-ui/core/Divider';
import Popover from '@material-ui/core/Popover';
import { withStyles } from '@material-ui/core/styles';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Paper from '@material-ui/core/Paper';
import DeleteIcon from '@material-ui/icons/Delete';
import LoopIcon from '@material-ui/icons/Loop';
import ClearLoop from '@material-ui/icons/RemoveCircleOutline';
import SetReplaceKey from '@material-ui/icons/FindReplace';
import DeleteAllIcon from '@material-ui/icons/DeleteSweep';
import InsertCells from '@material-ui/icons/FormatIndentIncrease';
import JSG from '@cedalo/jsg-ui';
import { graphManager } from '../../GraphManager';
import * as Actions from '../../actions/actions';

const styles = {
	menuItem: {
		transition: 'none',
	},
};

class TreeContextComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			context: 'false',
			selected: 'false',
			selectedPath: null,
			type: '',
			top: '0px',
			left: '0px',
			anchorEl: null,
			sheetId: null,
		};
	}

	componentDidMount() {
		document.addEventListener('click', this.handleClick);
		// console.log(JSG.TreeInteraction.TREE_SHOW_CONTEXT_MENU_NOTIFICATION);
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.TreeInteraction.TREE_SHOW_CONTEXT_MENU_NOTIFICATION, 'onContextMenu',
		);

		/* eslint-disable react/no-did-mount-set-state */
		this.setState({
			context: false,
		});

		/* eslint-enable react/no-did-mount-set-state */
	}

	componentWillUnmount() {
		document.removeEventListener('click', this.handleClick);
		JSG.NotificationCenter.getInstance().unregister(
			this,
			JSG.TreeInteraction.TREE_SHOW_CONTEXT_MENU_NOTIFICATION,
		);
	}

	onContextMenu(data) {
		const { controller } = data.object;
		const box = controller.getParent().getParent().getModel();
		let type = (box.getParent() instanceof JSG.InboxContainer) ? 'ib' : 'ob';

		type += box.getType().getValue();
		let left = data.object.event.event.offsetX;
		const maxRight = left + 285;
		if (maxRight > window.innerWidth) {
			left = window.innerWidth - 285;
		}
		const popHeight = 350;
		const maxTop = window.innerHeight - popHeight > 0 ? window.innerHeight - popHeight : 0;
		const top = data.object.event.event.offsetY > maxTop ? maxTop : data.object.event.event.offsetY;

		let sheetId = null;
		let stream = null;
		let streamsheet = null;
		let streamsheetSettings = null;
		if(controller) {
			const container1 = controller.getModel().getParent().getParent().getParent()
			.getParent();
			if(typeof container1.getStreamSheetContainerAttributes === 'function') {
				sheetId = container1.getStreamSheetContainerAttributes().getSheetId().getValue();
				const { machine } = this.props;
				if (machine && machine.streamsheets && machine.streamsheets.length > 0) {
					streamsheet = machine.streamsheets.find(t => t.id === sheetId);
					if (streamsheet) {
						streamsheetSettings = {
							...streamsheet,
							machineId: machine.id,
							streamsheetId: streamsheet.id,
						};
					}
				}
			}
		}

		this.setState({
			type,
			context: 'true',
			controller,
			selected: controller.getModel().getSelectedItem(),
			selectedPath: controller.getModel().getSelectedItemPath(),
			left: `${left}px`,
			top: `${top}px`,
			sheetId,
			streamsheetSettings,
			stream
		});
	}

	onDelete = () => {
		const { controller } = this.state;

		if (controller) {
			const item = controller.getModel().getParent().getParent().getParent();
			item.getMessageTreeItems().setTree({});
			controller.getView().deleteTreeItem(this.state.selected, graphManager.getGraphEditor().getGraphViewer());
			// TODO delete on server (at least for inbox)
		}
	};

	onDeleteAll = () => {
		const { controller } = this.state;

		if (controller) {
			const item = controller.getModel().getParent().getParent().getParent();
			item.getMessageTreeItems().setTree({});
			controller.getView().deleteTreeItem(undefined, graphManager.getGraphEditor().getGraphViewer());
			// TODO delete on server (at least for inbox)
		}
	};

	onSetLoop = () => {
		const streamsheetId = this.state.sheetId;
		const path = this.state.selectedPath;
		graphManager.updateLoopElement(streamsheetId, path, true);
		graphManager.redraw();
		this.state.streamsheetSettings.loop.path = path;
		this.state.streamsheetSettings.loop.enabled = true;
		this.props.saveProcessSettings(this.state.streamsheetSettings);
	};

	onClearLoop = () => {
		const streamsheetId = this.state.sheetId;
		const path = '';
		graphManager.updateLoopElement(streamsheetId, path, false);
		graphManager.redraw();
		this.state.streamsheetSettings.loop.path = path;
		this.state.streamsheetSettings.loop.enabled = false;
		this.props.saveProcessSettings(this.state.streamsheetSettings);
	};

	handleClick = (event) => {
		const { context } = this.state;
		const wasOutside = !(event.target.contains === this.sheetmenu);

		if (wasOutside && context) {
			this.setState({
				context: Boolean(this.state.anchorEl) || false,
			});
		}
	};

	handleClose = () => {
		this.setState({ anchorEl: null });
	};

	render() {
		return (
			<Paper
				id="sheetmenu"
				ref={(ref) => {
					this.sheetmenu = ref;
				}}
				style={{
					display: [this.state.context ? 'inline-block' : 'none'],
					position: 'absolute',
					left: [this.state.left],
					top: [this.state.top],
				}}
			>
				<MenuList>
					<MenuItem
						onClick={this.onDelete}
						dense
						disabled={this.state.selected === undefined}
						style={{
							display: [(this.state.type === 'ibml' || this.state.type === 'obml') ? 'flex' : 'none'],
						}}
					>
						<ListItemIcon>
							<DeleteIcon style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="Delete" defaultMessage="Delete" />} />
					</MenuItem>
					<MenuItem
						onClick={this.onDeleteAll}
						dense
						style={{
							display: [(this.state.type === 'ibml' || this.state.type === 'obml') ? 'flex' : 'none'],
						}}
					>
						<ListItemIcon>
							<DeleteAllIcon style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="DeleteAll" defaultMessage="Delete All" />} />
					</MenuItem>
					<MenuItem
						onClick={this.onSetLoop}
						dense
						disabled={this.state.selected === undefined ||
						(this.state.selected.type !== JSG.TreeItemsNode.DataType.ARRAY &&
							this.state.selected.type !== JSG.TreeItemsNode.DataType.OBJECT)}
						style={{
							display: [this.state.type === 'ibme' ? 'flex' : 'none'],
						}}
					>
						<ListItemIcon>
							<LoopIcon style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="SetLoopElement" defaultMessage="Set Loop" />} />
					</MenuItem>
					<MenuItem
						onClick={this.onClearLoop}
						dense
						style={{
							display: [this.state.type === 'ibme' ? 'flex' : 'none'],
						}}
					>
						<ListItemIcon>
							<ClearLoop style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText
							primary={<FormattedMessage id="ClearLoopElement" defaultMessage="Clear Loop" />}
						/>
					</MenuItem>
				</MenuList>
			</Paper>
		);
	}
}

function mapStateToProps(state) {
	return {
		streams: state.streams,
		machine: state.monitor.machine,
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TreeContextComponent);
