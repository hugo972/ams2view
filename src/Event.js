import {Table, TableBody, TableCell, TableHead, TableRow, Typography} from "@mui/material";
import {Stack} from "@mui/system";
import _ from "lodash";
import moment from "moment";
import {useMemo} from "react";
import {Date} from "./Date";
import {getPlayerName, getTrackName} from "./utils";
import {EventPlayersChip, EventTypeChip} from "./EventChips";

export function Event({event}) {
    return (
        <Stack
            alignItems="flex-start"
            style={{padding: 20}}
            spacing={1}>
            <Typography style={{fontSize: "2rem"}}>
                {getTrackName(event.trackId)}
            </Typography>
            <Date temporal={event}/>
            <Stack
                direction="row"
                spacing={1}>
                <EventTypeChip event={event}/>
                <EventPlayersChip event={event}/>
            </Stack>
            {_.map(
                event.stageNameToPlayerDataMap,
                (playerDataMap, stageName) =>
                    <Stage
                        event={event}
                        key={stageName}
                        playerDataMap={playerDataMap}
                        stageName={stageName}/>)}
        </Stack>);
}

function Stage({event, playerDataMap, stageName}) {
    const playerBestLaps =
        useMemo(
            () =>
                _(playerDataMap).
                    map(
                        (playerData, playerId) => ({
                            laps: _.size(playerData),
                            name: getPlayerName(playerId),
                            ..._.minBy(
                                playerData,
                                playerData =>
                                    playerData.lapTime)
                        })).
                    orderBy(
                        playerBestLap =>
                            event.type === "race"
                                ? playerBestLap.position
                                : playerBestLap.lapTime).
                    value(),
            []);

    return (
        <Stack
            spacing={1}
            style={{padding: 20}}>
            <Typography style={{fontSize: "1.5rem"}}>
                {stageName}
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            Name
                        </TableCell>
                        <TableCell>
                            Laps
                        </TableCell>
                        <TableCell>
                            Best Time
                        </TableCell>
                        {_.map(
                            playerBestLaps[0].sectors,
                            (sector, sectorIndex) =>
                                <TableCell key={sectorIndex}>
                                    Best Time (Sector {sectorIndex + 1})
                                </TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {_.map(
                        playerBestLaps,
                        playerBestLap =>
                            <TableRow key={playerBestLap.name}>
                                <TableCell>
                                    {playerBestLap.name}
                                </TableCell>
                                <TableCell>
                                    {playerBestLap.laps}
                                </TableCell>
                                <TableCell>
                                    {moment.duration(playerBestLap.lapTime, "milliseconds").
                                            format("m:ss.SSS")}
                                </TableCell>
                                {_.map(
                                    playerBestLap.sectors,
                                    (sector, sectorIndex) =>
                                        <TableCell key={sectorIndex}>
                                            {moment.
                                                duration(sector, "milliseconds").
                                                format("m:ss.SSS")}
                                        </TableCell>)}
                            </TableRow>)}
                </TableBody>
            </Table>
        </Stack>);
}