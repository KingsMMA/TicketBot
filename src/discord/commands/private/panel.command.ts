import type {AutocompleteInteraction, ChatInputCommandInteraction, GuildTextBasedChannel} from 'discord.js';
import {PermissionsBitField} from 'discord.js';
import {ApplicationCommandOptionType, ApplicationCommandType} from 'discord-api-types/v10';

import type ticketBot from '../../ticketBot';
import KingsDevEmbedBuilder from '../../utils/kingsDevEmbedBuilder';
import BaseCommand from '../base.command';
import {DbMessage, TicketPanel} from "../../../main/util/types";
import DbMessageEditor from "../../utils/dbMessageEditor";

export default class PanelCommand extends BaseCommand {
    constructor(client: ticketBot) {
        super(client, {
            name: 'panel',
            description: 'Manage the guild\'s ticket panels.',
            type: ApplicationCommandType.ChatInput,
            default_member_permissions: PermissionsBitField.Flags.Administrator.toString(),
            options: [
                {
                    name: 'list',
                    description: 'List all ticket panels.',
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: 'send',
                    description: 'Send a ticket panel to a channel.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'panel',
                            description: 'The panel to send.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            autocomplete: true,
                        },
                        {
                            name: 'channel',
                            description: 'The channel to send the panel to.',
                            type: ApplicationCommandOptionType.Channel,
                            required: false,
                        },
                    ],
                },
                {
                    name: 'create',
                    description: 'Create a new ticket panel.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'panel',
                            description: 'The panel to create.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'edit',
                    description: 'Edit a ticket panel.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'panel',
                            description: 'The panel to edit.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            autocomplete: true,
                        },
                    ],
                },
                {
                    name: 'delete',
                    description: 'Delete a ticket panel.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'panel',
                            description: 'The panel to delete.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            autocomplete: true,
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
                return this.listPanels(interaction);
            case 'send':
                return this.sendPanel(interaction);
            case 'create':
                return this.createPanel(interaction);
            case 'edit':
                return this.editPanel(interaction);
            case 'delete':
                return this.deletePanel(interaction);
            default:
                return interaction.replyError('Invalid subcommand.');
        }
    }

    async listPanels(interaction: ChatInputCommandInteraction) {
        const panels = await this.client.main.mongo.getPanels(interaction.guildId!);
        if (!panels.length) return interaction.replyError('No panels found.  Use `/panel create` to create a new panel.');

        const panelList = panels.map((panel, index) => `${index + 1}. ${panel.name}`).join('\n');
        return interaction.replySuccess(panelList);
    }

    async sendPanel(interaction: ChatInputCommandInteraction) {
        const panelName = interaction.options.getString('panel', true);
        const channelOpt = interaction.options.getChannel('channel', false) || interaction.channel!;
        const panels = await this.client.main.mongo.getPanels(interaction.guildId!);
        const panel = panels.find((p) => p.name === panelName);
        if (!panel) return interaction.replyError('Panel not found.');

        const channel = await this.client.channels.fetch(channelOpt.id)
            .catch(() => null);
        if (!channel) return interaction.replyError('Channel not found.');

        if (!channel.isTextBased())
            return interaction.replyError('Channel must be a text channel.');

        await (channel as GuildTextBasedChannel).send({
            content: panel.message.content,
            embeds: DbMessageEditor.parseEmbeds(panel.message.embeds),
            components: DbMessageEditor.parseButtons(panel.message.buttons),
        });

        return interaction.replySuccess(`Panel \`${panelName}\` sent to ${channel.toString()}.`);
    }

    async createPanel(interaction: ChatInputCommandInteraction) {
        const panelName = interaction.options.getString('panel', true);
        const panels = await this.client.main.mongo.getPanels(interaction.guildId!);
        if (panels.find((p) => p.name === panelName)) return interaction.replyError('A panel with that name already exists.');

        let message: DbMessage = {
            content: '',
            embeds: [],
            buttons: [],
        };

        message = await new DbMessageEditor(message).editMessage(interaction);
        let panel: TicketPanel = {
            guildId: interaction.guildId!,
            name: panelName,
            message: message,
        };

        await this.client.main.mongo.addPanel(panel);
        return interaction.replySuccess(`Panel \`${panelName}\` was created.  Use \`/panel send\` to send it to a channel.`);
    }

    async editPanel(interaction: ChatInputCommandInteraction) {
        const panelName = interaction.options.getString('panel', true);
        const panels = await this.client.main.mongo.getPanels(interaction.guildId!);
        const panel = panels.find((p) => p.name === panelName);
        if (!panel) return interaction.replyError('Panel not found.');

        let message: DbMessage = panel.message;
        message = await new DbMessageEditor(message).editMessage(interaction);
        panel.message = message;

        await this.client.main.mongo.addPanel(panel);
        return interaction.replySuccess(`Panel \`${panelName}\` was edited.`);
    }

    async deletePanel(interaction: ChatInputCommandInteraction) {
        const panelName = interaction.options.getString('panel', true);
        const panels = await this.client.main.mongo.getPanels(interaction.guildId!);
        const panel = panels.find((p) => p.name === panelName);
        if (!panel) return interaction.replyError('Panel not found.');

        await this.client.main.mongo.deletePanel(interaction.guildId!, panel.name);
        return interaction.replySuccess(`Panel \`${panelName}\` was deleted.`);
    }

    async autocomplete(interaction: AutocompleteInteraction) {
        if (!interaction.guildId) return interaction.respond([]);

        if (interaction.options.getFocused(true)?.name === 'panel') {
            const panels = await this.client.main.mongo.getPanels(interaction.guildId);

            return interaction.respond(
                panels
                    .filter(panel => panel.name.toLowerCase().includes(interaction.options.getString('panel', true).toLowerCase()))
                    .map(panel => {
                    return {
                        name: panel.name,
                        value: panel.name,
                    };
                })
            );
        }

    }

}