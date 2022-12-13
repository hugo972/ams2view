const express = require("express");
const path = require("path");
const request = require("request");

const serverPort = process.env.PORT || 3000;
const statsFilePath = "http://automobilista.ddns.net:8081/";
const clientBuiltPath = path.join(__dirname, "../build");
const app = express();

app.use(express.static(clientBuiltPath));

app.get(
    "/",
    (req, res) => {
        res.sendFile(path.join(clientBuiltPath, "index.html"));
    });

app.get(
    "/stats",
    (req, res) => {
        request.get(
            statsFilePath,
            (err, fileRes, statsFileData) => {
                if (!err) {
                    const dataStartIndex = statsFileData.indexOf("{");
                    const dataEndIndex = statsFileData.lastIndexOf("}") + 1;

                    res.contentType("application/json");
                    res.send(statsFileData.slice(dataStartIndex, dataEndIndex));
                }
            });
    });

console.log(
    "AMS2 Simrace Server\n\n",
    `port: ${serverPort}\n`,
    "paths:\n",
    {
        "(default)": `${clientBuiltPath}/index.html`,
        "/stats": statsFilePath,
        "/*": `${clientBuiltPath}/*`
    });

app.listen(serverPort);