const puppeteer = require('puppeteer');

var admin = require("firebase-admin");
var serviceAccount = require("./.env/serviceAccountKey.json");

const MAIN_URL = "http://washalert.washlaundry.com/washalertweb/calpoly/cal-poly.html"

// Initialize Firebase
var defaultApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://washalertapi.firebaseio.com"
});
var defaultAuth = defaultApp.auth();
var defaultDatabase = defaultApp.database();

process.setMaxListeners(0);

function processVillageData(table) {
    let villageList = [];
    var i = 0;
    while (i < table.rows.length) {
        let row = table.rows[i];
        villageList.push({
            name: row.cells[0].innerText,
            url: row.cells[0].children[0].href,
            locations: []
        });
        i++;
    }
    return villageList;
}

function processLocationData(table) {
    let locationList = [];
    var i = 1;
    while (i < table.rows.length) {
        let row = table.rows[i];
        locationList.push({
            name: row.cells[0].innerText,
            url: row.cells[0].children[0].href,
            machines: []
        });
        i++;
    }
    return locationList;
}

function processMachineData(table) {
    let machineList = [];
    var i = 3;
    while (i < table.rows.length) {
        let row = table.rows[i];
        machineList.push({
            name: row.cells[0].innerText,
            type: row.cells[1].innerText,
            status: row.cells[2].innerText,
            time: row.cells[3].innerText
        });
        i++;
    }
    return machineList;
}

async function fetchVillages(url) {
    console.log("Fetching Data...");
    const browser = await puppeteer.launch({
        headless: true, // false: enables one to view the Chrome instance in action
        defaultViewport: null, // (optional) useful only in non-headless mode
    });
    const page = await browser.newPage();
    page.on('console', consoleMessageObject => function (consoleMessageObject) {
        if (consoleMessageObject._type !== 'warning') {
            console.log(consoleMessageObject._text)
        }
    });
    page.on('console', (msg) => console[msg._type]('PAGE LOG:', msg._text));

    await page.goto(url, { waitUntil: 'networkidle2' });
    const villageList = await page.$eval('table', processVillageData);
    await browser.close();

    const promises = villageList.map(async village => fetchLocations(village).then((result) => village.locations = result));
    await Promise.all(promises);

    return villageList;
}

async function fetchLocations(village) {
    const browser = await puppeteer.launch({
        headless: true, // false: enables one to view the Chrome instance in action
        defaultViewport: null, // (optional) useful only in non-headless mode
    });
    const page = await browser.newPage();
    page.on('console', consoleMessageObject => function (consoleMessageObject) {
        if (consoleMessageObject._type !== 'warning') {
            console.log(consoleMessageObject._text)
        }
    });
    page.on('console', (msg) => console[msg._type]('PAGE LOG:', msg._text));

    await page.goto(village.url, { waitUntil: 'networkidle2' });
    const locationList = await page.$eval('table', processLocationData);
    await browser.close();

    const promises = locationList.map(async location => fetchMachines(location).then((result) => location.machines = result));
    await Promise.all(promises);

    return locationList;
}

async function fetchMachines(location) {
    const browser = await puppeteer.launch({
        headless: true, // false: enables one to view the Chrome instance in action
        defaultViewport: null, // (optional) useful only in non-headless mode
    });
    const page = await browser.newPage();
    page.on('console', consoleMessageObject => function (consoleMessageObject) {
        if (consoleMessageObject._type !== 'warning') {
            console.log(consoleMessageObject._text)
        }
    });
    page.on('console', (msg) => console[msg._type]('PAGE LOG:', msg._text));

    await page.goto(location.url, { waitUntil: 'networkidle2' });
    const machineTable = await page.$eval('table', processMachineData);
    await browser.close();

    return machineTable;
};

setInterval(() => fetchVillages(MAIN_URL).then((result) => defaultDatabase.ref('/').set(result)), 30000);