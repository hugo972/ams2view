import {useMemo} from "react";
import moment from "moment";
import {Chip} from "@mui/material";
import {getPlayerName} from "./utils";

export function Online({events}) {
    const onlinePayerIds =
        useMemo(
            () => {
                const onlineTime =
                    moment().
                        subtract("5", "m").
                        unix();
                return _(events).
                    flatMap(event => _.values(event.stageNameToDataMap)).
                    flatMap(
                        stageData =>
                            _(stageData.playerIdToLapDatasMap).
                                mapValues(
                                    lapDatas =>
                                        _(lapDatas).
                                            map(lapData => lapData.time).
                                            max() > onlineTime).
                                pickBy().
                                keys().
                                value()).
                    uniq().
                    value();
            },
            []);

    if (_.isEmpty(onlinePayerIds)) {
        return (
            <Chip
                color="warning"
                label="No online players"/>);
    } else {
        return (
            <Chip
                color="success"
                label={
                    `Online players:
                     ${_(onlinePayerIds).
                        map(onlinePayerId => getPlayerName(onlinePayerId)).
                        join(", ")}`}/>);
    }
}