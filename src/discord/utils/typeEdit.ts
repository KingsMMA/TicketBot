import chalk from 'chalk';
import {
    ActionRowBuilder,
    ButtonBuilder,
    InteractionReplyOptions,
    InteractionResponse,
    Message,
    MessagePayload
} from 'discord.js';
import { ButtonInteraction } from 'discord.js';
import { CommandInteraction } from 'discord.js';

import KingsDevEmbedBuilder from './kingsDevEmbedBuilder';
import {ButtonStyle, ComponentType} from "discord-api-types/v10";

const loggerInitialisedMessage = 'Logger initialised';

declare module 'discord.js' {
    interface CommandInteraction {
        safeReply(options: string | MessagePayload | InteractionReplyOptions): Promise<Message | InteractionResponse>;
        replySuccess(message: string, ephemeral?: boolean): Promise<Message | InteractionResponse>;
        replyError(message: string, ephemeral?: boolean): Promise<Message | InteractionResponse>;
        replyConfirmation(message: string, ephemeral?: boolean): Promise<boolean>;
    }
    interface ButtonInteraction {
        safeReply(options: string | MessagePayload | InteractionReplyOptions): Promise<Message | InteractionResponse>;
        replySuccess(message: string, ephemeral?: boolean): Promise<Message | InteractionResponse>;
        replyError(message: string, ephemeral?: boolean): Promise<Message | InteractionResponse>;
        replyConfirmation(message: string, ephemeral?: boolean): Promise<boolean>;
    }
}

CommandInteraction.prototype.safeReply = ButtonInteraction.prototype.safeReply = async function (options: string | MessagePayload | InteractionReplyOptions) {
    if (this.replied || !this.isRepliable() || this.deferred)
        return this.editReply(options);
    else
        return this.reply(options);
};

CommandInteraction.prototype.replySuccess = ButtonInteraction.prototype.replySuccess = async function (message: string, ephemeral?: boolean) {
    return this.safeReply({
        ephemeral: ephemeral,
        embeds: [
            new KingsDevEmbedBuilder()
                .setColor('Green')
                .setTitle('Success')
                .setDescription(message)
        ],
    });
};

CommandInteraction.prototype.replyError = ButtonInteraction.prototype.replyError = async function (message: string, ephemeral?: boolean) {
    return this.safeReply({
        ephemeral: ephemeral,
        embeds: [
            new KingsDevEmbedBuilder()
                .setColor('Red')
                .setTitle('Error')
                .setDescription(message)
        ],
    });
};

CommandInteraction.prototype.replyConfirmation = ButtonInteraction.prototype.replyConfirmation = async function (message: string, ephemeral?: boolean): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
        if (!(this.replied || !this.isRepliable() || this.deferred)) await this.deferReply();
        const response = await this.followUp({
            ephemeral: ephemeral,
            embeds: [
                new KingsDevEmbedBuilder()
                    .setColor('Yellow')
                    .setTitle('Are you sure?')
                    .setDescription(message)
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId('confirm')
                            .setLabel('Confirm')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('cancel')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Danger)
                    ])
            ]
        });

        const buttonInt = await response.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: 60000,
            filter: i => i.user.id === this.user.id &&
                (i.customId === 'confirm' || i.customId === 'cancel')
        })
            .catch(() => {
                this.editReply({
                    embeds: [
                        new KingsDevEmbedBuilder()
                            .setColor('Red')
                            .setTitle('Timed out.')
                            .setDescription('This timed out.  Please try again.')
                    ],
                    components: []
                });
                resolve(false);
            });

        if (!buttonInt) return resolve(false);

        await buttonInt.deferUpdate();
        if (buttonInt.customId === 'confirm') {
            await this.editReply({
                embeds: [
                    new KingsDevEmbedBuilder()
                        .setColor('Green')
                        .setTitle('Confirmed')
                        .setDescription('This action has been confirmed.')
                ],
                components: []
            });
            resolve(true);
        } else if (buttonInt.customId === 'cancel') {
            await this.editReply({
                embeds: [
                    new KingsDevEmbedBuilder()
                        .setColor('Red')
                        .setTitle('Cancelled')
                        .setDescription('This action has been cancelled.')
                ],
                components: []
            });
            resolve(false);
        }
    });
};

const real = {
    log: console.log,
    error: console.error,
};

console.log = (message?: any, ...optionalParams: any[]) => {
    const params = [
        message
    ];
    if (optionalParams.length) {
        params.push(...optionalParams);
    }
    for (let i = 0; i < params.length; i++) {
        if (typeof params[i] === 'string') {
            params[i] = chalk.blue(params[i]);
        }
    }
    real.log(chalk.red(`[${time()}] >`), ' ', ...params);
};

console.info = (message?: any, ...optionalParams: any[]) => {
    const params = [
        message
    ];
    if (optionalParams.length) {
        params.push(...optionalParams);
    }
    for (let i = 0; i < params.length; i++) {
        if (typeof params[i] === 'string') {
            params[i] = chalk.cyan(params[i]);
        }
    }
    real.log(chalk.red(`[${time()}] >`), ' ', ...params);
};

console.debug = (message?: any, ...optionalParams: any[]) => {
    const params = [
        message
    ];
    if (optionalParams.length) {
        params.push(...optionalParams);
    }
    real.log(chalk.red(`[${time()}] >`), ' ', chalk.blueBright(...params));
};

console.error = (e: Error) => {
    real.error(chalk.bgRedBright.white(`[${time()}] ERROR >`), ' ', chalk.red(e), chalk.red(e.stack));
};

function time() {
    return new Date()
        .toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
}

export default loggerInitialisedMessage;
