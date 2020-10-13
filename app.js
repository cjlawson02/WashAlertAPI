const machineScraper = require("./machinescraper");
const groupme = require("./groupmehandler");
const textmessage = require("./textmessagehandler");
const firebaseHandler = require("./firebaseHandler");

const sgApiKey = require("./.env/sendgridapi.json");
const groupmeApiKey = require("./.env/groupmeAccess.json");
const firebaseServiceAccount = require("./.env/serviceAccountKey.json");

const ACCESS_TOKEN = groupmeApiKey.access_token;
const BOT_ID = groupmeApiKey.bot_id;

const TextMessageHandler = new textmessage.TextMessageHandler(sgApiKey.key);
const GroupMeHandler = new groupme.GroupMeHandler(ACCESS_TOKEN, BOT_ID);
const FirebaseHandler = new firebaseHandler.FirebaseHandler(firebaseServiceAccount, TextMessageHandler, GroupMeHandler);

function updateMachines() {
    let time = new Date().getTime()
    machineScraper.fetchVillages(machineScraper.MAIN_URL).then((result) => {
        FirebaseHandler.updateMachineStatus(result);
        console.log("[App] Took", ((new Date().getTime()) - time) / 1000, "seconds");
        updateMachines();
    });
}

if (require.main === module) {
    console.log("[App] Starting app...")

    updateMachines();
}