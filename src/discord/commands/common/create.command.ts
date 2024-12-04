import type {AutocompleteInteraction, ChatInputCommandInteraction} from 'discord.js';
import {PermissionsBitField} from 'discord.js';
import {ApplicationCommandOptionType, ApplicationCommandType} from 'discord-api-types/v10';

import type TicketBot from '../../ticketBot';
import KingsDevEmbedBuilder from '../../utils/kingsDevEmbedBuilder';
import BaseCommand from '../base.command';
import {createTicket} from "../../utils/ticketInteractions";

export default class CreateCommand extends BaseCommand {
    constructor(client: TicketBot) {
        super(client, {
            name: 'create',
            description: 'Create a new ticket.',
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'type',
                    description: 'The type of ticket to create.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
            ],
        });
    }

    async execute(interaction: ChatInputCommandInteraction) {
        const ticketConfigName = interaction.options.getString('type', true);

        return createTicket(interaction, ticketConfigName);
    }

    async autocomplete(interaction: AutocompleteInteraction) {
        if (!interaction.guildId) return interaction.respond([]);

        const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId);

        return interaction.respond(
            Object.entries(configs)
                .filter(([name, _]) => name.toLowerCase()
                    .includes(interaction.options.getString('type', true)
                        .toLowerCase()))
                .map(([name, _]) => {
                    return {
                        name: name,
                        value: name,
                    };
                })
        );
    }

}