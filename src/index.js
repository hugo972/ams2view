import {CircularProgress, createTheme, ThemeProvider} from "@mui/material";
import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";
import React, {Suspense} from "react";
import ReactDOM from "react-dom/client";
import {App} from "./App";
import {Stack} from "@mui/system";

momentDurationFormatSetup(moment);

const theme =
    createTheme({
        typography: {
            fontSize: 12
        }
    });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <Suspense
                fallback={
                    <Stack alignItems="center">
                        <CircularProgress/>
                    </Stack>}>
                <App/>
            </Suspense>
        </ThemeProvider>
    </React.StrictMode>);