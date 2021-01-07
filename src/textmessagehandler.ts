import sgMail from '@sendgrid/mail';

import carrierList from './carrieremail.json';

function getCarrierGateway(carrier) {
    return carrierList.carriers.find((record) => record.name === carrier).gateway;
}

export default class TextMessageHandler {
    constructor(apiKey: string) {
        sgMail.setApiKey(apiKey);
    }

    sendMessage(number, carrier, message) {
        const msg = {
            to: number + getCarrierGateway(carrier),
            from: 'calpolylaundry@chris2fourlaw.me',
            subject: 'Cal Poly Laundry',
            text: message,
        };

        sgMail.send(msg).then(() => {
            console.log('[Text Message Handler] Message Sent!');
        }).catch((error) => {
            console.log('[Text Message Handler] Message Error!');
            console.log(error.response.body);
        });
    }

    onChange(snapshot) {
        if (snapshot.val().status === 'End of cycle') {
            const msg = `${snapshot.val().type} ${snapshot.val().name} has finished.`;
            // this.sendMessage(number, "Verizon", msg)
        } else if (snapshot.val().status === 'Available') {
            const msg = `${snapshot.val().type} ${snapshot.val().name} is now available for use.`;
            // this.sendMessage(number, "Verizon", msg)
        }
    }
}
