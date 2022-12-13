import {Drawer, List, ListItemButton, Typography} from "@mui/material";
import {Stack} from "@mui/system";
import _ from "lodash";
import {Fragment, useMemo, useState} from "react";
import {createFetchStore} from "react-suspense-fetch";
import {Date} from "./Date";
import {getTrackName} from "./utils";
import {Event} from "./Event";
import {EventPlayersChip, EventTypeChip} from "./EventChips";

const store =
    createFetchStore(
        async () => {
            const res = await fetch("/stats");
            const data = await res.json();
            return data;
        });

store.prefetch();

export function App() {
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
                    if (_.isEmpty(event.stageNameToPlayerNameToDataMap)) {
                        continue;
                    }

                    const currentEvent = _.last(events);
                    if (event.type === "practice" &&
                        currentEvent?.trackId === event.trackId &&
                        currentEvent?.type === "practice") {
                        currentEvent.endTime = event.endTime;
                        currentEvent.events++;
                        currentEvent.stageNameToPlayerNameToDataMap =
                            _.mergeWith(
                                currentEvent.stageNameToPlayerNameToDataMap,
                                event.stageNameToPlayerNameToDataMap,
                                (playerNameToDataMap, otherPlayerNameToDataMap) =>
                                    _.mergeWith(
                                        playerNameToDataMap,
                                        otherPlayerNameToDataMap,
                                        (playerData, otherPlayerData) => _(playerData).
                                            concat(otherPlayerData).
                                            filter().
                                            value()));
                    } else {
                        events.push(event);
                    }
                }

                return _.orderBy(
                    events,
                    event => event.startTime,
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
    } else {
        eventType =
            _.has(record.stages, "race1")
                ? "race"
                : "qualifying";
    }

    const stageNameToPlayerNameToDataMap =
        _(record.stages).
            mapValues(
                stage =>
                    _(stage.events).
                        filter(
                            event =>
                                event.event_name === "Lap" &&
                                event.is_player).
                        groupBy(event => event.name).
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
                                                value()
                                    }))).
                        value()).
            pickBy(playerNameToDataMap => !_.isEmpty(playerNameToDataMap)).
            value();

    return {
        endTime: record.end_time,
        events: 1,
        stageNameToPlayerNameToDataMap,
        startTime: record.start_time,
        trackId: record.setup.TrackId,
        type: eventType
    };
}