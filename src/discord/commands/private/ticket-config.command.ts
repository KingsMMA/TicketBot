import {CategoryChannel, ChatInputCommandInteraction} from 'discord.js';
import { PermissionsBitField } from 'discord.js';
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types/v10';

import type TicketBot from '../../ticketBot';
import KingsDevEmbedBuilder from '../../utils/kingsDevEmbedBuilder';
import BaseCommand from '../base.command';
import {TicketConfig} from "../../../main/util/types";

export default class TicketConfigCommand extends BaseCommand {
    constructor(client: TicketBot) {
        super(client, {
            name: 'ticket-config',
            description: 'Manage the guild\'s ticket configs.',
            type: ApplicationCommandType.ChatInput,
            default_member_permissions: PermissionsBitField.Flags.Administrator.toString(),
            options: [
                {
                    name: 'list',
                    description: 'List all ticket configs.',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'create',
                    description: 'Create a new ticket config.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: 'The name of the ticket config.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: 'category',
                            description: 'The category to create tickets in.',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        },
                        {
                            name: 'name-template',
                            description: 'The template for the ticket name.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: 'max-tickets',
                            description: 'The maximum amount of tickets a user can have open.',
                            type: ApplicationCommandOptionType.Integer,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'edit',
                    description: 'Edit a ticket config.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: 'The name of the ticket config.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: 'category',
                            description: 'The category to create tickets in.',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        },
                        {
                            name: 'name-template',
                            description: 'The template for the ticket name.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                        {
                            name: 'max-tickets',
                            description: 'The maximum amount of tickets a user can have open.',
                            type: ApplicationCommandOptionType.Integer,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'set-message',
                    description: 'Set the message to be sent at the start of tickets.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: 'The name of the ticket config.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'set-default-override',
                    description: 'Set a default override.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user-role',
                            description: 'The user or role to set the override for.',
                            type: ApplicationCommandOptionType.Mentionable,
                            required: true,
                        },
                        {
                            name: 'permission',
                            description: 'The permission to set the override for.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: 'View Ticket',
                                    value: 'view',
                                },
                                {
                                    name: 'Manage Ticket',
                                    value: 'manage',
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'remove-default-override',
                    description: 'Remove a default override.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user-role',
                            description: 'The user or role to remove the override for.',
                            type: ApplicationCommandOptionType.Mentionable,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'delete',
                    description: 'Delete a ticket config.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: 'The name of the ticket config.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ],
                },
            ],
        });
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        switch (interaction.options.getSubcommand()) {
            case 'list':
                return this.listConfigs(interaction);
            case 'create':
                return this.createConfig(interaction);
            case 'edit':
                return this.editConfig(interaction);
            case 'set-default-override':
                return this.setDefaultOverride(interaction);
            case 'remove-default-override':
                return this.removeDefaultOverride(interaction);
            case 'delete':
                return this.deleteConfig(interaction);
            default:
                return interaction.replyError('Invalid subcommand.');
        }
    }

    async listConfigs(interaction: ChatInputCommandInteraction) {
        const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId!);
        if (!Object.keys(configs).length) return interaction.replyError('No ticket configs found.  Use `/ticket-config create` to create a new config.');


        return interaction.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle('Ticket Configs')
                    .setDescription(
                        Object.entries(configs)
                            .map(([
                                name, config
                            ]) => `**• ${name}** - <#${config.category}> - \`${config.nameTemplate}\` (${config.maxTickets})`)
                            .join('\n'),
                    )
                    .setColor(0x006994),
            ],
        });
    }

    async createConfig(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);
        const categoryOpt = interaction.options.getChannel('category', true);
        const nameTemplate = interaction.options.getString('name-template', true);
        const maxTickets = interaction.options.getInteger('max-tickets', true);

        const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId!);
        if (configs[name])
            return interaction.replyError('A ticket config with that name already exists.');

        const category = await this.client.channels.fetch(categoryOpt.id)
            .catch(() => null);
        if (!category || !(category instanceof CategoryChannel))
            return interaction.replyError('Category not found.');

        if (maxTickets < 0)
            return interaction.replyError('Max tickets must be at least 0.');

        const config: TicketConfig = {
            guildId: interaction.guildId!,
            category: category.id,
            nameTemplate,
            managerRoles: [],
            viewerRoles: [],
            managerUsers: [],
            viewerUsers: [],
            maxTickets,
        };

        await this.client.main.mongo.addTicketConfig(name, config);
        return interaction.replySuccess(`Ticket config \`${name}\` created.`);
    }

    async editConfig(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);
        const category = interaction.options.getChannel('category', true);
        const nameTemplate = interaction.options.getString('name-template', true);
        const maxTickets = interaction.options.getInteger('max-tickets', true);
    }

    async setDefaultOverride(interaction: ChatInputCommandInteraction) {
        const userRole = interaction.options.getMentionable('user-role', true);
        const permission = interaction.options.getString('permission', true);
    }

    async removeDefaultOverride(interaction: ChatInputCommandInteraction) {
        const userRole = interaction.options.getMentionable('user-role', true);
    }

    async deleteConfig(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);
    }

}
