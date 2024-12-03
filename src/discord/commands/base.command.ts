import type { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import type { APIApplicationCommand } from 'discord-api-types/v10';

import type TicketBot from '../ticketBot';

export type ApplicationCommand = Omit<APIApplicationCommand, 'id' | 'application_id' | 'version' | 'default_member_permissions'> & Partial<Pick<APIApplicationCommand, 'default_member_permissions'>>;
export interface CommandOptions {
    enabled: boolean;
}
export default abstract class BaseCommand {
    protected readonly command: ApplicationCommand;
    client: TicketBot;
    opts: CommandOptions;

    protected constructor(
        client: TicketBot,
        command: ApplicationCommand,
        opts: CommandOptions = {
            enabled: true,
        }
    ) {
        this.client = client;
        this.command = command;
        this.opts = opts;
    }

    abstract execute(interaction: CommandInteraction): unknown;

    autocomplete(interaction: AutocompleteInteraction) {
        return interaction.respond([]);
    }

    get name() {
        return this.command.name;
    }

    get description() {
        return this.command.description;
    }

    get options() {
        return this.command.options;
    }

    toApplicationCommand() {
        return this.command;
    }
}
