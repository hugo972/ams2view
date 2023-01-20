let utilsData;

export function loadUtilData() {
    if (utilsData != undefined) {
        return;
    }

    throw (async () => {
        const utilsDataResponse =
            window.location.hostname === "localhost"
                ? await fetch("/utils.json")
                : await fetch("http://automobilista.ddns.net:8081/utils.json");

        utilsData = await utilsDataResponse.json();
    })();
}

export function getPlayerName(playerId) {
    return utilsData.playerIdToNameMap[playerId] ?? playerId;
}

export function getStageName(stageName) {
    return (
        stageName.
            charAt(0).
            toUpperCase() +
        stageName.
            substring(1, stageName.length - 1).
            toLowerCase());
}

export function getTrackName(trackId) {
    return utilsData.trackIdToNameMap[trackId] ?? trackId;
}

export function getVehicleName(vehicleId) {
    return utilsData.vehicleIdToNameMap[vehicleId] ?? vehicleId;
}