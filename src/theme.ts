import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#F2A900",
    },
    secondary: {
      main: "#4B5320",
    },
    background: {
      default: "#121212",
      paper: "#1C1C1C",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
        },
      },
    },
  },
});

export default theme;
