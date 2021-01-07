import { fetchVillages, MAIN_URL } from './machinescraper';
import GroupMeHandler from './groupmehandler';
import TextMessageHandler from './textmessagehandler';
import FirebaseHandler from './firebaseHandler';

import sgApiKey from './.env/sendgridapi.json';
import groupmeApiKey from './.env/groupmeAccess.json';
import firebaseServiceAccount from './.env/serviceAccountKey.json';

const ACCESS_TOKEN = groupmeApiKey.access_token;
const BOT_ID = groupmeApiKey.bot_id;

const textHandler = new TextMessageHandler(sgApiKey.key);
const groupMeHandler = new GroupMeHandler(ACCESS_TOKEN, BOT_ID);
const firebaseHandler = new FirebaseHandler(firebaseServiceAccount, groupMeHandler, textHandler);

function updateMachines() {
    const time = new Date().getTime();
    fetchVillages(MAIN_URL).then((result) => {
        firebaseHandler.updateMachineStatus(result);
        console.log('[App] Took', ((new Date().getTime()) - time) / 1000, 'seconds to fetch new data');
        updateMachines();
    }).catch((error) => {
        console.error('[App] FETCH ERROR:', error);
        console.log('[App] FETCH ERROR:', ((new Date().getTime()) - time) / 1000, 'seconds to error');
        updateMachines();
    });
}

if (require.main === module) {
    console.log('[App] Starting app...');

    updateMachines();
}
