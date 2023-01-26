import _ from "lodash";
import {useMemo} from "react";
import {createFetchStore} from "react-suspense-fetch";
import {loadUtilData} from "./utils";
import {Event} from "./Event";
import {useRoute} from "./useRoute";
import {Events} from "./Events";

const store =
    createFetchStore(
        async () => {
            const res =
                window.location.hostname === "localhost"
                    ? await fetch("/testdata.json")
                    : await fetch("/data/sms_stats_data.json");
            const dataText = await res.text();

            const dataStartIndex = dataText.indexOf("{");
            const dataEndIndex = dataText.lastIndexOf("}") + 1;

            return JSON.parse(dataText.slice(dataStartIndex, dataEndIndex));
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

    const {eventId} = useRoute("/{eventId}");
    const event =
        _.find(
            events,
            event => event.id === eventId);
    return event == undefined
        ? <Events events={events}/>
        : <Event event={event}/>;
}

function getEvent(record) {
    let eventType;
    if (_.has(record.stages, "practice1") &&
        (_.size(record.stages) === 1 ||
            record.setup.RaceLength === 1)) {
        eventType = "practice";
        record.stages = {
            practice1: record.stages.practice1
        };
    } else if (record.finished && _.has(record.stages, "race1")) {
        eventType = "race";
    } else {
        return undefined;
    }

    function getPlayerData(event) {
        let participant =
            _.find(
                record.participants,
                participant => participant.RefId.toString() === event.refid.toString());
        if (participant == undefined &&
            _.isObject(record.participants)) {
            participant =
                _.get(
                    record.participants,
                    event.participantid);
        }

        if (participant == undefined) {
            console.log("player not found", {event, record});
            return undefined;
        }

        return {
            id: participant.SteamID ?? participant.Name,
            vehicleId: participant.VehicleId
        };
    }

    const stageNameToDataMap =
        _(record.stages).
            mapValues(
                stage => ({
                    playerIdToLapDatasMap:
                        _(stage.events).
                            filter(
                                event =>
                                    event.event_name === "Lap" &&
                                    event.is_player &&
                                    getPlayerData(event) != undefined).
                            groupBy(event => getPlayerData(event).id).
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
                                                time: event.time,
                                                valid: event.attributes.CountThisLapTimes === 1,
                                                vehicleId: getPlayerData(event).vehicleId
                                            })).
                                        filter(event => event.sectors.length === 3).
                                        value()).
                            value(),
                    playerIdToPositionMap:
                        _(stage.results).
                            filter(result => getPlayerData(result) != undefined).
                            keyBy(result => getPlayerData(result).id).
                            mapValues(result => result.attributes.RacePosition).
                            value()
                })).
            pickBy(stageDataMap => !_.isEmpty(stageDataMap.playerIdToLapDatasMap)).
            value();

    return {
        endTime: record.end_time || record.start_time,
        events: 1,
        id: btoa(record.start_time),
        stageNameToDataMap,
        startTime: record.start_time,
        trackId: record.setup.TrackId,
        type: eventType
    };
}