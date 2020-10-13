const groupme = require('groupme').Stateless;

class GroupMeHandler {
    constructor(token, bot_id) {
        this.token = token;
        this.bot_id = bot_id;
    }

    sendMessage(msg) {
        groupme.Bots.post(this.ACCESS_TOKEN, this.bot_id, msg, {}, (err, res) => {
            if (err) {
                console.log("[GroupMe Handler] Message Error!");
                sendMessage("error");
            } else {
                console.log("[GroupMe Handler] Message Sent!");
            }
        });
    }

    onChange(snapshot) {
        if (snapshot.val().status == 'End of cycle') {
            var msg = `${snapshot.val().type} ${snapshot.val().name} has finished.`
            this.sendMessage(msg)
        }
        else if (snapshot.val().status == 'Available') {
            var msg = `${snapshot.val().type} ${snapshot.val().name} is now available for use.`
            this.sendMessage(msg)
        }
    }
}

exports.GroupMeHandler = GroupMeHandler;