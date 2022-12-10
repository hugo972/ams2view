const express = require("express");
const fs = require("fs");
const path = require("path");

const serverPort = parseInt(process.argv[2]);
const statsFilePath = process.argv[3];

const clientBuiltPath = path.join(__dirname, "../console/build");
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
        const statsFileData =
            fs.readFileSync(
                statsFilePath,
                {
                    encoding: "utf8",
                    flag: "r"
                });

        const dataStartIndex = statsFileData.indexOf("{");
        const dataEndIndex = statsFileData.lastIndexOf("}") + 1;

        res.contentType("application/json");
        res.send(statsFileData.slice(dataStartIndex, dataEndIndex));
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