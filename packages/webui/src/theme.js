import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import * as Colors from '@material-ui/core/colors/index';

const theme = createMuiTheme({
	palette: {
		primary: {
			main: '#1565c0',
		},
		// secondary: {
		// 	main: '#c01565',
		// },
		error: {
			main: '#FF0022',
		},
	},
	typography: {
		useNextVariants: true,
		fontSize: 12,
	},
	overrides: {
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
				textAlign: 'center',
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
});

export default theme;
