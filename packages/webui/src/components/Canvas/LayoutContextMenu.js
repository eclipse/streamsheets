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
								<MenuItem onClick={this.onShowChartProperties} dense>
									<ListItemIcon>
										<SettingsIcon style={styles.menuItem} />
									</ListItemIcon>
									<ListItemText
											primary={<FormattedMessage id='EditGraphItem' defaultMessage='Edit Object' />}
									/>
								</MenuItem>
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
									<MenuItem onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.DOWN)}
											  dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.Properties' defaultMessage='Properties' />} />
									</MenuItem>
									<Divider />
									<MenuItem
										onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.TOTOP)}
										dense>
										<ListItemText primary={<FormattedMessage id='Layout.AddBefore'
																				 defaultMessage='Add Before' />} />
									</MenuItem>
									<MenuItem onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.UP)}
											  dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.AddBehind' defaultMessage='Add Behind' />} />
									</MenuItem>
									<Divider />
									<MenuItem onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.DOWN)}
											  dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.Delete' defaultMessage='Delete' />} />
									</MenuItem>
								</Submenu>
								<Submenu
									popupId='columnMenu' title={<FormattedMessage id='Layout.Column' defaultMessage='Column' />}
								>
									<MenuItem onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.DOWN)}
											  dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.Properties' defaultMessage='Properties' />} />
									</MenuItem>
									<Divider />
									<MenuItem
										onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.TOTOP)}
										dense>
										<ListItemText primary={<FormattedMessage id='Layout.AddBefore'
																				 defaultMessage='Add Before' />} />
									</MenuItem>
									<MenuItem onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.UP)}
											  dense>
										<ListItemText
											primary={<FormattedMessage id='Layout.AddBehind' defaultMessage='Add Behind' />} />
									</MenuItem>
									<Divider />
									<MenuItem onClick={() => this.onChangeOrder(popupState, JSG.ChangeItemOrderCommand.Action.DOWN)}
											  dense>
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
