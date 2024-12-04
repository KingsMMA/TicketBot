import type { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';

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

}
