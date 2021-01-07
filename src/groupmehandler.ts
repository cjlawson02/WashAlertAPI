import { Stateless as groupme } from 'groupme';

export default class GroupMeHandler {
    token: string

    botID: string

    constructor(token: string, botID: string) {
        this.token = token;
        this.botID = botID;
    }

    sendMessage(msg: string) {
        groupme.Bots.post(this.token, this.botID, msg, {}, (err) => {
            if (err) {
                console.log('[GroupMe Handler] Message Error!');
                this.sendMessage('error');
            } else {
                console.log('[GroupMe Handler] Message Sent!');
            }
        });
    }

    onChange(snapshot) {
        if (snapshot.val().status === 'End of cycle') {
            const msg = `${snapshot.val().type} ${snapshot.val().name} has finished.`;
            // this.sendMessage(msg);
        } else if (snapshot.val().status === 'Available') {
            const msg = `${snapshot.val().type} ${snapshot.val().name} is now available for use.`;
            // this.sendMessage(msg);
        }
    }
}

exports.GroupMeHandler = GroupMeHandler;
