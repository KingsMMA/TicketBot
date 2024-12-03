import chalk from 'chalk';
import type { InteractionResponse, Message } from 'discord.js';
import { ButtonInteraction } from 'discord.js';
import { CommandInteraction } from 'discord.js';

import KingsDevEmbedBuilder from './kingsDevEmbedBuilder';

const loggerInitialisedMessage = 'Logger initialised';

declare module 'discord.js' {
    interface CommandInteraction {
        replySuccess(message: string, ephemeral?: boolean): Promise<Message | InteractionResponse>;
        replyError(message: string, ephemeral?: boolean): Promise<Message | InteractionResponse>;
    }
    interface ButtonInteraction {
        replySuccess(message: string, ephemeral?: boolean): Promise<Message | InteractionResponse>;
        replyError(message: string, ephemeral?: boolean): Promise<Message | InteractionResponse>;
    }
}

CommandInteraction.prototype.replySuccess = ButtonInteraction.prototype.replySuccess = async function (message: string, ephemeral?: boolean) {
    if (this.replied || !this.isRepliable() || this.deferred)
        return this.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setColor('Green')
                    .setTitle('Success')
                    .setDescription(message)
            ],
        });
    else
        return this.reply({
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
    if (this.replied || !this.isRepliable() || this.deferred)
        return this.editReply({
            embeds: [
                new KingsDevEmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription(message)
            ],
        });
    else
        return this.reply({
            ephemeral: ephemeral,
            embeds: [
                new KingsDevEmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error')
                    .setDescription(message)
            ],
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
