import {Stack, Typography} from "@mui/material";
import moment from "moment";

export function Date({format = "L LT", temporal}) {
    return (
        <Stack>
            <Typography style={{fontSize: "0.8rem"}}>
                {moment.
                    unix(temporal.startTime).
                    format(format)}
            </Typography>
            {temporal.endTime !== 0 &&
                <Typography style={{fontSize: "0.8rem"}}>
                    {moment.
                        unix(temporal.endTime).
                        format(format)}
                </Typography>}
        </Stack>);
}