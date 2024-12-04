import type {GuildMember, GuildTextBasedChannel} from 'discord.js';
import type { Snowflake } from 'discord-api-types/v10';
import { ChannelType, PermissionFlagsBits } from 'discord-api-types/v10';

import type { ActiveTicket, TicketConfig } from '../../main/util/types';
import type TicketBot from '../ticketBot';
import DbMessageEditor from './dbMessageEditor';

const allowOverwrites: bigint[] = [
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
        await this.client.main.mongo.removeTicket(ticket.guildId, ticket.id);
        await channel.delete();
    }

}
