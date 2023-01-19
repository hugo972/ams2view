import {Table, TableBody, TableCell, TableHead, TableRow, Typography} from "@mui/material";
import {Stack} from "@mui/system";
import _ from "lodash";
import moment from "moment";
import {useMemo} from "react";
import {Date} from "./Date";
import {getPlayerName, getStageName, getTrackName, getVehicleName} from "./utils";
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
                event.stageNameToDataMap,
                (stageData, stageName) =>
                    <Stage
                        key={stageName}
                        stageData={stageData}
                        stageName={stageName}/>)}
        </Stack>);
}

function Stage({stageData, stageName}) {
    const [bestSectors, maxLapsPlayerId, playerLapDatas] =
        useMemo(
            () => {
                const playerLapDatas =
                    _(stageData.playerIdToLapDatasMap).
                        flatMap(
                            (playerLapDatas, playerId) =>
                                _(playerLapDatas).
                                    groupBy(playerLapData => playerLapData.vehicleId).
                                    map(
                                        (playerVehicleLapDatas, vehicleId) => ({
                                            lapDatas: playerVehicleLapDatas,
                                            playerId,
                                            vehicleId
                                        })).
                                    value()).
                        map(
                            ({lapDatas, playerId, vehicleId}) => ({
                                bestLap:
                                    _(lapDatas).
                                        filter(lapData => lapData.valid).
                                        minBy(lapData => lapData.lapTime),
                                id: playerId,
                                laps: _.size(lapDatas),
                                name: getPlayerName(playerId),
                                potentialLapSectors:
                                    _(lapDatas).
                                        filter(lapData => lapData.valid).
                                        reduce(
                                            (potential, playerLapData) =>
                                                _(potential).
                                                    zip(playerLapData.sectors).
                                                    map(_.min).
                                                    value(),
                                            []),
                                vehicleId
                            })).
                        orderBy(
                            playerLapData =>
                                _.isEmpty(stageData.playerIdToPositionMap)
                                    ? playerLapData.bestLap?.lapTime
                                    : stageData.playerIdToPositionMap[playerLapData.id]).
                        value();

                const bestSectors =
                    _(playerLapDatas).
                        filter(playerLapData => playerLapData.bestLap != undefined).
                        map(playerLapData => playerLapData.bestLap.sectors).
                        reduce(
                            (bestSectors, playerLapBestSectors) =>
                                _(playerLapBestSectors).
                                    zip(bestSectors).
                                    map(_.min).
                                    value(),
                            []);

                const maxLapsPlayerId =
                    _(playerLapDatas).
                        groupBy(playerLapData => playerLapData.id).
                        mapValues(
                            playerLapDatas =>
                                _(playerLapDatas).
                                    map(playerLapData => playerLapData.laps).
                                    sum()).
                        toPairs().
                        maxBy(([playerId, laps]) => laps)[0];

                return [bestSectors, maxLapsPlayerId, playerLapDatas];
            },
            []);

    console.log({playerLapDatas})
    return (
        <Stack
            spacing={1}
            style={{padding: 20}}>
            <Typography style={{fontSize: "1.5rem"}}>
                {getStageName(stageName)}
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            #
                        </TableCell>
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
                            playerLapDatas[0].bestLap.sectors,
                            (sector, sectorIndex) =>
                                <TableCell key={sectorIndex}>
                                    Best Time (Sector {sectorIndex + 1})
                                </TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {_.map(
                        playerLapDatas,
                        (playerLapData, playerLapDataIndex) =>
                            <TableRow key={playerLapData.name}>
                                <TableCell>
                                    <Typography
                                        style={{
                                            fontSize: "0.8rem",
                                            fontWeight: 500
                                        }}>
                                        {playerLapDataIndex + 1}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography>
                                        {playerLapData.name}
                                    </Typography>
                                    <Typography style={{fontSize: "0.6rem"}}>
                                        {getVehicleName(playerLapData.vehicleId)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack
                                        alignItems="center"
                                        direction="row"
                                        spacing={1}>
                                        <Typography>
                                            {playerLapData.laps}
                                        </Typography>
                                        {playerLapData.id === maxLapsPlayerId &&
                                            <img
                                                src="/digger.png"
                                                style={{
                                                    height: 24,
                                                    width: 24
                                                }}/>}
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Stack
                                        alignItems="center"
                                        direction="row"
                                        spacing={1}>
                                        <Typography>
                                            {playerLapData.bestLap == undefined
                                                ? "-"
                                                : moment.
                                                    duration(playerLapData.bestLap.lapTime, "milliseconds").
                                                    format("m:ss.SSS")}
                                        </Typography>
                                        {playerLapDataIndex > 0 &&
                                            playerLapData.bestLap != undefined &&
                                            <Typography
                                                style={{
                                                    color: "#c01717",
                                                    fontSize: "0.6rem",
                                                    fontWeight: 600
                                                }}>
                                                {moment.
                                                    duration(playerLapData.bestLap.lapTime - playerLapDatas[0].bestLap.lapTime, "milliseconds").
                                                    format(
                                                        "+s.SSS",
                                                        {
                                                            trim: "both",
                                                            stopTrim: "s"
                                                        })}
                                            </Typography>}
                                    </Stack>
                                    <Typography style={{fontSize: "0.6rem"}}>
                                        {moment.
                                            duration(_.sum(playerLapData.potentialLapSectors), "milliseconds").
                                            format("(m:ss.SSS)")}
                                    </Typography>
                                </TableCell>
                                {_.map(
                                    playerLapData.bestLap?.sectors ?? playerLapData.potentialLapSectors,
                                    (sector, sectorIndex) =>
                                        <TableCell
                                            key={sectorIndex}
                                            style={
                                                sector === bestSectors[sectorIndex]
                                                    ? {
                                                        backgroundColor: "rgb(170 122 255)",
                                                        color: "white"
                                                    }
                                                    : undefined}>
                                            <Typography>
                                                {playerLapData.bestLap == undefined
                                                    ? "-"
                                                    : moment.
                                                        duration(sector, "milliseconds").
                                                        format("m:ss.SSS")}
                                            </Typography>
                                            <Typography style={{fontSize: "0.6rem"}}>
                                                {moment.
                                                    duration(playerLapData.potentialLapSectors[sectorIndex], "milliseconds").
                                                    format("(m:ss.SSS)")}
                                            </Typography>
                                        </TableCell>)}
                            </TableRow>)}
                </TableBody>
            </Table>
        </Stack>);
}