const sgMail = require('@sendgrid/mail');

const carrierList = require("./carrieremail.json");

class TextMessageHandler {
    constructor(api_key) {
        sgMail.setApiKey(api_key);
    }

    sendMessage(number, carrier, message) {
        var msg = {
            to: number + getCarrierGateway(carrier),
            from: 'calpolylaundry@chris2fourlaw.me',
            subject: 'Cal Poly Laundry',
            text: message
        };

        sgMail.send(msg).then(() => {
            console.log("[Text Message Handler] Message Sent!");
        }).catch((error) => {
            console.log("[Text Message Handler] Message Error!");
            console.log(error.response.body)
        })
    }

    onChange(snapshot) {
        if (snapshot.val().status == 'End of cycle') {
            var msg = `${snapshot.val().type} ${snapshot.val().name} has finished.`
            //this.sendMessage(number, "Verizon", msg)
        }
        else if (snapshot.val().status == 'Available') {
            var msg = `${snapshot.val().type} ${snapshot.val().name} is now available for use.`
            //this.sendMessage(number, "Verizon", msg)
        }
    }
}

function getCarrierGateway(carrier) {
    return carrierList.carriers.find(record => record.name === carrier).gateway;
}

exports.TextMessageHandler = TextMessageHandler;
