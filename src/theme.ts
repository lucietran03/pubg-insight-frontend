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
});

export default theme;
