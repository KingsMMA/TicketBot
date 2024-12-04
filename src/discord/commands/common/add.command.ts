import type {
    ChatInputCommandInteraction,
    GuildMemberRoleManager,
    GuildTextBasedChannel } from 'discord.js';
import type { PermissionsBitField } from 'discord.js';
import {
    Role
} from 'discord.js';
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    PermissionFlagsBits,
    type Snowflake
} from 'discord-api-types/v10';

import { main } from '../../../main/main';
import type TicketBot from '../../ticketBot';
import KingsDevEmbedBuilder from '../../utils/kingsDevEmbedBuilder';
import BaseCommand from '../base.command';

export default class AddCommand extends BaseCommand {
    constructor(client: TicketBot) {
        super(client, {
            name: 'add',
            description: 'Add a user or role to the ticket.',
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'user-role',
                    description: 'The user or role to add.',
                    type: ApplicationCommandOptionType.Mentionable,
                    required: true,
                },
                {
                    name: 'permission',
                    description: 'The permission to give to the user or role.',
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
                }
            ],
        });
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const userRole = interaction.options.getMentionable('user-role', true);
        const permission = interaction.options.getString('permission', true);

        const ticket = await main.mongo.fetchTicket(interaction.guildId!, interaction.channelId);
        if (!ticket) return interaction.replyError('This can only be done inside tickets.');

        if (!(
            (ticket.owner === interaction.user.id && ticket.ownerCanManage) ||
            ticket.managerUsers.includes(interaction.user.id) ||
            (interaction.member!.roles as GuildMemberRoleManager).cache.some(role => ticket.managerRoles.includes(role.id)) ||
            ((interaction.member!.permissions as PermissionsBitField).has(PermissionFlagsBits.ManageChannels, true))
        )) return interaction.replyError('You do not have permission to add someone to this ticket.');

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

        if (ticket[override].includes(targetId))
            return interaction.replyError('Override already set.');

        ticket[override].push(targetId);
        await this.client.main.mongo.updateTicket(ticket);
        await this.client.tickets.recalculatePermissions(ticket);

        await interaction.deleteReply();
        return (interaction.channel as GuildTextBasedChannel).send({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle('User Added')
                    .setDescription(`${interaction.user} added ${userRole} to the ticket as a ${permission === 'view' ? 'viewer' : 'manager'}.`)
                    .setColor('Green')
            ],
        });
    }

}
