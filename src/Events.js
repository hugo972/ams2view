import {List, ListItemButton, Typography} from "@mui/material";
import {Stack} from "@mui/system";
import _ from "lodash";
import {Date} from "./Date";
import {getTrackName} from "./utils";
import {EventPlayersChip, EventTypeChip} from "./EventChips";
import {Online} from "./Online";
import {setRoute} from "./useRoute";

export function Events({events}) {
    return (
        <Stack alignItems="flex-start">
            <Online events={events}/>
            <List>
                {_.map(
                    events,
                    (event, eventIndex) =>
                        <ListItemButton
                            key={eventIndex}
                            style={{padding: 10}}
                            onClick={() => setRoute("/{eventId}", {eventId: event.id})}>
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
        </Stack>);
}