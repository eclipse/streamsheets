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
/* eslint-disable react/no-unused-state */
/* eslint-disable react/forbid-prop-types */
import JSG from '@cedalo/jsg-ui';
import Divider from '@material-ui/core/Divider';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import SvgIcon from '@material-ui/core/SvgIcon/SvgIcon';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import Menu from 'material-ui-popup-state/HoverMenu';
import { connect } from 'react-redux';
import ChevronRight from '@material-ui/icons/ChevronRight';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import DeleteIcon from '@material-ui/icons/Delete';
// import SettingsIcon from '@material-ui/icons/Settings';
import withStyles from '@material-ui/core/styles/withStyles';
import PopupState, { bindHover, bindMenu } from 'material-ui-popup-state';

const ParentPopupState = React.createContext(null);

const styles = {
	menuItem: {
		transition: 'none'
	}
};
const submenuStyles = theme => ({
	menu: {
		marginTop: theme.spacing(-1)
	}, title: {
		flexGrow: 1
	}, moreArrow: {
		marginRight: theme.spacing(-1)
	}
});

const Submenu = withStyles(submenuStyles)(// Unfortunately, MUI <Menu> injects refs into its children, which causes a
	// warning in some cases unless we use forwardRef here.
	React.forwardRef(({ classes, title, popupId, children, ...props }, ref) => (
		<ParentPopupState.Consumer>
			{parentPopupState => (
				<PopupState
					variant='popover'
					popupId={popupId}
					parentPopupState={parentPopupState}
				>
					{popupState => (
						<ParentPopupState.Provider value={popupState}>
							<MenuItem
								dense
								{...bindHover(popupState)}
								selected={popupState.isOpen}
								ref={ref}
							>
								<ListItemIcon>
									<SvgIcon style={styles.menuItem} />
								</ListItemIcon>
								<ListItemText
									primary={title}
								/>
								<ChevronRight className={classes.moreArrow} />
							</MenuItem>
							<Menu
								{...bindMenu(popupState)}
								classes={{ paper: classes.menu }}
								anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
								transformOrigin={{ vertical: 'top', horizontal: 'left' }}
								getContentAnchorEl={null}
								{...props}
							>
								{children}
							</Menu>
						</ParentPopupState.Provider>)}
				</PopupState>)}
		</ParentPopupState.Consumer>)));

class LayoutContextComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			context: 'false', top: '0px', left: '0px'
		};
	}

	componentDidMount() {
		document.addEventListener('click', this.handleClick);
		JSG.NotificationCenter.getInstance().register(this, JSG.LAYOUT_SHOW_CONTEXT_MENU_NOTIFICATION, 'onContextMenu');

		/* eslint-disable react/no-did-mount-set-state */
		this.setState({
			context: false
		});

		/* eslint-enable react/no-did-mount-set-state */
	}

	componentWillUnmount() {
		document.removeEventListener('click', this.handleClick);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.LAYOUT_SHOW_CONTEXT_MENU_NOTIFICATION);
	}

	onContextMenu(data) {
		let left = data.object.event.event.offsetX;
		const maxRight = left + 235;
		if (maxRight > window.innerWidth) {
			left = window.innerWidth - 235;
		}
		const popHeight = 500;
		const maxTop = window.innerHeight - popHeight > 0 ? window.innerHeight - popHeight : 0;
		const top = data.object.event.event.offsetY > maxTop ? maxTop : data.object.event.event.offsetY;

		this.setState({
			context: 'true', left: `${left}px`, top: `${top}px`
		});
	}

	onDelete = () => {
		const cmd = new JSG.CompoundCommand();
		const info = this.getNodeInfo();
		if (!info) {
			return;
		}

		info.item.subItems.forEach(item => {
			cmd.add(new JSG.DeleteItemCommand(item));
		});

		graphManager
			.getGraphEditor()
			.getInteractionHandler().execute(cmd);
	};

	onDeleteRow = (popupState) => {
		popupState.close();
		const info = this.getNodeInfo();
		if (!info) {
			return;
		}

		const cmd = new JSG.DeleteLayoutSectionCommand(info.layoutNode, info.row, true);

		graphManager
			.getGraphEditor()
			.getInteractionHandler().execute(cmd);
	};

	onAddRow = (popupState, before) => {
		popupState.close();
		const info = this.getNodeInfo();
		if (!info) {
			return;
		}

		const cmd = new JSG.AddLayoutSectionCommand(info.layoutNode, 4000, 'auto', true, before ? info.row : info.row + 1);

		graphManager
			.getGraphEditor()
			.getInteractionHandler().execute(cmd);
	};

	onDeleteColumn = (popupState) => {
		popupState.close();
		const info = this.getNodeInfo();
		if (!info) {
			return;
		}

		const cmd = new JSG.DeleteLayoutSectionCommand(info.layoutNode, info.column, false);

		graphManager
			.getGraphEditor()
			.getInteractionHandler().execute(cmd);
	};

	onAddColumn = (popupState, before) => {
		popupState.close();
		const info = this.getNodeInfo();
		if (!info) {
			return;
		}

		const cmd = new JSG.AddLayoutSectionCommand(info.layoutNode, 4000, 'absolute', false, before ? info.column : info.column + 1);

		graphManager
			.getGraphEditor()
			.getInteractionHandler().execute(cmd);
	};

	isMultiSelection() {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		return selection.length > 1;
	}

	isMerged() {
		const info = this.getNodeInfo();
		if (!info) {
			return false;
		}
		return !!info.item.getAttributeValueAtPath('mergecount');
	}

	getNodeInfo() {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		const item = selection.length ? selection[0].getModel() : undefined;
		if (!item) {
			return undefined;
		}
		const layoutNode = item.getParent();
		if (!(layoutNode instanceof JSG.LayoutNode)) {
			return undefined;
		}

		const index = layoutNode.subItems.indexOf(item);

		return {
			item,
			layoutNode,
			index,
			row: Math.floor(index / layoutNode.columns),
			column: index % layoutNode.columns
		}
	}

	onMergeRight = () => {
		const viewer = graphManager.getGraphViewer();
		const info = this.getNodeInfo();
		let val = info.item.getAttributeValueAtPath('mergecount');
		let nextMergeCount = 0;

		if (info.column + val < info.layoutNode.columns) {
			nextMergeCount = info.layoutNode.subItems[info.index + val + 1].getAttributeValueAtPath(
				'mergecount');
		}

		val += 1 + nextMergeCount;
		const cmd = new JSG.SetAttributeAtPathCommand(info.item, 'mergecount', val);
		viewer.getInteractionHandler().execute(cmd);
	};

	isMergeRightAllowed() {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		if (selection.length > 1) {
			return false;
		}
		const info = this.getNodeInfo();
		if (!info) {
			return false;
		}
		const val = info.item.getAttributeValueAtPath('mergecount');

		return info.column + val + 1 < info.layoutNode.columns;
	}

	isMergeLeftAllowed() {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		if (selection.length > 1) {
			return false;
		}
		const info = this.getNodeInfo();

		return info && info.column;
	}

	onRemoveMerge = () => {
		const viewer = graphManager.getGraphViewer();
		const info = this.getNodeInfo();
		if (!info) {
			return;
		}

		const cmd = new JSG.SetAttributeAtPathCommand(info.item, 'mergecount', new JSG.NumberExpression(0));
		viewer.getInteractionHandler().execute(cmd);
	};

	onMergeLeft = () => {
		const viewer = graphManager.getGraphViewer();
		const info = this.getNodeInfo();
		if (!info) {
			return;
		}

		let mergeCount = info.item.getAttributeValueAtPath('mergecount');
		let startIndex = info.index - 1;
		let node;

		do {
			node = info.layoutNode.subItems[startIndex];
			startIndex -= 1;
		} while (startIndex > 0 && node && node._merged);

		mergeCount += node.getAttributeValueAtPath('mergecount') + 1;

		const cmd = new JSG.SetAttributeAtPathCommand(node, 'mergecount', mergeCount);
		viewer.getInteractionHandler().execute(cmd);

		viewer.getSelectionProvider().clearSelection();
		const graphController = viewer.getGraphController();
		const controller = graphController.getControllerByModelId(node.getId());

		if (controller) {
			viewer.getSelectionProvider().select(controller);
			viewer.getInteractionHandler().repaint();
		}
	};

	onRowProperties = (popupState) => {
		popupState.close();

		const info = this.getNodeInfo()
		const viewer = graphManager.getGraphViewer();
		viewer.getSelectionProvider().setSelectionContext({
			obj: 'layoutsectionrow',
			index: info.row,
		});

		JSG.NotificationCenter.getInstance().send(
			new JSG.Notification(JSG.SelectionProvider.SELECTION_CHANGED_NOTIFICATION, info.item)
		);

		this.props.setAppState({ showLayoutSectionProperties: true });
	};

	onColumnProperties = (popupState) => {
		popupState.close();

		const info = this.getNodeInfo()
		const viewer = graphManager.getGraphViewer();
		viewer.getSelectionProvider().setSelectionContext({
			obj: 'layoutsectioncolumn',
			index: info.column,
		});

		JSG.NotificationCenter.getInstance().send(
			new JSG.Notification(JSG.SelectionProvider.SELECTION_CHANGED_NOTIFICATION, info.item)
		);

		this.props.setAppState({ showLayoutSectionProperties: true });
	};

	onShowChartProperties = () => {
		// const sheetView = graphManager.getActiveSheetView();
		// eslint-disable-next-line react/prop-types
		this.props.setAppState({ showStreamChartProperties: true });
	};

	handleClick = (event) => {
		const { context } = this.state;
		const wasOutside = !(event.target.contains === this.sheetmenu);

		if (wasOutside && context) {
			this.setState({
				context: false
			});
		}
	};

	render() {
		if (graphManager === undefined || graphManager.getGraphViewer() === undefined) {
			return <div />;
		}
		// const selection = graphManager.getGraphViewer().getSelection();
		// const item = selection.length ? selection[0].getModel() : undefined;

		return (<Paper
				id='sheetmenu'
				ref={(ref) => {
					this.sheetmenu = ref;
				}}
				style={{
					display: 'inline-block',
					position: 'absolute',
					left: [this.state.left],
					top: [this.state.top],
					visibility: [this.state.context ? 'visible' : 'hidden']
				}}
			>

				<PopupState variant='popover' popupId='demoMenu'>
					{popupState => (<ParentPopupState.Provider value={popupState}>
							<MenuList
								{...bindHover(popupState)}
								{...bindMenu(popupState)}
							>
								{this.isMerged() ? (
									<MenuItem onClick={this.onRemoveMerge} dense>
										<ListItemIcon>
											<SvgIcon>
												<path
													// eslint-disable-next-line max-len
													d="M5,10H3V4H11V6H5V10M19,18H13V20H21V14H19V18M5,18V14H3V20H11V18H5M21,4H13V6H19V10H21V4"
												/>
											</SvgIcon>
										</ListItemIcon>
										<ListItemText
											primary={<FormattedMessage id='MergeRemove' defaultMessage='Remove Merge' />}
										/>
									</MenuItem>
									) : null}
								{this.isMergeLeftAllowed() ? (
									<MenuItem onClick={this.onMergeLeft} dense>
										<ListItemIcon>
											<SvgIcon>
												<path
													// eslint-disable-next-line max-len
													d="M5,10H3V4H11V6H5V10M19,18H13V20H21V14H19V18M5,18V14H3V20H11V18H5M21,4H13V6H19V10H21V4M8,13V15L11,12L8,9V11H3V13H8Z"
												/>
											</SvgIcon>
										</ListItemIcon>
										<ListItemText
											primary={<FormattedMessage id='MergeLeft'
																	   defaultMessage='Merge with Left Cell' />}
										/>
									</MenuItem>) : null
								}
								{this.isMergeRightAllowed() ? (
									<MenuItem onClick={this.onMergeRight} dense>
										<ListItemIcon>
											<SvgIcon>
												<path
													// eslint-disable-next-line max-len
													d="M5,10H3V4H11V6H5V10M19,18H13V20H21V14H19V18M5,18V14H3V20H11V18H5M21,4H13V6H19V10H21V4M16,11V9L13,12L16,15V13H21V11H16Z"
												/>
											</SvgIcon>
										</ListItemIcon>
										<ListItemText
												primary={<FormattedMessage id='MergeRight' defaultMessage='Merge with Right Cell' />}
										/>
									</MenuItem>) : null
								}
								<Divider />
								<MenuItem onClick={this.onDelete} dense>
									<ListItemIcon>
										<DeleteIcon style={styles.menuItem} />
									</ListItemIcon>
									<ListItemText primary={<FormattedMessage id='DeleteContent' defaultMessage='Delete Content' />} />
								</MenuItem>
								<Divider />
								<Submenu
									popupId='rowMenu' title={<FormattedMessage id='Layout.Row' defaultMessage='Row' />}
								>
									<MenuItem onClick={() => this.onRowProperties(popupState)} dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.Properties' defaultMessage='Properties' />}
										/>
									</MenuItem>
									<Divider />
									<MenuItem onClick={() => this.onAddRow(popupState, true)} dense>
										<ListItemText primary={<FormattedMessage id='Layout.AddBefore'
																				 defaultMessage='Add Before' />} />
									</MenuItem>
									<MenuItem onClick={() => this.onAddRow(popupState, false)}
											  dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.AddBehind' defaultMessage='Add Behind' />} />
									</MenuItem>
									<Divider />
									<MenuItem onClick={() => this.onDeleteRow(popupState)} dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.Delete' defaultMessage='Delete' />} />
									</MenuItem>
								</Submenu>
								<Submenu
									popupId='columnMenu' title={<FormattedMessage id='Layout.Column' defaultMessage='Column' />}
								>
									<MenuItem onClick={() => this.onColumnProperties(popupState)} dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.Properties' defaultMessage='Properties' />}
										/>
									</MenuItem>
									<Divider />
									<MenuItem
										onClick={() => this.onAddColumn(popupState, true)}
										dense>
										<ListItemText primary={<FormattedMessage id='Layout.AddBefore'
																				 defaultMessage='Add Before' />} />
									</MenuItem>
									<MenuItem onClick={() => this.onAddColumn(popupState, false)}
											  dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.AddBehind' defaultMessage='Add Behind' />} />
									</MenuItem>
									<Divider />
									<MenuItem onClick={() => this.onDeleteColumn(popupState)} dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.Delete' defaultMessage='Delete' />} />
									</MenuItem>
								</Submenu>
							</MenuList>
						</ParentPopupState.Provider>)}
				</PopupState>
			</Paper>);
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(null, mapDispatchToProps)(LayoutContextComponent);
