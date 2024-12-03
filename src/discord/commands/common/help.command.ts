import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { PermissionsBitField } from 'discord.js';
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types/v10';

import type TicketBot from '../../ticketBot';
import KingsDevEmbedBuilder from '../../utils/kingsDevEmbedBuilder';
import BaseCommand from '../base.command';

export default class HelpCommand extends BaseCommand {
    constructor(client: TicketBot) {
        super(client, {
            name: 'help',
            description: 'Get more information about the bot and its commands.',
            type: ApplicationCommandType.ChatInput,
            default_member_permissions: PermissionsBitField.Flags.Administrator.toString(),
            options: [
                {
                    name: 'command',
                    description: 'The command you want to get more information about.',
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true,
                },
            ],
        });
    }

    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getString('command');

        if (command) {
            const cmd = this.client.commands.get(command);
            if (!cmd) {
                return interaction.reply({
                    embeds: [
                        new KingsDevEmbedBuilder()
                            .setTitle('Command not found')
                            .setDescription(`The command \`${command}\` was not found.`)
                            .setColor(0xff0000)
                    ],
                });
            }

            return interaction.reply({
                embeds: [
                    new KingsDevEmbedBuilder()
                        .setAuthor({
                            name: `Help - /${cmd.name}`,
                            iconURL: this.client.user?.displayAvatarURL(),
                        })
                        .setDescription(
                            `**Description**: ${cmd.description}\n**Usage**: /${cmd.name} ${
                                cmd.options
                                    ?.map(o => {
                                        if (o.required) return `<${o.name}>`;
                                        return `[${o.name}]`;
                                    })
                                    .join(' ') || ''
                            }${cmd.options ? '\n<> - required, [] - optional' : ''}`
                        )
                        .setFields(
                            cmd.options
                                ? [
                                    {
                                        name: '**Options**',
                                        value: cmd.options?.map(o => `\`${o.name}\` - ${o.description}`)
                                            .join('\n'),
                                    },
                                ]
                                : []
                        )
                        .setColor(0x006994),
                ],
            });
        }

        return interaction.reply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setAuthor({
                        name: `Help Menu - ${this.client.user?.username}`,
                        iconURL: this.client.user?.displayAvatarURL(),
                    })
                    .setDescription('For more information about a specific command, type `/help [command]`.')
                    .setFields([
                        {
                            name: '**Commands**',
                            value: this.client.commands.map(c => `\`${c.name}\` - ${c.description}`)
                                .join('\n'),
                        },
                    ])
                    .setColor(0x006994),
            ],
        });
    }

    autocomplete(interaction: AutocompleteInteraction) {
        if (interaction.options.getFocused(true)?.name === 'command') {
            return interaction.respond(
                this.client.commands.map(command => {
                    return {
                        name: `/${command.name}`,
                        value: command.name,
                    };
                })
            );
        }

        return interaction.respond([]);
    }
}
