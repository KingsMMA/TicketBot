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
            name: 'remove',
            description: 'Remove a user or role from the ticket.',
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'user-role',
                    description: 'The user or role to remove.',
                    type: ApplicationCommandOptionType.Mentionable,
                    required: true,
                }
            ],
        });
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const userRole = interaction.options.getMentionable('user-role', true);

        const ticket = await main.mongo.fetchTicket(interaction.guildId!, interaction.channelId);
        if (!ticket) return interaction.replyError('This can only be done inside tickets.');

        if (!(
            (ticket.owner === interaction.user.id && ticket.ownerCanManage) ||
            ticket.managerUsers.includes(interaction.user.id) ||
            (interaction.member!.roles as GuildMemberRoleManager).cache.some(role => ticket.managerRoles.includes(role.id)) ||
            ((interaction.member!.permissions as PermissionsBitField).has(PermissionFlagsBits.ManageChannels, true))
        )) return interaction.replyError('You do not have permission to remove someone from this ticket.');

        let targetId: Snowflake;
        if (interaction.options.resolved?.roles) {
            targetId = interaction.options.resolved.roles.at(0)!.id;
        } else if (interaction.options.resolved?.users) {
            targetId = interaction.options.resolved.users.at(0)!.id;
        } else {
            return interaction.replyError('Invalid user or role.');
        }

        const suffix: 'Roles' | 'Users' = (userRole instanceof Role) ? 'Roles' : 'Users';

        if (!ticket[`viewer${suffix}`].includes(targetId) && !ticket[`manager${suffix}`].includes(targetId))
            return interaction.replyError('No override was set for that user or role.');

        ticket[`viewer${suffix}`] = ticket[`viewer${suffix}`].filter(id => id !== targetId);
        ticket[`manager${suffix}`] = ticket[`manager${suffix}`].filter(id => id !== targetId);

        await this.client.main.mongo.updateTicket(ticket);
        await this.client.tickets.recalculatePermissions(ticket);

        await interaction.deleteReply();
        return (interaction.channel as GuildTextBasedChannel).send({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle('User Removed')
                    .setDescription(`${interaction.user} removed ${userRole} from the ticket.`)
                    .setColor('Green')
            ],
        });
    }

}
