import {useEffect, useMemo, useState} from "react";
import {createBrowserHistory} from "history";

export const browserHistory = createBrowserHistory();

export function useRoute(route) {
    const [, setRefresh] = useState({});
    useEffect(
        () => {
            const unregister =
                browserHistory.listen(
                    () => {
                        setRefresh({});
                    });

            return () => {
                unregister();
            };
        },
        []);


    return useMemo(
        () => {
            const locationPathParts = window.location.pathname.split("/");
            let locationPathPartIndex = -1;
            const templatePathParts = route.split("/");

            const routeResult = {match: true};
            for (const templatePathPart of templatePathParts) {
                locationPathPartIndex++;

                if (templatePathPart.startsWith("{")) {
                    const parameterName = templatePathPart.substring(1, templatePathPart.length - 1);
                    if (!_.isEmpty(locationPathParts[locationPathPartIndex])) {
                        routeResult[parameterName] = decodeURIComponent(locationPathParts[locationPathPartIndex]);
                    }
                } else if (templatePathPart !== locationPathParts[locationPathPartIndex]) {
                    return routeResult.match = false;
                }
            }

            return routeResult;
        },
        [window.location.pathname]);
}

export function setRoute(route, parameterMap, options) {
    options =
        _.merge(
            {
                appendBrowserHistory: true,
                preserveSearchString: false
            },
            options);

    let routePath = buildRoute(route, parameterMap);
    routePath =
        options.preserveSearchString || !options.appendBrowserHistory
            ? `${routePath}${browserHistory.location.search}`
            : routePath;
    options.appendBrowserHistory
        ? browserHistory.push(routePath)
        : browserHistory.replace(routePath);
}

export function buildRoute(route, parameterMap) {
    _.each(
        parameterMap ?? {},
        (parameterValue, parameterName) => route = route.replace(`{${parameterName}}`, parameterValue));
    return route;
}