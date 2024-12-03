import type TicketBot from '../ticketBot';

export default class {
    client: TicketBot;

    constructor(client: TicketBot) {
        this.client = client;
    }

    run() {
        console.info(`Successfully logged in! \nSession Details: id=${this.client.user?.id} tag=${this.client.user?.tag}`);
    }
}
