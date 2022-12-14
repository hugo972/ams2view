import {Drawer, List, ListItemButton, Typography} from "@mui/material";
import {Stack} from "@mui/system";
import _ from "lodash";
import {Fragment, useMemo, useState} from "react";
import {createFetchStore} from "react-suspense-fetch";
import {Date} from "./Date";
import {getTrackName, loadUtilData} from "./utils";
import {Event} from "./Event";
import {EventPlayersChip, EventTypeChip} from "./EventChips";

const store =
    createFetchStore(
        async () => {
            const res =
                window.location.hostname === "localhost"
                    ? await fetch("/testdata.json")
                    : await fetch("/stats");
            const data = await res.json();
            return data;
        });

store.prefetch();

export function App() {
    loadUtilData();
    const result = store.get();
    const events =
        useMemo(
            () => {
                const events = [];
                const records =
                    _.orderBy(
                        result.stats.history,
                        record => record.start_time);
                for (const record of records) {
                    const event = getEvent(record);
                    if (_.isEmpty(event?.stageNameToDataMap)) {
                        continue;
                    }

                    const currentEvent =
                        _.find(
                            events,
                            currentEvent =>
                                event.type === "practice" &&
                                currentEvent?.trackId === event.trackId &&
                                currentEvent?.type === "practice");
                    if (currentEvent == undefined) {
                        events.push(event);
                    } else {
                        currentEvent.endTime = event.endTime;
                        currentEvent.events++;
                        currentEvent.stageNameToDataMap =
                            _.mergeWith(
                                currentEvent.stageNameToDataMap,
                                event.stageNameToDataMap,
                                (stageData, otherStageData) => ({
                                    playerIdToLapDatasMap:
                                        _.mergeWith(
                                            stageData.playerIdToLapDatasMap,
                                            otherStageData.playerIdToLapDatasMap,
                                            (lapDatas, otherLapDatas) =>
                                                _(lapDatas).
                                                    concat(otherLapDatas).
                                                    filter().
                                                    value())
                                }));
                    }
                }

                return _.orderBy(
                    events,
                    event => event.endTime,
                    "desc");
            },
            [result]);

    const [selectedEvent, setSelectedEvent] = useState();
    return (
        <Fragment>
            <List>
                {_.map(
                    events,
                    (event, eventIndex) =>
                        <ListItemButton
                            key={eventIndex}
                            style={{padding: 10}}
                            onClick={() => setSelectedEvent(event)}>
                            <Stack
                                alignItems="center"
                                direction="row"
                                spacing={2}>
                                <Typography style={{fontSize: "1.5rem"}}>
                                    {getTrackName(event.trackId)}
                                </Typography>
                                <Stack
                                    direction="row"
                                    spacing={1}>
                                    <EventTypeChip event={event}/>
                                    <EventPlayersChip event={event}/>
                                </Stack>
                                <Date temporal={event}/>
                            </Stack>
                        </ListItemButton>)}
            </List>
            <Drawer
                anchor="right"
                open={selectedEvent != undefined}
                onClose={() => setSelectedEvent(undefined)}>
                {selectedEvent != undefined &&
                    <Event event={selectedEvent}/>}
            </Drawer>
        </Fragment>);
}

function getEvent(record) {
    let eventType;
    if (_.size(record.stages) === 1 &&
        _.has(record.stages, "practice1")) {
        eventType = "practice";
    } else if (record.finished && _.has(record.stages, "race1")) {
        eventType = "race";
    } else {
        return undefined;
    }

    const participantMap =
        _.isArray(record.participants)
            ? _(record.participants).
                toPairs().
                keyBy(([participantIndex]) => parseInt(participantIndex) + 1).
                mapValues(([participantIndex, participant]) => participant).
                value()
            : record.participants;
    const stageNameToDataMap =
        _(record.stages).
            mapValues(
                stage => ({
                    playerIdToLapDatasMap:
                        _(stage.events).
                            filter(
                                event =>
                                    event.event_name === "Lap" &&
                                    event.is_player).
                            groupBy(event => participantMap[event.participantid].SteamID).
                            mapValues(
                                events =>
                                    _(events).
                                        map(
                                            event => ({
                                                lap: event.attributes.Lap,
                                                lapTime: event.attributes.LapTime,
                                                sectors:
                                                    _(event.attributes).
                                                        map(
                                                            (attributeValue, attributeName) =>
                                                                _.startsWith(attributeName, "Sector")
                                                                    ? attributeValue
                                                                    : undefined).
                                                        filter().
                                                        value(),
                                                valid: event.attributes.CountThisLapTimes === 1,
                                                vehicleId: participantMap[event.participantid].VehicleId
                                            })).
                                        filter(event => event.sectors.length === 3).
                                        value()).
                            value(),
                    playerIdToPositionMap:
                        _(stage.results).
                            keyBy(result => participantMap[result.participantid].SteamID).
                            mapValues(result => result.attributes.RacePosition).
                            value()
                })).
            pickBy(stageDataMap => !_.isEmpty(stageDataMap.playerIdToLapDatasMap)).
            value();

    return {
        endTime: record.end_time || record.start_time,
        events: 1,
        stageNameToDataMap,
        startTime: record.start_time,
        trackId: record.setup.TrackId,
        type: eventType
    };
}