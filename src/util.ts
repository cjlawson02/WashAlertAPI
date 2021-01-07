import carrierList from './carrieremail.json';

export function getCarrierGateway(carrier: string) {
    return carrierList.carriers.find((record) => record.name === carrier).gateway;
}

export function sleep(milliseconds: number) {
    return new Promise((r) => setTimeout(r, milliseconds));
}
