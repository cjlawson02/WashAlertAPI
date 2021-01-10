import puppeteer from 'puppeteer';

export const MAIN_URL = 'http://washalert.washlaundry.com/washalertweb/calpoly/cal-poly.html';
const ALL_DATA_URL = 'http://washalert.washlaundry.com/washalertweb/calpoly/WASHALERtweb.aspx';

process.setMaxListeners(0);

const machineList = {};
const ignoredRequests = ['image', 'stylesheet', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset'];

function processVillageData(table) {
    const villageList = {};
    let i = 0;
    while (i < table.rows.length) {
        const row = table.rows[i];
        villageList[row.cells[0].innerText] = {
            name: row.cells[0].innerText,
            url: row.cells[0].children[0].href,
            locations: {},
        };
        i += 1;
    }
    return villageList;
}

function processLocationData(table) {
    const locationList = {};
    let i = 1;
    while (i < table.rows.length) {
        const row = table.rows[i];
        locationList[row.cells[0].innerText] = {
            name: row.cells[0].innerText,
            url: row.cells[0].children[0].href,
            machines: {},
        };
        i += 1;
    }
    return locationList;
}

function processMachineData(table) {
    const localMachineList = {};
    let i = 3;
    while (i < table.rows.length) {
        const row = table.rows[i];
        localMachineList[row.cells[0].innerText] = {
            name: row.cells[0].innerText,
            type: row.cells[1].innerText,
            status: row.cells[2].innerText,
            time: row.cells[3].innerText,
        };
        i += 1;
    }
    return localMachineList;
}

function processAllMachineData(table) {
    const localMachineList = {};
    const polyTitleRegex = new RegExp('([0-9][0-9] - [A-Z])');
    const anyTitleRegex = new RegExp('([0-9,A-Z][0-9,A-Z] - [0-9,A-Z])');

    let i = 3;
    while (i < table.rows.length) {
        let row = table.rows[i];
        if (row.cells[0].innerText.match(polyTitleRegex) && row.cells[0].innerHTML.search('h2') > 0) {
            i += 2; // Skip over image
            row = table.rows[i];
            while (!row.cells[0].innerText.match(anyTitleRegex) && row.cells[0].innerHTML.search('h2') === -1) {
                localMachineList[row.cells[0].innerText] = {
                    name: row.cells[0].innerText,
                    type: row.cells[1].innerText,
                    status: row.cells[2].innerText,
                    time: row.cells[3].innerText,
                };

                i += 1;
                row = table.rows[i];
            }
        }
        i += 1;
    }
    return localMachineList;
}

export async function fetchAllMachines() {
    const browser = await puppeteer.launch({
        headless: true, // false: enables one to view the Chrome instance in action
        defaultViewport: null, // (optional) useful only in non-headless mode
        userDataDir: '/tmp/WashAlertCache',
    });
    const page = await browser.newPage();
    // page.on('console', (consoleMessageObject) => {
    //     if (consoleMessageObject._type !== 'warning') {
    //         console.log(consoleMessageObject._text);
    //     }
    // });
    page.on('console', (msg) => console[msg._type]('PAGE LOG:', msg._text));

    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (ignoredRequests.indexOf(request.resourceType()) > 0) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(ALL_DATA_URL, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch((error) => console.error('[Machine Scraper] MACHINE READ ERROR:', error));
    console.log("data read")
    const machineTable = await page.$eval('table', processAllMachineData);
    console.log(machineTable);
    await browser.close();

    return machineTable;
}

async function fetchMachines(location) {
    const browser = await puppeteer.launch({
        headless: true, // false: enables one to view the Chrome instance in action
        defaultViewport: null, // (optional) useful only in non-headless mode
        userDataDir: '/tmp/WashAlertCache',
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
        if (ignoredRequests.indexOf(request.resourceType()) > 0) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(location.url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch((error) => console.error('[Machine Scraper] MACHINE READ ERROR:', error));
    const machineTable = await page.$eval('table', processMachineData);
    await browser.close();

    return machineTable;
}

async function fetchLocations(location) {
    const browser = await puppeteer.launch({
        headless: true, // false: enables one to view the Chrome instance in action
        defaultViewport: null, // (optional) useful only in non-headless mode
        userDataDir: '/tmp/WashAlertCache',
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
        if (ignoredRequests.indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(location.url, { waitUntil: 'domcontentloaded', timeout: 4000 }).catch((error) => console.error('[Machine Scraper] LOCATION READ ERROR:', error));
    const locationList = await page.$eval('table', processLocationData);
    await browser.close();

    const promises = Object.keys(locationList)
        .map(async (building) => fetchMachines(locationList[building])
            .then((result) => {
                locationList[building].machines = result;
                Object.keys(result).forEach((index) => {
                    machineList[index] = result[index];
                });
            }));
    await Promise.all(promises);

    return locationList;
}

export async function fetchVillages(url: string) {
    console.log('[Machine Scraper] Fetching Data...');
    const browser = await puppeteer.launch({
        headless: true, // false: enables one to view the Chrome instance in action
        defaultViewport: null, // (optional) useful only in non-headless mode
        userDataDir: '/tmp/WashAlertCache',
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
        if (ignoredRequests.indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 4000 }).catch((error) => console.error('[Machine Scraper] VILLAGE ERROR:', error));
    const villageList = await page.$eval('table', processVillageData);
    await browser.close();

    const promises = Object.keys(villageList)
        .map(async (village) => fetchLocations(villageList[village])
            .then((result) => { villageList[village].locations = result; }));
    await Promise.all(promises);

    return [villageList, machineList];
}
