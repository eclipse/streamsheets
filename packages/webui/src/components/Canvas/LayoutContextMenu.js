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
import withStyles from '@material-ui/core/styles/withStyles';
import PopupState, { bindHover, bindMenu } from 'material-ui-popup-state';
import SettingsIcon from '@material-ui/icons/Settings';

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
								<ListItemIcon key="iconSGM">
									<SvgIcon style={styles.menuItem} />
								</ListItemIcon>
								<ListItemText
									key={title}
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
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		const item = selection.length ? selection[0].getModel() : undefined;
		if (!item) {
			return;
		}

		let path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.LAYOUT);
		cmd.add(new JSG.SetAttributeAtPathCommand(item, path, 'row'));
		path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.SECTIONS);
		cmd.add(new JSG.SetAttributeAtPathCommand(item, path, 2));

		item.subItems.forEach(subitem => {
			cmd.add(new JSG.DeleteItemCommand(subitem));
		});

		graphManager
			.getGraphEditor()
			.getInteractionHandler().execute(cmd);
		window.setTimeout(() => graphManager.getCanvas().focus(), 250);
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
		window.setTimeout(() => graphManager.getCanvas().focus(), 250);
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

		window.setTimeout(() => graphManager.getCanvas().focus(), 250);
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
		window.setTimeout(() => graphManager.getCanvas().focus(), 250);
	};

	onAddColumn = (popupState, before) => {
		popupState.close();
		const info = this.getNodeInfo();
		if (!info) {
			return;
		}

		const cmd = new JSG.AddLayoutSectionCommand(info.layoutNode, 30, 'relative', false, before ? info.column : info.column + 1);

		graphManager
			.getGraphEditor()
			.getInteractionHandler().execute(cmd);
		window.setTimeout(() => graphManager.getCanvas().focus(), 250);
	};

	isMultiSelection() {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		return selection.length > 1;
	}

	isFirst() {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		if (!selection || !selection.length) {
			return false;
		}
		const item = selection[0].getModel();

		const layoutNode = item.getParent();
		if (layoutNode instanceof JSG.LayoutNode) {
			const index = layoutNode.subItems.indexOf(item);

			return (index % layoutNode.columns) === 0;
		}

		return item.getParent().getItems().indexOf(item) === 0;
	}

	isLast() {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		if (!selection || !selection.length) {
			return false;
		}
		const item = selection[0].getModel();

		const layoutNode = item.getParent();
		if (layoutNode instanceof JSG.LayoutNode) {
			const index = layoutNode.subItems.indexOf(item);

			return (index % layoutNode.columns) === layoutNode.columns - 1;
		}

		return item.getParent().getItems().indexOf(item) === item.getParent().getItemCount() - 1;
	}

	isMerged() {
		const info = this.getNodeInfo();
		if (!info) {
			return false;
		}
		return !!info.item.getLayoutCellAttributes().getMergeCount().getValue();
	}

	isLayoutNodeCell() {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		const item = selection.length ? selection[0].getModel() : undefined;
		if (!item) {
			return false;
		}
		const layoutNode = item.getParent();
		return layoutNode instanceof JSG.LayoutNode;
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

	onMoveLeft = () => {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		const item = selection.length ? selection[0].getModel() : undefined;
		if (!item) {
			return;
		}

		viewer
			.getInteractionHandler()
			.execute(new JSG.ChangeItemOrderCommand(item, JSG.ChangeItemOrderCommand.Action.DOWN, viewer, true));
	};

	onMoveRight = () => {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		const item = selection.length ? selection[0].getModel() : undefined;
		if (!item) {
			return;
		}

		viewer
			.getInteractionHandler()
			.execute(new JSG.ChangeItemOrderCommand(item, JSG.ChangeItemOrderCommand.Action.UP, viewer, true));
	};

	onMergeRight = () => {
		const viewer = graphManager.getGraphViewer();
		const info = this.getNodeInfo();
		let val = info.item.getLayoutCellAttributes().getMergeCount().getValue();
		let nextMergeCount = 0;

		const mergeNode = info.layoutNode.subItems[info.index + val + 1];
		if (info.column + val < info.layoutNode.columns) {
			nextMergeCount = mergeNode.getLayoutCellAttributes().getMergeCount().getValue();
		}

		val += 1 + nextMergeCount;
		const path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.MERGECOUNT);
		const cmd = new JSG.CompoundCommand();
		cmd.add(new JSG.SetAttributeAtPathCommand(info.item, path, val));

		const items = [];
		mergeNode.subItems.forEach(subItem => {
			items.push(subItem);
			cmd.add(new JSG.DeleteItemCommand(subItem));
		});

		// update layout cells
		items.forEach(item => {
			cmd.add(new JSG.AddItemCommand(item, info.item));
		});

		viewer.getInteractionHandler().execute(cmd);
		window.setTimeout(() => graphManager.getCanvas().focus(), 250);
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
		const val = info.item.getLayoutCellAttributes().getMergeCount().getValue();

		if (info.item.getLayoutCellAttributes().getLayout().getValue() === 'column') {
			return false;
		}

		if (info.column + val + 1 >= info.layoutNode.columns) {
			return false;
		}

		if (info.layoutNode.subItems[info.index + val + 1].getLayoutCellAttributes().getLayout().getValue() === 'column') {
			return  false;
		}

		return true;
	}

	isMergeLeftAllowed() {
		const viewer = graphManager.getGraphViewer();
		const selection = viewer.getSelection();
		if (selection.length > 1) {
			return false;
		}
		const info = this.getNodeInfo();
		if (!info || !info.column) {
			return false;
		}

		let startIndex = info.index - 1;
		let node;

		if (info.item.getLayoutCellAttributes().getLayout().getValue() === 'column') {
			return false;
		}

		do {
			node = info.layoutNode.subItems[startIndex];
			startIndex -= 1;
		} while (startIndex > 0 && node && node._merged);

		if (node.getLayoutCellAttributes().getLayout().getValue() === 'column') {
			return  false;
		}

		return info && info.column;
	}

	onRemoveMerge = () => {
		const viewer = graphManager.getGraphViewer();
		const info = this.getNodeInfo();
		if (!info) {
			return;
		}

		const path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.MERGECOUNT);
		const cmd = new JSG.SetAttributeAtPathCommand(info.item, path, new JSG.NumberExpression(0));
		viewer.getInteractionHandler().execute(cmd);
		window.setTimeout(() => graphManager.getCanvas().focus(), 250);
	};

	onMergeLeft = () => {
		const viewer = graphManager.getGraphViewer();
		const info = this.getNodeInfo();
		if (!info || !info.column) {
			return;
		}

		let mergeCount = info.item.getLayoutCellAttributes().getMergeCount().getValue();
		let startIndex = info.index - 1;
		let node;

		do {
			node = info.layoutNode.subItems[startIndex];
			startIndex -= 1;
		} while (startIndex > 0 && node && node._merged);

		mergeCount += node.getLayoutCellAttributes().getMergeCount().getValue() + 1;

		const path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.MERGECOUNT);
		const cmd = new JSG.CompoundCommand();
		cmd.add(new JSG.SetAttributeAtPathCommand(node, path, mergeCount));

		const items = [];
		info.item.subItems.forEach(subItem => {
			items.push(subItem);
			cmd.add(new JSG.DeleteItemCommand(subItem));
		});

		// update layout cells
		items.forEach(item => {
			cmd.add(new JSG.AddItemCommand(item, node));
		});

		viewer.getInteractionHandler().execute(cmd);

		viewer.getSelectionProvider().clearSelection();
		const graphController = viewer.getGraphController();
		const controller = graphController.getControllerByModelId(node.getId());

		if (controller) {
			viewer.getSelectionProvider().select(controller);
			viewer.getInteractionHandler().repaint();
		}
		window.setTimeout(() => graphManager.getCanvas().focus(), 250);
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

	onShowProperties = () => {
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
		const layoutCell = this.isLayoutNodeCell();
		const isFirst = this.isFirst();
		const isLast = this.isLast();
		const isMerged = this.isMerged();
		const isMergeLeft = this.isMergeLeftAllowed();
		const isMergeRight = this.isMergeRightAllowed();

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
								{!this.isMultiSelection() ? [
									<MenuItem key="1" onClick={this.onShowProperties} dense>
										<ListItemIcon>
											<SettingsIcon style={styles.menuItem} />
										</ListItemIcon>
										<ListItemText
											primary={<FormattedMessage id='EditGraphItem' defaultMessage='Edit Object' />}
										/>
									</MenuItem>,
									<Divider key="30"/>
								] : null}
								{isMerged ? (
									<MenuItem key="2" onClick={this.onRemoveMerge} dense>
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
								{isMergeLeft ? (
									<MenuItem key="3" onClick={this.onMergeLeft} dense>
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
								{isMergeRight ? (
									<MenuItem key="4" onClick={this.onMergeRight} dense>
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
								{isMerged || isMergeRight || isMergeLeft ? <Divider key="31" /> : null}
								{
									isFirst ? null :
										<MenuItem key="5" onClick={() => this.onMoveLeft()} dense>
											<ListItemIcon>
												<SvgIcon>
													<path
														// eslint-disable-next-line max-len
														d="M7,12L12,7V10H16V14H12V17L7,12M21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5M19,5H5V19H19V5Z"
													/>
												</SvgIcon>
											</ListItemIcon>
											<ListItemText
												primary={<FormattedMessage id='Layout.MoveLeft' defaultMessage='Move Left' />} />
										</MenuItem>
								}
								{
									isLast ? null :
										<MenuItem key="6" onClick={() => this.onMoveRight()} dense>
											<ListItemIcon>
												<SvgIcon>
													<path
														// eslint-disable-next-line max-len
														d="M17,12L12,17V14H8V10H12V7L17,12M3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19M5,19H19V5H5V19Z"
													/>
												</SvgIcon>
											</ListItemIcon>
											<ListItemText
												primary={<FormattedMessage id='Layout.MoveRight' defaultMessage='Move Right' />} />
										</MenuItem>
								}
								{isFirst && isLast ? null : (<Divider key="32" />)}
								{layoutCell ? [
									<Submenu
										popupId='rowMenu' title={<FormattedMessage id='Layout.Row' defaultMessage='Row' />}
									>
										<MenuItem key="7" onClick={() => this.onRowProperties(popupState)} dense>
											<ListItemText
												primary={<FormattedMessage id='Layout.Properties' defaultMessage='Properties' />}
											/>
										</MenuItem>
										<Divider key="33" />
										<MenuItem key="8" onClick={() => this.onAddRow(popupState, true)} dense>
											<ListItemText primary={<FormattedMessage id='Layout.AddBefore'
																					 defaultMessage='Add Before' />} />
										</MenuItem>
										<MenuItem key="9" onClick={() => this.onAddRow(popupState, false)}
												  dense>
											<ListItemText
												primary={<FormattedMessage id='Layout.AddBehind' defaultMessage='Add Behind' />} />
										</MenuItem>
										<Divider key="34" />
										<MenuItem key="10" onClick={() => this.onDeleteRow(popupState)} dense>
											<ListItemText
												primary={<FormattedMessage id='Layout.Delete' defaultMessage='Delete' />} />
										</MenuItem>
									</Submenu>,
									<Submenu
										popupId='columnMenu' title={<FormattedMessage id='Layout.Column' defaultMessage='Column' />}
									>
										<MenuItem key="11" onClick={() => this.onColumnProperties(popupState)} dense>
											<ListItemText
												primary={<FormattedMessage id='Layout.Properties' defaultMessage='Properties' />}
											/>
										</MenuItem>
										<Divider key="35" />
										<MenuItem
											onClick={() => this.onAddColumn(popupState, true)}
											dense>
											<ListItemText primary={<FormattedMessage id='Layout.AddBefore'
																					 defaultMessage='Add Before' />} />
										</MenuItem>
										<MenuItem key="12" onClick={() => this.onAddColumn(popupState, false)}
												  dense>
											<ListItemText
												primary={<FormattedMessage id='Layout.AddBehind' defaultMessage='Add Behind' />} />
										</MenuItem>
										<Divider key="36" />
										<MenuItem key="13" onClick={() => this.onDeleteColumn(popupState)} dense>
											<ListItemText
												primary={<FormattedMessage id='Layout.Delete' defaultMessage='Delete' />} />
										</MenuItem>
									</Submenu>,
								] : null}
								<Divider key="37"/>
								<MenuItem key="14" onClick={this.onDelete} dense>
									<ListItemIcon>
										<DeleteIcon style={styles.menuItem} />
									</ListItemIcon>
									<ListItemText primary={<FormattedMessage id='Layout.DeleteContent' defaultMessage='Delete Content' />} />
								</MenuItem>
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
