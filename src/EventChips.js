import {Chip} from "@mui/material";
import _ from "lodash";

export function EventTypeChip({event}) {
    return (
        <Chip
            color={
                event.type === "race"
                    ? "secondary"
                    : event.type === "qualifying"
                        ? "warning"
                        : "info"}
            label={event.type}
            size="small"/>);
}

export function EventPlayersChip({event}) {
    const firstStagePlayerIdToLapDatasMap =
        _(event.stageNameToDataMap).
            values().
            first().playerIdToLapDatasMap;
    return (
        <Chip
            label={_.size(firstStagePlayerIdToLapDatasMap) + " Players"}
            size="small"/>);
}