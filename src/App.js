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
                    if (_.isEmpty(event?.stageNameToPlayerDataMap)) {
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
                        currentEvent.stageNameToPlayerDataMap =
                            _.mergeWith(
                                currentEvent.stageNameToPlayerDataMap,
                                event.stageNameToPlayerDataMap,
                                (playerDataMap, otherPlayerDataMap) =>
                                    _.mergeWith(
                                        playerDataMap,
                                        otherPlayerDataMap,
                                        (playerData, otherPlayerData) =>
                                            _(playerData).
                                                concat(otherPlayerData).
                                                filter().
                                                value()));
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
    } else if (record.finished) {
        eventType =
            _.has(record.stages, "race1")
                ? "race"
                : "qualifying";
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
    const stageNameToPlayerDataMap =
        _(record.stages).
            mapValues(
                stage =>
                    _(stage.events).
                        filter(
                            event =>
                                event.event_name === "Lap" &&
                                event.is_player).
                        groupBy(event => participantMap[event.participantid].SteamID).
                        mapValues(
                            events =>
                                _.map(
                                    events,
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
                                        vehicleId: participantMap[event.participantid].VehicleId
                                    }))).
                        value()).
            pickBy(playerDataMap => !_.isEmpty(playerDataMap)).
            value();
    
    function getRaceResults() {
        if (eventType !== "race") {
            return undefined;
        }
        
        return {
            stageNameToPlayerIdToPositionMap: {}
        };
    }
    
    return {
        endTime: record.end_time || record.start_time,
        events: 1,
        stageNameToPlayerDataMap,
        startTime: record.start_time,
        trackId: record.setup.TrackId,
        type: eventType
    };
}