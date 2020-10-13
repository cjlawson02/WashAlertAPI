const admin = require("firebase-admin");

class FirebaseHandler {
    constructor(serviceAccount, GroupMeHandler, TextMessageHandler) {
        // Initialize Firebase
        this.firebase = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://washalertapi.firebaseio.com"
        });
        this.defaultAuth = this.firebase.auth();
        this.defaultDatabase = this.firebase.database();

        this.defaultDatabase.ref('/machinestatus/machines').on("child_changed", (snapshot) => {
            GroupMeHandler.onChange(snapshot);
            TextMessageHandler.onChange(snapshot);
        });
    }

    async updateMachineStatus(data) {
        console.log("[Firebase Handler] Updating machine status...")
        this.defaultDatabase.ref('/machinestatus/villages').set(data[0]);
        this.defaultDatabase.ref('/machinestatus/machines').set(data[1]);
    }

    async getMachineTime(machine) {
        return (await this.defaultDatabase.ref(`/machinestatus/machines/${machine}`).once('value')).val().time
    }

    async getMachineState(machine) {
        return (await this.defaultDatabase.ref(`/machinestatus/machines/${machine}`).once('value')).val().state
    }

    async getMachineType(machine) {
        return (await this.defaultDatabase.ref(`/machinestatus/machines/${machine}`).once('value')).val().type
    }
}

exports.FirebaseHandler = FirebaseHandler