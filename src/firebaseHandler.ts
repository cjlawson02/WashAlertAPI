import admin from 'firebase-admin';
import GroupMeHandler from './groupmehandler';
import TextMessageHandler from './textmessagehandler';

export default class FirebaseHandler {
    firebase: admin.app.App

    defaultAuth: admin.auth.Auth

    defaultDatabase: admin.database.Database

    constructor(serviceAccount: any, groupMeHandler: GroupMeHandler, textHandler: TextMessageHandler) {
        // Initialize Firebase
        this.firebase = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: 'https://washalertapi.firebaseio.com',
        });
        this.defaultAuth = this.firebase.auth();
        this.defaultDatabase = this.firebase.database();

        this.defaultDatabase.ref('/machinestatus/machines').on('child_changed', (snapshot) => {
            groupMeHandler.onChange(snapshot);
            textHandler.onChange(snapshot);
        });
    }

    async updateMachineStatus(data) {
        console.log('[Firebase Handler] Updating machine status...');
        this.defaultDatabase.ref('/machinestatus/villages').set(data[0]);
        this.defaultDatabase.ref('/machinestatus/machines').set(data[1]);
    }

    async getMachineTime(machine: string) {
        return (await this.defaultDatabase.ref(`/machinestatus/machines/${machine}`).once('value')).val().time;
    }

    async getMachineState(machine: string) {
        return (await this.defaultDatabase.ref(`/machinestatus/machines/${machine}`).once('value')).val().state;
    }

    async getMachineType(machine: string) {
        return (await this.defaultDatabase.ref(`/machinestatus/machines/${machine}`).once('value')).val().type;
    }
}
