import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types/v10';

import type TicketBot from '../../ticketBot';
import { TicketInteractions } from '../../utils/ticketInteractions';
import BaseCommand from '../base.command';

export default class CreateCommand extends BaseCommand {
    constructor(client: TicketBot) {
        super(client, {
            name: 'close',
            description: 'Close the current ticket.',
            type: ApplicationCommandType.ChatInput,
        });
    }

    async execute(interaction: ChatInputCommandInteraction) {
        return TicketInteractions.closeTicket(interaction);
    }

}
