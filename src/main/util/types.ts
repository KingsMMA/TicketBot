import {ButtonStyle, Snowflake} from "discord-api-types/v10";

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
    emoji?: {
        id?: string;
        name?: string;
        animated?: boolean;
    };
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
    parent: Snowflake;
    nameTemplate: string;
    managerRoles: Snowflake[];
    viewerRoles: Snowflake[];
    managerUsers: Snowflake[];
    viewerUsers: Snowflake[];
    maxTickets: number;
    message: DbMessage;
};

export type ActiveTicket = TicketConfig & {
    id: Snowflake;
    owner: Snowflake;
}
