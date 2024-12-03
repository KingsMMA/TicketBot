import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

import { init } from '../discord/init';
import type TicketBot from '../discord/ticketBot';
import loggerInitialisedMessage from '../discord/utils/typeEdit';
import type config from './data/config.json';
import Mongo from './util/mongo';

export default class Main {
    mongo: Mongo;
    client!: TicketBot;

    constructor() {
        console.log(loggerInitialisedMessage);
        this.mongo = new Mongo(this);
    }

    async initialize() {
        dotenv.config({
            path: __dirname + path.sep + '..' + path.sep + '..' + path.sep + '.env',
        });

        this.client = await init(this);
        await this.mongo.connect();
    }

    get config(): typeof config {
        return JSON.parse(fs.readFileSync('./src/main/data/config.json')
            .toString());
    }

    set config(config) {
        fs.writeFileSync('./src/main/data/config.json', JSON.stringify(config, null, 2));
    }
}
