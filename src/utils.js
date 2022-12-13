export function getTrackName(trackId) {
    return {
        [-191952188]: "Watkins Glen",
        1534602052: "Brands Hatch",
        1820168870: "Oulton Park Island"
    }[trackId] ?? trackId;
}