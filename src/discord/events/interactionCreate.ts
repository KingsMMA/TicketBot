import type { Interaction } from 'discord.js';

import type TicketBot from '../ticketBot';

export default class {
    client: TicketBot;
    constructor(client: TicketBot) {
        this.client = client;
    }

    async run(interaction: Interaction) {
        if (interaction.isCommand()) {
            if (!interaction.guild) return interaction.replyError('This command can only be used in a guild.');

            const command = this.client.commands.get(interaction.commandName);
            if (!command) return;

            if (!command.opts.enabled) {
                return interaction.reply({
                    content: 'This command is currently disabled.',
                    ephemeral: true,
                });
            }

            return command.execute(interaction);
        } else if (interaction.isAutocomplete()) {
            const command = this.client.commands.get(interaction.commandName);
            if (!command) return;
            return command.autocomplete(interaction);
        } else if (interaction.isButton()) {
            if (!interaction.guild) return interaction.replyError('This button can only be used in a guild.');

            if (interaction.customId.startsWith('create-ticket:')) {
                await interaction.deferReply({ ephemeral: true });

                const ticketConfigName = interaction.customId.split(':')[1];
                const ticketConfig = await this.client.main.mongo.fetchTicketConfigs(interaction.guildId!)
                    .then(configs => configs[ticketConfigName]);
                if (!ticketConfig) return;

                const usersOpenTickets = await this.client.main.mongo.fetchActiveTickets(interaction.guildId!)
                    .then(tickets => Object.values(tickets))
                    .then(tickets => tickets.filter(ticket => ticket.owner === interaction.user.id && ticket.type === ticketConfigName));

                if (usersOpenTickets.length >= ticketConfig.maxTickets)
                    return interaction.replyError('You already have the maximum number of open tickets for this type.  Please close one before opening another.');

                await interaction.editReply('Creating ticket...');

                const member = await interaction.guild.members.fetch(interaction.user.id)
                    .catch(() => null);
                if (!member) return interaction.replyError('Failed to fetch member.');

                const ticketChannelId = await this.client.tickets.createTicket(member, ticketConfig);
                if (!ticketChannelId) return interaction.replyError('Failed to create ticket.');
                return interaction.editReply(`Ticket created!  <#${ticketChannelId}>`);
            }
        }
    }
}
