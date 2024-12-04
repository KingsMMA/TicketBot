import type { ClientOptions } from 'discord.js';
import { Client, Collection } from 'discord.js';
import type { PathLike } from 'fs';
import path from 'path';

import type Main from '../main/main';
import type BaseCommand from './commands/base.command';
import { TicketManager } from './utils/ticketManager';

export default class TicketBot extends Client {
    main: Main;
    tickets: TicketManager;
    commands: Collection<string, BaseCommand> = new Collection();

    constructor(main: Main, options: ClientOptions) {
        super(options);
        this.main = main;
        this.tickets = new TicketManager(this);

        this.on('error', console.error);
    }

    loadCommand(commandPath: PathLike, commandName: string) {
        try {
            const command: BaseCommand = new (require(`${commandPath}${path.sep}${commandName}`).default)(this);
            console.info(`Loading Command: ${command.name}.`);
            this.commands.set(command.name, command);
        } catch (e) {
            return `Unable to load command ${commandName}: ${e}`;
        }
    }

    loadEvent(eventPath: PathLike, eventName: string) {
        try {
            const event = new (require(`${eventPath}${path.sep}${eventName}`).default)(this);
            console.info(`Loading Event: ${eventName}.`);
            this.on(eventName, (...args) => event.run(...args));
        } catch (e) {
            return `Unable to load event ${eventName}: ${e}`;
        }
    }

}
