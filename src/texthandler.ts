import sgMail from '@sendgrid/mail';

import { getCarrierGateway } from './util';

export default class TextHandler {
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
