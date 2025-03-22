import type { GuildMember, GuildTextBasedChannel } from 'discord.js';
import type { Snowflake } from 'discord-api-types/v10';
import { ChannelType, PermissionFlagsBits } from 'discord-api-types/v10';
import discordTranscripts from 'discord-html-transcripts';

import type { ActiveTicket, TicketConfig } from '../../main/util/types';
import type TicketBot from '../ticketBot';
import DbMessageEditor from './dbMessageEditor';
import KingsDevEmbedBuilder from './kingsDevEmbedBuilder';

export const allowOverwrites: bigint[] = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.AddReactions,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.EmbedLinks,
];

const format = (str: string, member: GuildMember): string =>
    str.replaceAll('{user}', member.user.username)
        .replaceAll('{tag}', member.user.tag)
        .replaceAll('{id}', member.user.id)
        .replaceAll('{mention}', `<@${member.user.id}>`);

export class TicketManager {

    client: TicketBot;

    constructor(client: TicketBot) {
        this.client = client;
    }

    async createTicket(member: GuildMember, ticketConfig: TicketConfig): Promise<Snowflake> {
        const ticketChannel = await member.guild.channels.create({
            name: format(ticketConfig.nameTemplate, member),
            type: ChannelType.GuildText,
            parent: ticketConfig.category,
            reason: `Ticket created by ${member.user.tag}`,
            permissionOverwrites: [
                {
                    id: member.guild.id,
                    deny: [
                        PermissionFlagsBits.ViewChannel
                    ],
                },
                {
                    id: member.user.id,
                    allow: allowOverwrites,
                },
                ...ticketConfig.managerRoles.map(role => ({
                    id: role,
                    allow: allowOverwrites,
                })),
                ...ticketConfig.viewerRoles.map(role => ({
                    id: role,
                    allow: allowOverwrites,
                })),
                ...ticketConfig.managerUsers.map(user => ({
                    id: user,
                    allow: allowOverwrites,
                })),
                ...ticketConfig.viewerUsers.map(user => ({
                    id: user,
                    allow: allowOverwrites,
                }),
                ),
            ]
        });

        if (ticketConfig.message && (ticketConfig.message.content || ticketConfig.message.embeds?.length !== 0 || ticketConfig.message.buttons?.length !== 0))
            await ticketChannel.send({
                content: format(ticketConfig.message?.content, member),
                embeds: DbMessageEditor.parseEmbeds(ticketConfig.message!.embeds),
                components: DbMessageEditor.parseButtons(ticketConfig.message!.buttons),
            });

        const ticket: ActiveTicket = {
            ...ticketConfig,
            id: ticketChannel.id,
            owner: member.user.id,
        };

        await this.client.main.mongo.addTicket(ticket);

        return ticketChannel.id;
    }

    async closeTicket(ticket: ActiveTicket, channel: GuildTextBasedChannel): Promise<void> {
        await channel.send('Closing ticket...');
        await this.saveTranscript(ticket, channel);
        await this.client.main.mongo.removeTicket(ticket.guildId, ticket.id);
        await channel.delete();
    }

    async saveTranscript(ticket: ActiveTicket, channel: GuildTextBasedChannel) {
        const transcriptChannelId = ticket.logChannel;
        if (!transcriptChannelId) return;
        const transcriptChannel = await channel.guild.channels.fetch(transcriptChannelId)
            .catch(() => null);
        if (!transcriptChannel) return;

        const savingMessage = await channel.send({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle('Saving transcript...')
                    .setDescription('Please wait while the transcript is saved.')
                    .setColor('Yellow')
            ]
        });

        const attachment = await discordTranscripts.createTranscript(channel, {
            saveImages: true,
            poweredBy: false,
        });
        const message = {
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle('Transcript')
                    .setDescription(`Transcript for <#${channel.id}>`)
                    .setColor('Blue')
                    .addField('User', `<@${ticket.owner}>`, true)
                    .addField('Type', ticket.type, true)
            ],
            files: [
                attachment
            ]
        };

        await (transcriptChannel as GuildTextBasedChannel)
            .send(message)
            .catch(() => null);

        await this.client.users.fetch(ticket.owner)
            .then(user => user.send(message))
            .catch(() => null);

        await savingMessage.edit({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setTitle('Transcript Saved')
                    .setDescription('The transcript has been saved.')
                    .setColor('Green')
            ]
        });
    }

    async recalculatePermissions(ticket: ActiveTicket) {
        const channel = await this.client.channels.fetch(ticket.id) as GuildTextBasedChannel;
        await channel.edit({
            permissionOverwrites: [
                {
                    id: ticket.guildId,
                    deny: [
                        PermissionFlagsBits.ViewChannel
                    ],
                },
                {
                    id: ticket.owner,
                    allow: allowOverwrites,
                },
                ...ticket.managerRoles.map(role => ({
                    id: role,
                    allow: allowOverwrites,
                })),
                ...ticket.viewerRoles.map(role => ({
                    id: role,
                    allow: allowOverwrites,
                })),
                ...ticket.managerUsers.map(user => ({
                    id: user,
                    allow: allowOverwrites,
                })),
                ...ticket.viewerUsers.map(user => ({
                    id: user,
                    allow: allowOverwrites,
                }),
                ),
            ]
        });
    }

}
