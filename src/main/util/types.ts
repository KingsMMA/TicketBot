import {ButtonStyle, Snowflake} from "discord-api-types/v10";

export type MongoEmbed = {
    title: string;
    description: string;
    color: string;
    fields: {
        name: string;
        value: string;
        inline: boolean;
    }[];
};

export type MongoButton = {
    type: number;
    customId: string;
    label: string;
    style: ButtonStyle;
};

export type MongoMessage = {
    content: string;
    embeds: MongoEmbed[];
    buttons: MongoButton[];
};

export type TicketPanel = {
    guildId: string;
    message: MongoMessage;
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
    message: MongoMessage;
};

export type ActiveTicket = TicketConfig & {
    id: Snowflake;
    owner: Snowflake;
}
