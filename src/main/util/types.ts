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
    type: number;
    customId: string;
    label: string;
    style: ButtonStyle;
};

export type DbMessage = {
    content: string;
    embeds: DbEmbed[];
    buttons: DbButton[];
};

export type TicketPanel = {
    guildId: string;
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
