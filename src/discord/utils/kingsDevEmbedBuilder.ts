import { EmbedBuilder } from 'discord.js';

export default class KingsDevEmbedBuilder extends EmbedBuilder {
    constructor() {
        super();
        this.setFooter({
            text: 'Made by kingsdev (664018411214340116)',
            iconURL: 'https://cdn.discordapp.com/avatars/1206137962476212234/8035b5896160f52be789e7a0bcee9b1e.webp',
        });
        this.setTimestamp(new Date());
    }

    addField(name: string, value: string, inline = false): this {
        super.addFields({ name, value, inline });
        return this;
    }
}
