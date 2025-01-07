import { createTheme } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

const theme = createTheme({
    palette: {
      primary: {
        // light: will be calculated from palette.primary.main,
        main: grey[50],
        // dark: will be calculated from palette.primary.main,
        // contrastText: will be calculated to contrast with palette.primary.main
      },
      secondary: {
        main: '#F7931A'
      },
      // Provide every color token (light, main, dark, and contrastText) when using
      // custom colors for props in Material UI's components.
      // Then you will be able to use it like this: `<Button color="custom">`
      // (For TypeScript, you need to add module augmentation for the `custom` value)
      custom: {
        main: '#F7931A'
      },
      text: {
        primary: grey[50]
      },
      white: {
        main: grey[100],
        light: grey[50],
        dark: grey[500]
      },
      // Used by `getContrastText()` to maximize the contrast between
      // the background and the text.
      contrastThreshold: 3,
      // Used by the functions below to shift a color's luminance by approximately
      // two indexes within its tonal palette.
      // E.g., shift from Red 500 to Red 300 or Red 700.
      tonalOffset: 0.2,
    },
    components: {
      MuiPaper:{
        styleOverrides: {
          root:{
            boxShadow: "1px 1px 1px 0px #343434",
            backgroundColor: "#0A0A0A"
          }
        }
      },
      MuiTypography:{
        styleOverrides: {
          root:{
            color: grey[50]
          }
        }
      },
      MuiTextField:{
        styleOverrides: {
          root:{
            width: '100%',
            backgroundColor: grey[900],
            opacity: 0.825,
          }
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: '#F7931A' ,
            "&.Mui-disabled": {
              color: '#F7931A'
            },
            "&.Mui-focused": {
              color: grey[400]
            }
          }
        }
      },
      MuiInputBase: {
        styleOverrides:{
          root:{
            "&.Mui-disabled": {
              color: grey[400],
              "-webkit-text-fill-color": grey[400]
            }
          },
          input:{
            color: grey[50],
            "&.Mui-disabled": {
              color: grey[400],
              "-webkit-text-fill-color": grey[400]
            }
          }
        }
      },
      MuiFilledInput: {
        styleOverrides:{
          root:{
            color: grey[50],
            "&.Mui-disabled": {
              color: grey[400],
              "-webkit-text-fill-color": grey[400]
            }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          input:{
            color: grey[50]
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root:{
            minWidth: "50px",
            "&.Mui-disabled": {
              color: grey[400]
            },
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root:{
            "&.Mui-disabled": {
              color: grey[400]
            },
            "&.MuiPickersArrowSwitcher-button":{
              color: grey[900]
            },
            "&.MuiPickersCalendarHeader-switchViewButton":{
              color: grey[900]
            }
          }
        }
      },
      MuiCircularProgress: {
        styleOverrides: {
          root:{
            color: grey[50],
            "&.Mui-disabled": {
              color: grey[50]
            }
          }
        }
      },
      MuiSvgIcon: {
        styleOverrides:{
          root:{
            "&.MuiDataGrid-booleanCell":{
              color: '#fafafa !important',
            }
          }
        }
      },
      MuiSwitch:{
        styleOverrides:{
          track:{
            backgroundColor: "#F7931A"
          }
        }
      },
      MuiStack: {
        styleOverrides: {
          root: {
            width: "100%",
            "&.MuiInputLabel-root": {
              left: "12px"
            }
          }
        }
      },
      MuiSpeedDial: {
        styleOverrides: {
          root: {
            ".MuiButtonBase-root": {
              ".MuiTouchRipple-root":{
                backgroundColor: grey[50],
                color: grey[50]
              }
            }
          }
        },
      },
      MuiSpeedDialIcon: {
        styleOverrides: {
          root: {
            color: "#343434",
            zIndex: 1
          }
        }
      },
      MuiSpeedDialAction: {
        styleOverrides: {
          fab: {
            ".MuiSvgIcon-root": {
              zIndex: 1,
              color: "#343434"
            }
          }
        }
      },
      MuiTab: {
        styleOverrides: {
          root:{
            "&.Mui-selected": {
              color: grey[50]
            },
            color: grey[50]
          },
        }
      },
      
      MuiDialog:{
        styleOverrides: {
          root: {
            ".MuiDialog-paperFullScreen":{
              maxHeight: "100%",
              height: "auto",
              position: "absolute",
              bottom: 0
            }
          }
        }
      }
    },
});

export default theme;