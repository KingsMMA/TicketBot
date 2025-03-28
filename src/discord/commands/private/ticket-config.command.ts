import type {
    ChatInputCommandInteraction } from 'discord.js';
import {
    type AutocompleteInteraction,
    CategoryChannel,
    Role
} from 'discord.js';
import { PermissionsBitField } from 'discord.js';
import type {
    Snowflake
} from 'discord-api-types/v10';
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ChannelType
} from 'discord-api-types/v10';

import type { TicketConfig } from '../../../main/util/types';
import type TicketBot from '../../ticketBot';
import DbMessageEditor from '../../utils/dbMessageEditor';
import KingsDevEmbedBuilder from '../../utils/kingsDevEmbedBuilder';
import BaseCommand from '../base.command';

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
                    name: 'view',
                    description: 'View a ticket config.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: 'The name of the ticket config.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            autocomplete: true,
                        },
                    ],
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
                            channel_types: [
                                ChannelType.GuildCategory 
                            ],
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
                        {
                            name: 'can-owner-manage',
                            description: 'Whether the ticket owner can manage the ticket - AKA add/remove users, close the ticket, etc..',
                            type: ApplicationCommandOptionType.Boolean,
                            required: true,
                        },
                        {
                            name: 'log-channel',
                            description: 'The channel to log ticket transcripts in.',
                            type: ApplicationCommandOptionType.Channel,
                            required: false,
                            channel_types: [
                                ChannelType.GuildText
                            ],
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
                            autocomplete: true,
                        },
                        {
                            name: 'category',
                            description: 'The category to create tickets in.',
                            type: ApplicationCommandOptionType.Channel,
                            required: false,
                            channel_types: [
                                ChannelType.GuildCategory 
                            ],
                        },
                        {
                            name: 'name-template',
                            description: 'The template for the ticket name.',
                            type: ApplicationCommandOptionType.String,
                            required: false,
                        },
                        {
                            name: 'max-tickets',
                            description: 'The maximum amount of tickets a user can have open.',
                            type: ApplicationCommandOptionType.Integer,
                            required: false,
                        },
                        {
                            name: 'can-owner-manage',
                            description: 'Whether the ticket owner can manage the ticket - AKA add/remove users, close the ticket, etc..',
                            type: ApplicationCommandOptionType.Boolean,
                            required: false,
                        },
                        {
                            name: 'log-channel',
                            description: 'The channel to log ticket transcripts in.',
                            type: ApplicationCommandOptionType.Channel,
                            required: false,
                            channel_types: [
                                ChannelType.GuildText
                            ],
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
                            autocomplete: true,
                        },
                    ],
                },
                {
                    name: 'set-default-override',
                    description: 'Set a default override.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: 'The name of the ticket config.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            autocomplete: true,
                        },
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
                            name: 'name',
                            description: 'The name of the ticket config.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            autocomplete: true,
                        },
                        {
                            name: 'user-role',
                            description: 'The user or role to remove the override for.',
                            type: ApplicationCommandOptionType.Mentionable,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'clone',
                    description: 'Clone a ticket config.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'name',
                            description: 'The name of the ticket config to clone.',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            autocomplete: true,
                        },
                        {
                            name: 'new-name',
                            description: 'The name of the new ticket config.',
                            type: ApplicationCommandOptionType.String,
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
                return this.listConfigs(interaction);
            case 'view':
                return this.viewConfig(interaction);
            case 'create':
                return this.createConfig(interaction);
            case 'edit':
                return this.editConfig(interaction);
            case 'set-message':
                return this.setMessage(interaction);
            case 'set-default-override':
                return this.setDefaultOverride(interaction);
            case 'remove-default-override':
                return this.removeDefaultOverride(interaction);
            case 'clone':
                return this.cloneConfig(interaction);
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

    async viewConfig(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);

        const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId!);
        if (!configs[name])
            return interaction.replyError('Ticket config not found.');

        const config = configs[name];
        return interaction.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle(`Ticket Config: ${name}`)
                    .setDescription(`You can view and/or edit the message sent at the start of tickets of this type by using \`/ticket-config set-message ${
                        name
                    }\`.  Tickets of this type can be created using a button with ID \`create-ticket:${name}\` or with \`/create ${name
                    }\`.\n\nUsers specified as managers will have the ability to use \`/close\`, \`/add\`, and \`/remove\` in tickets of this type, while users specified as viewers will only be able to view tickets of this type.  Users with \`Manage Channels\` are always a manager by default.`)
                    .addField('Category', `<#${config.category}>`, true)
                    .addField('Name Template', config.nameTemplate, true)
                    .addField('Max Tickets', config.maxTickets.toString(), true)
                    .addField('Can Owner Manage?', config.ownerCanManage ? 'Yes' : 'No', true)
                    .addField('Default Manager Roles', config.managerRoles.length ? config.managerRoles.map(id => `<@&${id}>`)
                        .join(', ') : 'None', true)
                    .addField('Default Viewer Roles', config.viewerRoles.length ? config.viewerRoles.map(id => `<@&${id}>`)
                        .join(', ') : 'None', true)
                    .addField('Default Manager Users', config.managerUsers.length ? config.managerUsers.map(id => `<@${id}>`)
                        .join(', ') : 'None', true)
                    .addField('Default Viewer Users', config.viewerUsers.length ? config.viewerUsers.map(id => `<@${id}>`)
                        .join(', ') : 'None', true)
                    .addField('Log Channel', config.logChannel ? `<#${config.logChannel}>` : 'None', true)
                    .setColor('Blurple'),
            ]
        });
    }

    async createConfig(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);
        const categoryOpt = interaction.options.getChannel('category', true);
        const nameTemplate = interaction.options.getString('name-template', true);
        const maxTickets = interaction.options.getInteger('max-tickets', true);
        const canOwnerManage = interaction.options.getBoolean('can-owner-manage', true);
        const logChannel = interaction.options.getChannel('log-channel');

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
            type: name,
            ownerCanManage: canOwnerManage,
            logChannel: logChannel?.id,
        };

        await this.client.main.mongo.addTicketConfig(name, config);
        return interaction.replySuccess(`Ticket config \`${name}\` created.`);
    }

    async editConfig(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);
        const categoryOpt = interaction.options.getChannel('category');
        const nameTemplate = interaction.options.getString('name-template');
        const maxTickets = interaction.options.getInteger('max-tickets');
        const canOwnerManage = interaction.options.getBoolean('can-owner-manage');
        const logChannel = interaction.options.getChannel('log-channel');

        const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId!);
        if (!configs[name])
            return interaction.replyError('Ticket config not found.');

        const config = configs[name];
        if (categoryOpt) {
            const category = await this.client.channels.fetch(categoryOpt.id)
                .catch(() => null);
            if (!category || !(category instanceof CategoryChannel))
                return interaction.replyError('Category not found.');
            config.category = category.id;
        }

        if (nameTemplate) config.nameTemplate = nameTemplate;

        if (maxTickets) {
            if (maxTickets < 0)
                return interaction.replyError('Max tickets must be at least 0.');
            config.maxTickets = maxTickets;
        }

        if (canOwnerManage !== null) config.ownerCanManage = canOwnerManage;
        if (logChannel) config.logChannel = logChannel.id;

        await this.client.main.mongo.updateTicketConfig(name, config);
        return interaction.replySuccess(`Ticket config \`${name}\` updated.`);
    }

    async setMessage(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);

        const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId!);
        if (!configs[name])
            return interaction.replyError('Ticket config not found.');

        let message = configs[name].message;

        if (!message) message = { content: '', embeds: [], buttons: [] };
        message = await new DbMessageEditor(message)
            .editMessage(interaction);
        if (message.content === '' && message.embeds.length === 0 && message.buttons.length === 0)
            message = undefined;

        configs[name].message = message;
        await this.client.main.mongo.updateTicketConfig(name, configs[name]);
        return interaction.replySuccess(`Message for ticket config \`${name}\` updated.`);
    }

    async setDefaultOverride(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);
        const userRole = interaction.options.getMentionable('user-role', true);
        const permission = interaction.options.getString('permission', true);

        const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId!);
        if (!configs[name])
            return interaction.replyError('Ticket config not found.');

        const config = configs[name];
        let override: 'managerRoles' | 'viewerRoles' | 'managerUsers' | 'viewerUsers';
        if (userRole instanceof Role)
            override = permission === 'view' ? 'viewerRoles' : 'managerRoles';
        else
            override = permission === 'view' ? 'viewerUsers' : 'managerUsers';

        let targetId: Snowflake;
        if (interaction.options.resolved?.roles) {
            targetId = interaction.options.resolved.roles.at(0)!.id;
        } else if (interaction.options.resolved?.users) {
            targetId = interaction.options.resolved.users.at(0)!.id;
        } else {
            return interaction.replyError('Invalid user or role.');
        }

        if (config[override].includes(targetId))
            return interaction.replyError('Override already set.');

        config[override].push(targetId);
        await this.client.main.mongo.updateTicketConfig(name, config);

        return interaction.replySuccess(`Default override set for ${userRole} with permission \`${permission}\`.`);
    }

    async removeDefaultOverride(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);
        const userRole = interaction.options.getMentionable('user-role', true);

        const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId!);
        if (!configs[name])
            return interaction.replyError('Ticket config not found.');

        const config = configs[name];

        let targetId: Snowflake;
        if (interaction.options.resolved?.roles) {
            targetId = interaction.options.resolved.roles.at(0)!.id;
        } else if (interaction.options.resolved?.users) {
            targetId = interaction.options.resolved.users.at(0)!.id;
        } else {
            return interaction.replyError('Invalid user or role.');
        }

        const suffix: 'Roles' | 'Users' = (userRole instanceof Role) ? 'Roles' : 'Users';

        if (!config[`viewer${suffix}`].includes(targetId) && !config[`manager${suffix}`].includes(targetId))
            return interaction.replyError('No override was set for that user or role.');

        config[`viewer${suffix}`] = config[`viewer${suffix}`].filter(id => id !== targetId);
        config[`manager${suffix}`] = config[`manager${suffix}`].filter(id => id !== targetId);
        await this.client.main.mongo.updateTicketConfig(name, config);

        return interaction.replySuccess(`Default override removed for ${userRole}.`);
    }

    async cloneConfig(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);
        const newName = interaction.options.getString('new-name', true);

        const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId!);
        if (!configs[name])
            return interaction.replyError('Ticket config not found.');
        if (configs[newName])
            return interaction.replyError('A ticket config with that name already exists.');

        const config = configs[name];
        config.type = newName;
        await this.client.main.mongo.addTicketConfig(newName, config);
        return interaction.replySuccess(`Ticket config \`${newName}\` cloned from \`${name}\`.`);
    }

    async deleteConfig(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);

        const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId!);
        if (!configs[name])
            return interaction.replyError('Ticket config not found.');

        await this.client.main.mongo.deleteTicketConfig(interaction.guildId!, name);
        return interaction.replySuccess(`Ticket config \`${name}\` deleted.`);
    }

    async autocomplete(interaction: AutocompleteInteraction) {
        if (!interaction.guildId) return interaction.respond([]);

        if (interaction.options.getFocused(true)?.name === 'name') {
            const configs = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId);

            return interaction.respond(
                Object.entries(configs)
                    .filter(([
                        name, _
                    ]) => name.toLowerCase()
                        .includes(interaction.options.getString('name', true)
                            .toLowerCase()))
                    .map(([
                        name, _
                    ]) => {
                        return {
                            name: name,
                            value: name,
                        };
                    })
            );
        }

    }

}
