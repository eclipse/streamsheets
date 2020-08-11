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
				useNextVariants: true,
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
				MuiDialogTitle: {
					root: {
						background: Colors.blue[800],
						color: 'white !important',
						padding: '10px',
						fontSize: '130%',
						justifyContent: 'space-between',
					},
				},
				MuiDialogContent: {
					root: {
						width: 'auto',
					},
				},
				MuiTypography: {
					title: {
						color: 'white',
					},
					h6: {
						color: 'white',
					},
				},
				MuiGridListTileBar: {
					root: {},
				},
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
				useNextVariants: true,
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
				MuiDialogTitle: {
					root: {
						background: '#212121',
						padding: '10px',
						fontSize: '130%',
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
			feedbackFill: 'rgba(255, 255, 255,0.2)',
			feedbackBorder: 'rgba(255, 255, 255,0.8)',
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
