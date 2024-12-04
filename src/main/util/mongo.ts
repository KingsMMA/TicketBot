import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';

import type Main from '../main';
import {Snowflake} from "discord-api-types/v10";
import {TicketPanel} from "./types";

export default class Mongo {
    private mongo!: Db;
    main: Main;
    constructor(main: Main) {
        this.main = main;
    }

    async connect() {
        const client = await MongoClient.connect(process.env.MONGO_URI!);
        this.mongo = client.db(this.main.config.mongo.database);
        console.info(`Connected to Database ${this.mongo.databaseName}`);
    }

    async getPanels(guildId: Snowflake): Promise<TicketPanel[]> {
        return this.mongo
            .collection('panels')
            .findOne({ guildId })
            .then((doc) => doc?.panels || []);
    }

    async addPanel(panel: TicketPanel) {
        return this.mongo
            .collection('panels')
            .updateOne(
                { guildId: panel.guildId },
                { $push: { panels: panel } },
                { upsert: true },
            );
    }

    async deletePanel(guildId: Snowflake, name: string) {
        return this.mongo
            .collection('panels')
            .updateOne(
                { guildId },
                { $pull: { panels: { name } } },
            );
    }

    async updatePanel(panel: TicketPanel) {
        return this.mongo
            .collection('panels')
            .updateOne(
                { guildId: panel.guildId, 'panels.name': panel.name },
                { $set: { 'panels.$': panel } },
            );
    }

}
