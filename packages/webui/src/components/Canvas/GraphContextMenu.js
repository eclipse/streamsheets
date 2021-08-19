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
import TimelineIcon from '@material-ui/icons/Timeline';
import ShortTextIcon from '@material-ui/icons/ShortText';
import ChevronRight from '@material-ui/icons/ChevronRight';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import { IconCopy, IconCut } from '../icons';
import DeleteIcon from '@material-ui/icons/Delete';
import SettingsIcon from '@material-ui/icons/Settings';
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

class GraphContextComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			context: 'false', top: '0px', left: '0px'
		};
	}

	componentDidMount() {
		document.addEventListener('click', this.handleClick);
		JSG.NotificationCenter.getInstance().register(this, JSG.GRAPH_SHOW_CONTEXT_MENU_NOTIFICATION, 'onContextMenu');

		/* eslint-disable react/no-did-mount-set-state */
		this.setState({
			context: false
		});

		/* eslint-enable react/no-did-mount-set-state */
	}

	componentWillUnmount() {
		document.removeEventListener('click', this.handleClick);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.GRAPH_SHOW_CONTEXT_MENU_NOTIFICATION);
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

	onCopy = () => {
		graphManager
			.getGraphEditor()
			.getInteractionHandler()
			.copySelection();
	};

	onCut = () => {
		graphManager
			.getGraphEditor()
			.getInteractionHandler()
			.cutSelection();
	};

	onDelete = () => {
		graphManager
			.getGraphEditor()
			.getInteractionHandler()
			.deleteSelection();
	};

	onChangeOrder = (popupState, order) => {
		popupState.close();

		const viewer = graphManager.getGraphViewer();
		if (viewer === undefined) {
			return;
		}

		const selection = viewer.getSelection();
		const item = selection.length ? selection[0].getModel() : undefined;

		graphManager.synchronizedExecute(new JSG.ChangeItemOrderCommand(item, order, viewer));
	};

	onAlignShapes = (popupState, alignment) => {
		popupState.close();

		graphManager
			.getGraphEditor()
			.getInteractionHandler()
			.alignSelection(alignment);
	};

	onEditPoints = () => {
		const viewer = graphManager.getGraphViewer();
		if (viewer === undefined) {
			return;
		}

		viewer.getInteractionHandler().editSelection();
	};

	onAddText = () => {
		const viewer = graphManager.getGraphViewer();
		if (viewer === undefined) {
			return;
		}

		const selection = viewer.getSelection();
		if (selection.length !== 1) {
			return;
		}

		const item = selection[0].getModel();
		if (item.isAddLabelAllowed()) {
			const node = new JSG.TextNode('Text');
			const pos = item.getNewLabelPosition();
			if (pos !== undefined) {
				node.getTextFormat().setVerticalPosition(Math.floor(pos / 5) + 1);
				node.getTextFormat().setHorizontalPosition((pos % 5) + 1);
			}
			node.getTextFormat().setParent(item.getTextFormat());
			node.setItemAttribute(JSG.ItemAttributes.SNAPTO, false);

			graphManager.synchronizedExecute(new JSG.AddItemCommand(node, item));
		}
	};

	canAddText() {
		const viewer = graphManager.getGraphViewer();
		if (viewer === undefined) {
			return false;
		}

		const selection = viewer.getSelection();
		if (selection.length !== 1) {
			return false;
		}

		return selection[0].getModel().isAddLabelAllowed();
	}

	isMultiSelection() {
		const viewer = graphManager.getGraphViewer();
		if (viewer === undefined) {
			return false;
		}

		const selection = viewer.getSelection();
		return selection.length > 1;
	}

	isLayoutSectionSelected() {
		const viewer = graphManager.getGraphViewer();
		if (viewer === undefined) {
			return false;
		}

		const context = viewer.getSelectionProvider().getSelectionContext();
		return (context && (context.obj === 'layoutsectioncolumn' || context.obj === 'layoutsectionrow'));
	}

	canEditPoints() {
		const viewer = graphManager.getGraphViewer();
		if (viewer === undefined) {
			return false;
		}

		const selection = viewer.getSelection();
		if (selection.length !== 1) {
			return false;
		}

		const shapeType = selection[0]
			.getModel()
			.getShape()
			.getType();

		switch (shapeType) {
		case JSG.PolygonShape.TYPE:
		case JSG.BezierShape.TYPE:
			return true;
		default:
			return false;
		}
	}

	onShowLayoutSectionProperties = () => {
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
		const selection = graphManager.getGraphViewer().getSelection();
		const item = selection.length ? selection[0].getModel() : undefined;
		const showEdit = this.canEditPoints();
		const showAddText = this.canAddText();

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
								{this.isLayoutSectionSelected() ? [
										<MenuItem onClick={this.onShowLayoutSectionProperties} dense>
											<ListItemIcon>
												<SettingsIcon style={styles.menuItem} />
											</ListItemIcon>
											<ListItemText
												primary={<FormattedMessage id='EditGraphItem' defaultMessage='Edit Object' />}
											/>
										</MenuItem>,
										<Divider />
									] : null}
								{!this.isMultiSelection() ? [
										<MenuItem onClick={this.onShowChartProperties} dense>
											{item instanceof JSG.SheetPlotNode ? [<ListItemIcon>
												<SvgIcon style={styles.menuItem}>
													<path d='M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z' />
												</SvgIcon>
											</ListItemIcon>, <ListItemText
												primary={<FormattedMessage id='EditChart' defaultMessage='Edit Chart' />}
											/>] : [<ListItemIcon>
												<SettingsIcon style={styles.menuItem} />
											</ListItemIcon>, <ListItemText
												primary={<FormattedMessage id='EditGraphItem' defaultMessage='Edit Object' />}
											/>]}
										</MenuItem>,
										<Divider />
									] : null}
								<MenuItem onClick={this.onCut} dense>
									<ListItemIcon>
										<IconCut style={styles.menuItem} />
									</ListItemIcon>
									<ListItemText primary={<FormattedMessage id='Cut' defaultMessage='Cut' />} />
								</MenuItem>
								<MenuItem onClick={this.onCopy} dense>
									<ListItemIcon>
										<IconCopy style={styles.menuItem} />
									</ListItemIcon>
									<ListItemText primary={<FormattedMessage id='Copy' defaultMessage='Copy' />} />
								</MenuItem>
								<MenuItem onClick={this.onDelete} dense>
									<ListItemIcon>
										<DeleteIcon style={styles.menuItem} />
									</ListItemIcon>
									<ListItemText primary={<FormattedMessage id='Delete' defaultMessage='Delete' />} />
								</MenuItem>
								<Divider />
								<Submenu
									popupId='drawingOrderMenu' title={<FormattedMessage id='Shapes.ChangeOrder'
																					   defaultMessage='Drawing Order' />}
								>
									<MenuItem
										onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.TOTOP)}
										dense>
										<ListItemIcon>
											<SvgIcon style={styles.menuItem}>
												<path
													d='M2,2H11V6H9V4H4V9H6V11H2V2M22,13V22H13V18H15V20H20V15H18V13H22M8,8H16V16H8V8Z' />
											</SvgIcon>
										</ListItemIcon>
										<ListItemText primary={<FormattedMessage id='Shapes.MoveToTop'
																				 defaultMessage='Move to Top' />} />
									</MenuItem>
									<MenuItem onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.UP)}
											  dense>
										<ListItemIcon>
											<SvgIcon style={styles.menuItem}>
												<path d='M2,2H16V16H2V2M22,8V22H8V18H10V20H20V10H18V8H22Z' />
											</SvgIcon>
										</ListItemIcon>
										<ListItemText
											primary={<FormattedMessage id='Shapes.MoveUp' defaultMessage='Move up' />} />
									</MenuItem>
									<MenuItem onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.DOWN)}
											  dense>
										<ListItemIcon>
											<SvgIcon style={styles.menuItem}>
												<path d='M2,2H16V16H2V2M22,8V22H8V18H18V8H22M4,4V14H14V4H4Z' />
											</SvgIcon>
										</ListItemIcon>
										<ListItemText
											primary={<FormattedMessage id='Shapes.MoveDown' defaultMessage='Move down' />} />
									</MenuItem>
									<MenuItem
										onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.TOBOTTOM)}
										dense>
										<ListItemIcon>
											<SvgIcon style={styles.menuItem}>
												<path
													d='M2,2H11V11H2V2M9,4H4V9H9V4M22,13V22H13V13H22M15,20H20V15H15V20M16,8V11H13V8H16M11,16H8V13H11V16Z' />
											</SvgIcon>
										</ListItemIcon>
										<ListItemText
											primary={<FormattedMessage id='Shapes.MoveToBottom'
																	   defaultMessage='Move to Bottom' />}
										/>
									</MenuItem>
								</Submenu>
								{this.isMultiSelection() ? (
									<Submenu
										popupId='AlignMenu' title={<FormattedMessage id='Shapes.Align'
																						   defaultMessage='Align Shapes' />}
									>
										<MenuItem
											onClick={() => this.onAlignShapes(popupState, JSG.AlignItemsCommand.Alignment.LEFT)}
											dense>
											<ListItemIcon>
												<SvgIcon style={styles.menuItem}>
													<path
														d="M22 13V19H6V13H22M6 5V11H16V5H6M2 2V22H4V2H2" />
												</SvgIcon>
											</ListItemIcon>
											<ListItemText primary={<FormattedMessage id='Shapes.AlignLeft'
																					 defaultMessage='Align Left' />} />
										</MenuItem>
										<MenuItem
											onClick={() => this.onAlignShapes(popupState, JSG.AlignItemsCommand.Alignment.CENTER)}
											dense>
											<ListItemIcon>
												<SvgIcon style={styles.menuItem}>
													<path
														d="M20 19H13V22H11V19H4V13H11V11H7V5H11V2H13V5H17V11H13V13H20V19Z" />
												</SvgIcon>
											</ListItemIcon>
											<ListItemText primary={<FormattedMessage id='Shapes.AlignCentered'
																					 defaultMessage='Align Centered' />} />
										</MenuItem>
										<MenuItem
											onClick={() => this.onAlignShapes(popupState, JSG.AlignItemsCommand.Alignment.RIGHT)}
											dense>
											<ListItemIcon>
												<SvgIcon style={styles.menuItem}>
													<path
														d="M18 13V19H2V13H18M8 5V11H18V5H8M20 2V22H22V2H20Z" />
												</SvgIcon>
											</ListItemIcon>
											<ListItemText primary={<FormattedMessage id='Shapes.AlignRight'
																					 defaultMessage='Align Right' />} />
										</MenuItem>
										<Divider />
										<MenuItem
											onClick={() => this.onAlignShapes(popupState, JSG.AlignItemsCommand.Alignment.TOP)}
											dense>
											<ListItemIcon>
												<SvgIcon style={styles.menuItem}>
													<path
														d="M11 22H5V6H11V22M19 6H13V16H19V6M22 2H2V4H22V2Z" />
												</SvgIcon>
											</ListItemIcon>
											<ListItemText primary={<FormattedMessage id='Shapes.AlignTop'
																					 defaultMessage='Align Top' />} />
										</MenuItem>
										<MenuItem
											onClick={() => this.onAlignShapes(popupState, JSG.AlignItemsCommand.Alignment.MIDDLE)}
											dense>
											<ListItemIcon>
												<SvgIcon style={styles.menuItem}>
													<path
														d="M5 20V13H2V11H5V4H11V11H13V7H19V11H22V13H19V17H13V13H11V20H5Z" />
												</SvgIcon>
											</ListItemIcon>
											<ListItemText primary={<FormattedMessage id='Shapes.AlignMiddle'
																					 defaultMessage='Align Middle' />} />
										</MenuItem>
										<MenuItem
											onClick={() => this.onAlignShapes(popupState, JSG.AlignItemsCommand.Alignment.BOTTOM)}
											dense>
											<ListItemIcon>
												<SvgIcon style={styles.menuItem}>
													<path
														d="M11 18H5V2H11V18M19 8H13V18H19V8M22 20H2V22H22V20Z" />
												</SvgIcon>
											</ListItemIcon>
											<ListItemText primary={<FormattedMessage id='Shapes.AlignBottom'
																					 defaultMessage='Align Bottom' />} />
										</MenuItem>
									</Submenu>) : null
								}
								{this.isMultiSelection() ? (<Submenu
									popupId='DistMenu' title={<FormattedMessage id='Shapes.Distribute'
																				 defaultMessage='Distribute Shapes' />}
								>
									<MenuItem
										onClick={() => this.onAlignShapes(popupState,
											JSG.AlignItemsCommand.Alignment.HDISTRIBUTE)}
										dense>
										<ListItemIcon>
											<SvgIcon style={styles.menuItem}>
												<path
													d="M9,11H15V8L19,12L15,16V13H9V16L5,12L9,8V11M2,20V4H4V20H2M20,20V4H22V20H20Z" />
											</SvgIcon>
										</ListItemIcon>
										<ListItemText primary={<FormattedMessage id='Shapes.DistributeHorz'
																				 defaultMessage='Horizontal' />} />
									</MenuItem>
									<MenuItem
										onClick={() => this.onAlignShapes(popupState,
											JSG.AlignItemsCommand.Alignment.VDISTRIBUTE)}
										dense>
										<ListItemIcon>
											<SvgIcon style={styles.menuItem}>
												<path
													d="M13,9V15H16L12,19L8,15H11V9H8L12,5L16,9H13M4,2H20V4H4V2M4,20H20V22H4V20Z" />
											</SvgIcon>
										</ListItemIcon>
										<ListItemText primary={<FormattedMessage id='Shapes.DistributeVert'
																				 defaultMessage='Vertical' />} />
									</MenuItem>
								</Submenu>) : null}
								{showEdit ? <Divider /> : null}
								{showEdit ? (<MenuItem onClick={() => this.onEditPoints()} dense>
										<ListItemIcon>
											<TimelineIcon style={styles.menuItem} />
										</ListItemIcon>
										<ListItemText primary={<FormattedMessage id='Shapes.EditPoints'
																				 defaultMessage='Edit Points' />} />
									</MenuItem>) : null}
								{showAddText ? <Divider /> : null}
								{showAddText ? (<MenuItem onClick={() => this.onAddText()} dense>
										<ListItemIcon>
											<ShortTextIcon style={styles.menuItem} />
										</ListItemIcon>
										<ListItemText
											primary={<FormattedMessage id='Shapes.AddText' defaultMessage='Add Text' />} />
									</MenuItem>) : null}
							</MenuList>
						</ParentPopupState.Provider>)}
				</PopupState>
			</Paper>);
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(null, mapDispatchToProps)(GraphContextComponent);
