import type { ButtonStyle, Snowflake } from 'discord-api-types/v10';

export type DbEmbed = {
    title: string;
    description: string;
    color: string;
    fields: {
        name: string;
        value: string;
        inline: boolean;
    }[];
};

export type DbButton = {
    customId: string;
    label: string;
    style: ButtonStyle;
    disabled: boolean;
    emoji?: string;
};

export type DbMessage = {
    content: string;
    embeds: DbEmbed[];
    buttons: DbButton[];
};

export type TicketPanel = {
    guildId: string;
    name: string;
    message: DbMessage;
};

export type TicketConfig = {
    guildId: string;
    category: Snowflake;
    nameTemplate: string;
    managerRoles: Snowflake[];
    viewerRoles: Snowflake[];
    managerUsers: Snowflake[];
    viewerUsers: Snowflake[];
    ownerCanManage: boolean;
    maxTickets: number;
    message?: DbMessage;
    type: string;
    logChannel?: Snowflake;
};

export type ActiveTicket = TicketConfig & {
    id: Snowflake;
    owner: Snowflake;
}
