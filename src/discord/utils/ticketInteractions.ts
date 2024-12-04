import type {
    ButtonInteraction,
    ChatInputCommandInteraction,
    GuildMemberRoleManager,
    GuildTextBasedChannel, PermissionsBitField
} from 'discord.js';
import { PermissionFlagsBits } from 'discord-api-types/v10';

import { main } from '../../main/main';

export class TicketInteractions {

    static async createTicket(interaction: ChatInputCommandInteraction | ButtonInteraction, ticketConfigName: string): Promise<any> {
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

        const ticketConfig = await main.mongo.fetchTicketConfigs(interaction.guildId!)
            .then(configs => configs[ticketConfigName]);
        if (!ticketConfig) return interaction.replyError('Unable to find ticket config for that ticket type.');

        const usersOpenTickets = await main.mongo.fetchActiveTickets(interaction.guildId!)
            .then(tickets => Object.values(tickets))
            .then(tickets => tickets.filter(ticket => ticket.owner === interaction.user.id && ticket.type === ticketConfigName));

        if (ticketConfig.maxTickets === 0)
            return interaction.replyError('This ticket type is disabled.');
        if (usersOpenTickets.length >= ticketConfig.maxTickets)
            return interaction.replyError('You already have the maximum number of open tickets for this type.  Please close one before opening another.');

        await interaction.editReply('Creating ticket...');

        const member = await interaction.guild?.members.fetch(interaction.user.id)
            .catch(() => null);
        if (!member) return interaction.replyError('Failed to fetch member.');

        const ticketChannelId = await main.client.tickets.createTicket(member, ticketConfig);
        if (!ticketChannelId) return interaction.replyError('Failed to create ticket.');
        return interaction.editReply(`Ticket created!  <#${ticketChannelId}>`);
    }

    static async closeTicket(interaction: ChatInputCommandInteraction | ButtonInteraction): Promise<any> {
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

        const ticket = await main.mongo.fetchTicket(interaction.guildId!, interaction.channelId);
        if (!ticket) return interaction.replyError('This can only be done inside tickets.');

        if (!(
            (ticket.owner === interaction.user.id && ticket.ownerCanManage) ||
                ticket.managerUsers.includes(interaction.user.id) ||
            (interaction.member!.roles as GuildMemberRoleManager).cache.some(role => ticket.managerRoles.includes(role.id)) ||
            ((interaction.member!.permissions as PermissionsBitField).has(PermissionFlagsBits.ManageChannels, true))
        )) return interaction.replyError('You do not have permission to close this ticket.');

        await interaction.editReply('Closing ticket...');
        await main.client.tickets.closeTicket(ticket, interaction.channel as GuildTextBasedChannel);
    }

}
