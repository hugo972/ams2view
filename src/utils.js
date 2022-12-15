﻿export function getTrackName(trackId) {
    return {
        [-191952188]: "Watkins Glen",
        1534602052: "Brands Hatch",
        1820168870: "Oulton Park Island"
    }[trackId] ?? trackId;
}

export function getPlayerName(playerId) {
    return {
        "76561198085065530": "Yaron",
        "76561198867460999": "Moshe",
        "76561198883944056": "Saar",
        "76561199217542200": "Avihai",
        "76561199262975610": "Barak",
        "76561198847610319": "Yoram",
        "76561199005801087": "Tom",
        "76561198830567733": "Tzion"
    }[playerId] ?? playerId;
}