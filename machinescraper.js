const puppeteer = require('puppeteer');

const MAIN_URL = "http://washalert.washlaundry.com/washalertweb/calpoly/cal-poly.html"

process.setMaxListeners(0);

const machineList = {}

function processVillageData(table) {
    let villageList = {};
    var i = 0;
    while (i < table.rows.length) {
        let row = table.rows[i];
        villageList[row.cells[0].innerText] = {
            name: row.cells[0].innerText,
            url: row.cells[0].children[0].href,
            locations: {}
        };
        i++;
    }
    return villageList;
}

function processLocationData(table) {
    let locationList = {};
    var i = 1;
    while (i < table.rows.length) {
        let row = table.rows[i];
        locationList[row.cells[0].innerText] = {
            name: row.cells[0].innerText,
            url: row.cells[0].children[0].href,
            machines: {}
        };
        i++;
    }
    return locationList;
}

function processMachineData(table) {
    let machineList = {};
    var i = 3;
    while (i < table.rows.length) {
        let row = table.rows[i];
        machineList[row.cells[0].innerText] = {
            name: row.cells[0].innerText,
            type: row.cells[1].innerText,
            status: row.cells[2].innerText,
            time: row.cells[3].innerText
        };
        i++;
    }
    return machineList;
}

async function fetchVillages(url) {
    console.log("[Machine Scraper] Fetching Data...");
    const browser = await puppeteer.launch({
        headless: true, // false: enables one to view the Chrome instance in action
        defaultViewport: null, // (optional) useful only in non-headless mode
    });
    const page = await browser.newPage();
    // page.on('console', consoleMessageObject => function (consoleMessageObject) {
    //     if (consoleMessageObject._type !== 'warning') {
    //         console.log(consoleMessageObject._text)
    //     }
    // });
    // page.on('console', (msg) => console[msg._type]('PAGE LOG:', msg._text));

    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(url, { waitUntil: 'networkidle2' });
    const villageList = await page.$eval('table', processVillageData);
    await browser.close();

    const promises = Object.keys(villageList).map(async (village) => fetchLocations(villageList[village]).then((result) => villageList[village].locations = result));
    await Promise.all(promises);

    return [villageList, machineList];
}

async function fetchLocations(village) {
    const browser = await puppeteer.launch({
        headless: true, // false: enables one to view the Chrome instance in action
        defaultViewport: null, // (optional) useful only in non-headless mode
    });
    const page = await browser.newPage();
    // page.on('console', consoleMessageObject => function (consoleMessageObject) {
    //     if (consoleMessageObject._type !== 'warning') {
    //         console.log(consoleMessageObject._text)
    //     }
    // });
    // page.on('console', (msg) => console[msg._type]('PAGE LOG:', msg._text));

    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(village.url, { waitUntil: 'domcontentloaded' });
    const locationList = await page.$eval('table', processLocationData);
    await browser.close();

    const promises = Object.keys(locationList).map(async (location) => fetchMachines(locationList[location]).then((result) => {
        locationList[location].machines = result;
        for (var index in result) {
            machineList[index] = result[index];
        }
    }));
    await Promise.all(promises);

    return locationList;
}

async function fetchMachines(location) {
    const browser = await puppeteer.launch({
        headless: true, // false: enables one to view the Chrome instance in action
        defaultViewport: null, // (optional) useful only in non-headless mode
    });
    const page = await browser.newPage();
    // page.on('console', consoleMessageObject => function (consoleMessageObject) {
    //     if (consoleMessageObject._type !== 'warning') {
    //         console.log(consoleMessageObject._text)
    //     }
    // });
    // page.on('console', (msg) => console[msg._type]('PAGE LOG:', msg._text));

    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(location.url, { waitUntil: 'domcontentloaded' });
    const machineTable = await page.$eval('table', processMachineData);
    await browser.close();

    return machineTable;
};

exports.fetchVillages = fetchVillages;
exports.MAIN_URL = MAIN_URL;
