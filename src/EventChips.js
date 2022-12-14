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
    return (
        <Chip
            label={
                _.size(
                    _(event.stageNameToPlayerDataMap).
                        values().
                        first()) + " Players"}
            size="small"/>);
}