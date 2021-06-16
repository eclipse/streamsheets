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
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import * as Colors from '@material-ui/core/colors/index';
import JSG from '@cedalo/jsg-ui';

const createDefault = () => {
	return createMuiTheme({
			palette: {
				primary: {
					main: '#1565c0',
				},
				error: {
					main: '#FF0022',
				},
			},
			wall: {
				backgroundColor: '#eeeeee',
			},
			cellrange: {
				color: 'black',
				colorlight: 'rgba(0, 0, 0, 0.54)',
				underline: 'rgba(0, 0, 0, 0.42)',
			},
			typography: {
				fontSize: 12,
			},
			overrides: {
				MuiAppBar: {
					colorPrimary: {
						backgroundColor: Colors.blue[800]
					},
					colorDefault: {
						backgroundColor: 'white'
					},
					colorEdit: {
						backgroundColor: 'white'
					},
				},
				MuiPaper: {
					root: {
						maxWidth: '100vw',
						maxHeight: '100vh',
					},
				},
				MuiTooltip: {
					tooltip: {
						backgroundColor: '#FFFFFF',
						color: '#333333',
						border: '1px solid #333333',
						fontSize: '8pt',
						maxWidth: '200px',
						padding: '5px',
					},
					popper: {
						opacity: '1',
					},
				},
				MuiCheckbox: {
					root: {
						padding: '5px 12px',
					},
				},
				MuiRadio: {
					root: {
						padding: '5px 12px',
					},
				},
				MuiDialog: {
					root: {},
				},
				MuiSvgIcon: {
					root: {
						padding: 0,
						margin: 0,
					},
				},
				MuiIconButton: {
					root: {},
				},
				MuiListItemIcon: {
					root: {
						minWidth: '40px',
					},
				},
				MuiDialogTitle: {
					root: {
						// background: Colors.blue[800],
						// color: 'white !important',
						// padding: '10px',
						// fontSize: '130%',
						// padding: '18px 16px 10px 24px',
						justifyContent: 'space-between',
						borderBottom: '1px solid rgba(0, 0, 0, 0.23)',
					},
				},
				MuiDialogContent: {
					root: {
						width: 'auto',
					},
				},
				MuiGridListTileBar: {
					root: {},
				},
				MuiTableSortLabel: {
					icon: {
						fontSize: '0.9rem !important',
						marginLeft: '2px !important',
					},
				}
			},
		}
	);
}

const createDark = () => {
	return createMuiTheme({
			palette: {
				type: 'dark',
				primary: {
					main: '#90caf9',
				},
				error: {
					main: '#FF0022',
				},
			},
			wall: {
				backgroundColor: '#313131',
			},
			cellrange: {
				color: 'white',
				colorlight: 'white',
				underline: 'rgba(255, 255, 255, 0.7)',
			},
			typography: {
				fontSize: 12,
			},
			overrides: {
				MuiAppBar: {
					colorPrimary: {
						backgroundColor: '#212121',
					},
					colorDefault: {
						backgroundColor: '#212121'
					},
					colorEdit: {
						backgroundColor: '#35373b'
					},
				},
				MuiPaper: {
					root: {
						maxWidth: '100vw',
						maxHeight: '100vh',
					},
				},
				MuiTooltip: {
					tooltip: {
						border: '1px solid #333333',
						fontSize: '8pt',
						maxWidth: '200px',
						padding: '5px',
					},
					popper: {
						opacity: '1',
					},
				},
				MuiCheckbox: {
					root: {
						padding: '5px 12px',
					},
				},
				MuiRadio: {
					root: {
						padding: '5px 12px',
					},
				},
				MuiDialog: {
					root: {},
				},
				MuiSvgIcon: {
					root: {
						padding: 0,
						margin: 0,
					},
				},
				MuiIconButton: {
					root: {},
				},
				MuiListItemIcon: {
					root: {
						minWidth: '40px',
					},
				},
				MuiDialogTitle: {
					root: {
						// background: '#212121',
						// padding: '10px',
						// fontSize: '130%',
						borderBottom: '1px solid rgba(255, 255, 255, 0.23);',
						justifyContent: 'space-between',
					},
				},
				MuiDialogContent: {
					root: {
						width: 'auto',
					},
				},
				MuiGridListTileBar: {
					root: {},
				},
				MuiTableSortLabel: {
					icon: {
						fontSize: '0.9rem !important',
						marginLeft: '2px !important',
					},
				}
			},
		}
	);
}

const createByName = () => {
	let theme;
	const name = localStorage.getItem('theme');

	switch (name) {
	case 'Dark':
		theme = createDark();
		JSG.theme = {
			chart: 'dark',
			theme: name,
			graph: '#333333',
			tool: theme.overrides.MuiAppBar.colorPrimary.backgroundColor,
			caption: theme.overrides.MuiAppBar.colorPrimary.backgroundColor,
			captiontext: '#FFFFFF',
			frame: '#FFFFFF',
			splitter: theme.palette.background.paper,
			header: theme.overrides.MuiAppBar.colorPrimary.backgroundColor,
			headertext: '#CCCCCC',
			outline: '#CCCCCC',
			sheet: '#000000',
			grid: '#777777',
			border: '#FFFFFF',
			text: '#FFFFFF',
			textlight: '#DDDDDD',
			fill: '#000000',
			filllight: '#222222',
			selectionback: '#606060',
			feedbackFill: 'rgba(255, 255, 255,0.2)',
			feedbackBorder: 'rgba(255, 255, 255,0.8)',
			scrollBars: {
				arrow: '#999999',
				arrowbk: '#555555',
				range: '#000000',
				background: '#000000',
				thumb: '#555555'
			},
			rangeColors: [
				'#00B0F0',
				'#00FF00',
				'#FFFF00',
				'#ED7D31',
				'#00CC99',
				'#FF99FF',
				'#CCFFCC',
				'#FF3737',
				'#A5A5A5',
				'#FF0066',
			],
			ifTransparency: 60,
		};
		break;
	default:
		theme = createDefault();
		break;
	}

	JSG.FormatAttributes.template = JSG.FormatAttributes.createTemplate();
	JSG.TextFormatAttributes.template = JSG.TextFormatAttributes.createTemplate();
	JSG.CellAttributes.template = JSG.CellAttributes.createTemplate();
	JSG.CellFormatAttributes.template = JSG.CellFormatAttributes.createTemplate();
	JSG.CellTextFormatAttributes.template = JSG.CellTextFormatAttributes.createTemplate();

	return theme;
}

const theme = createByName();

export default theme;
