import puppeteer from 'puppeteer';

export const MAIN_URL = 'http://washalert.washlaundry.com/washalertweb/calpoly/cal-poly.html';

process.setMaxListeners(0);

const machineList = {};

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

    await page.goto(location.url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch((error) => console.error('[Machine Scraper] MACHINE READ ERROR:', error));
    const machineTable = await page.$eval('table', processMachineData);
    await browser.close();

    return machineTable;
}

async function fetchLocations(location) {
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

    await page.goto(location.url, { waitUntil: 'domcontentloaded', timeout: 3000 }).catch((error) => console.error('[Machine Scraper] LOCATION READ ERROR:', error));
    const locationList = await page.$eval('table', processLocationData);
    await browser.close();

    const promises = Object.keys(locationList)
        .map(async (building) => fetchMachines(locationList[building])
            .then((result) => {
                locationList[building].machines = result;
                for (const index in result) {
                    machineList[index] = result[index];
                }
            }));
    await Promise.all(promises);

    return locationList;
}

export async function fetchVillages(url: string) {
    console.log('[Machine Scraper] Fetching Data...');
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

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 3000 }).catch((error) => console.error('[Machine Scraper] VILLAGE ERROR:', error));
    const villageList = await page.$eval('table', processVillageData);
    await browser.close();

    const promises = Object.keys(villageList)
        .map(async (village) => fetchLocations(villageList[village])
            .then((result) => { villageList[village].locations = result; }));
    await Promise.all(promises);

    return [villageList, machineList];
}
