import type { UUID } from 'node:crypto';
import { randomUUID } from 'node:crypto';

import type {
    ButtonInteraction,
    ChatInputCommandInteraction,
    InteractionCollector,
    Message } from 'discord.js';
import {
    ActionRowBuilder,
    ButtonBuilder, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder
} from 'discord.js';
import type { APIEmbed } from 'discord-api-types/v10';
import { ButtonStyle, ComponentType, TextInputStyle } from 'discord-api-types/v10';

import type { DbButton, DbEmbed, DbMessage } from '../../main/util/types';


export default class DbMessageEditor {

    id: UUID;
    message: DbMessage;
    interaction?: ChatInputCommandInteraction;
    completableFuture?: Promise<DbMessage>;
    resolve?: CallableFunction;
    editor?: Message;
    collector?: InteractionCollector<ButtonInteraction>;

    constructor(message: DbMessage) {
        this.message = message;
        this.id = randomUUID();
    }

    async editMessage(interaction: ChatInputCommandInteraction): Promise<DbMessage> {
        if (this.completableFuture) return this.completableFuture;
        this.interaction = interaction;
        this.completableFuture = new Promise(async (resolve, reject) => {
            this.resolve = resolve;

            await this.updateMessage();
            this.editor = await (await this.interaction!.fetchReply())
                .reply({
                    content: 'Editing message...',
                });
            await this.updateEditor();

            this.collector = this.editor.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: interaction => interaction.user.id === this.interaction!.user.id
                && interaction.customId.endsWith(this.id),
                time: 120_000,
            });
            this.collector.on('collect', async interaction => {
                this.collector?.resetTimer();

                switch (interaction.customId.split('-')[0]) {
                    case 'done':
                        this.collector!.stop();
                        void interaction.deferUpdate();
                        break;
                    case 'content':
                        let contentInput = new TextInputBuilder()
                            .setCustomId('content')
                            .setLabel('New Content:')
                            .setRequired(false)
                            .setStyle(TextInputStyle.Paragraph);
                        if (this.message.content)
                            contentInput = contentInput.setValue(this.message.content);
                        await interaction.showModal(
                            new ModalBuilder()
                                .setTitle('Edit Message Content')
                                .setCustomId(`content-${this.id}`)
                                .addComponents(
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            contentInput,
                                        ]),
                                )
                        );
                        const contentSubmission = await interaction.awaitModalSubmit({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `content-${this.id}`,
                        })
                            .catch(() => null);
                        if (contentSubmission) {
                            void contentSubmission.deferUpdate();
                            this.message.content = contentSubmission.components[0].components[0].value || '';
                            await this.updateMessage();
                        }
                        break;
                    case 'embeds':
                        void interaction.deferUpdate();
                        if (this.message.embeds.length === 0) {
                            this.message.embeds.push({
                                title: '',
                                description: 'Description.',
                                color: '000000',
                                fields: [],
                            });
                        } else {
                            this.message.embeds = [];
                        }
                        await this.updateMessage();
                        await this.updateEditor();
                        break;
                    case 'title':
                        let titleInput = new TextInputBuilder()
                            .setCustomId('title')
                            .setLabel('New Title:')
                            .setRequired(false)
                            .setStyle(TextInputStyle.Short);
                        if (this.message.embeds[0].title)
                            titleInput = titleInput.setValue(this.message.embeds[0].title);
                        await interaction.showModal(
                            new ModalBuilder()
                                .setTitle('Edit Embed Title')
                                .setCustomId(`title-${this.id}`)
                                .addComponents(
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            titleInput,
                                        ]),
                                )
                        );
                        const titleSubmission = await interaction.awaitModalSubmit({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `title-${this.id}`,
                        })
                            .catch(() => null);
                        if (titleSubmission) {
                            void titleSubmission.deferUpdate();
                            this.message.embeds[0].title = titleSubmission.components[0].components[0].value || '';
                            await this.updateMessage();
                        }
                        break;
                    case 'description':
                        let descriptionInput = new TextInputBuilder()
                            .setCustomId('description')
                            .setLabel('New Description:')
                            .setRequired(true)
                            .setStyle(TextInputStyle.Paragraph);
                        if (this.message.embeds[0].description)
                            descriptionInput = descriptionInput.setValue(this.message.embeds[0].description);
                        await interaction.showModal(
                            new ModalBuilder()
                                .setTitle('Edit Embed Description')
                                .setCustomId(`description-${this.id}`)
                                .addComponents(
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            descriptionInput,
                                        ]),
                                )
                        );
                        const descriptionSubmission = await interaction.awaitModalSubmit({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `description-${this.id}`,
                        })
                            .catch(() => null);
                        if (descriptionSubmission) {
                            void descriptionSubmission.deferUpdate();
                            this.message.embeds[0].description = descriptionSubmission.components[0].components[0].value || 'Please provide a description.';
                            await this.updateMessage();
                        }
                        break;
                    case 'color':
                        let colourInput = new TextInputBuilder()
                            .setCustomId('color')
                            .setLabel('New Color:')
                            .setRequired(false)
                            .setPlaceholder('Hex color code (no #).')
                            .setStyle(TextInputStyle.Short);
                        if (this.message.embeds[0].color)
                            colourInput = colourInput.setValue(this.message.embeds[0].color);
                        await interaction.showModal(
                            new ModalBuilder()
                                .setTitle('Edit Embed Color')
                                .setCustomId(`color-${this.id}`)
                                .addComponents(
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            colourInput,
                                        ]),
                                )
                        );
                        const colourSubmission = await interaction.awaitModalSubmit({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `color-${this.id}`,
                        })
                            .catch(() => null);
                        if (colourSubmission) {
                            // check format of colour
                            if (!/^[0-9A-Fa-f]{6}$/.test(colourSubmission.components[0].components[0].value || '000000')) {
                                void colourSubmission.reply({
                                    content: 'Invalid color format. Please provide a valid hex color code (no #).',
                                    ephemeral: true,
                                });
                                return;
                            }
                            void colourSubmission.deferUpdate();
                            this.message.embeds[0].color = colourSubmission.components[0].components[0].value || '000000';
                            await this.updateMessage();
                        }
                        break;
                    case 'afield':
                        await interaction.showModal(
                            new ModalBuilder()
                                .setTitle('Edit Embed Color')
                                .setCustomId(`afi-${this.id}`)
                                .addComponents(
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('name')
                                                .setLabel('Field name:')
                                                .setRequired(true)
                                                .setStyle(TextInputStyle.Short),
                                        ]),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents(
                                            new TextInputBuilder()
                                                .setCustomId('value')
                                                .setLabel('Field value:')
                                                .setRequired(true)
                                                .setStyle(TextInputStyle.Paragraph),
                                        ),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents(
                                            new TextInputBuilder()
                                                .setCustomId('inline')
                                                .setLabel('Inline?')
                                                .setRequired(true)
                                                .setStyle(TextInputStyle.Short)
                                                .setValue('true'),
                                        )
                                )
                        );
                        const fieldSubmission = await interaction.awaitModalSubmit({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `afi-${this.id}`,
                        })
                            .catch(() => null);

                        if (!fieldSubmission) return;
                        const name = fieldSubmission?.components[0].components[0].value || '';
                        const value = fieldSubmission?.components[1].components[0].value || '';
                        const inline = fieldSubmission?.components[2].components[0].value === 'true';
                        if (!name || !value) {
                            void fieldSubmission?.reply({
                                content: 'Please provide a name and value for the field.',
                                ephemeral: true,
                            });
                            return;
                        }

                        void fieldSubmission.deferUpdate();
                        this.message.embeds[0].fields.push({
                            name,
                            value,
                            inline,
                        });
                        await this.updateMessage();
                        break;
                    case 'rfields':
                        if (this.message.embeds[0].fields.length === 0)
                            return interaction.replyError('No fields to edit.', true);
                        await interaction.deferReply();
                        const selectFieldMessage = await interaction.followUp({
                            content: 'Select a field to edit or remove.',
                            components: [
                                new ActionRowBuilder<StringSelectMenuBuilder>()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId(`sel-field-${this.id}`)
                                            .setMinValues(1)
                                            .setMaxValues(1)
                                            .addOptions(
                                                this.message.embeds[0].fields.map((field, index) => ({
                                                    label: field.name,
                                                    description: field.value.substring(0, 50),
                                                    value: index.toString(),
                                                })),
                                            )
                                    ),
                            ],
                        });
                        const selectField = await selectFieldMessage.awaitMessageComponent({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `sel-field-${this.id}`,
                            componentType: ComponentType.StringSelect,
                        })
                            .catch(() => null);
                        if (!selectField) return;
                        const index = parseInt(selectField.values[0]);
                        const field = this.message.embeds[0].fields[index];

                        await selectField.showModal(
                            new ModalBuilder()
                                .setTitle('Edit Field - Leave anything blank to delete.')
                                .setCustomId(`edit-field-${this.id}`)
                                .addComponents(
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('name')
                                                .setLabel('Field name:')
                                                .setRequired(false)
                                                .setStyle(TextInputStyle.Short)
                                                .setValue(field.name),
                                        ]),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents(
                                            new TextInputBuilder()
                                                .setCustomId('value')
                                                .setLabel('Field value:')
                                                .setRequired(false)
                                                .setStyle(TextInputStyle.Paragraph)
                                                .setValue(field.value),
                                        ),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents(
                                            new TextInputBuilder()
                                                .setCustomId('inline')
                                                .setLabel('Inline?')
                                                .setRequired(true)
                                                .setStyle(TextInputStyle.Short)
                                                .setValue(field.inline.toString()),
                                        )
                                )
                        );
                        void selectFieldMessage.delete();

                        const editFieldSubmission = await selectField.awaitModalSubmit({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `edit-field-${this.id}`,
                        })
                            .catch(() => null);
                        if (!editFieldSubmission) return;

                        void editFieldSubmission.deferUpdate();
                        const newName = editFieldSubmission.components[0].components[0].value || '';
                        const newValue = editFieldSubmission.components[1].components[0].value || '';
                        const newInline = editFieldSubmission.components[2].components[0].value === 'true';
                        if (!newName && !newValue) {
                            this.message.embeds[0].fields.splice(index, 1);
                        } else {
                            field.name = newName;
                            field.value = newValue;
                            field.inline = newInline;
                        }

                        await this.updateMessage();
                        break;
                    case 'addbutton':
                        await interaction.showModal(
                            new ModalBuilder()
                                .setTitle('Add Button')
                                .setCustomId(`add-button-${this.id}`)
                                .addComponents(
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('id')
                                                .setLabel('Button ID:')
                                                .setRequired(true)
                                                .setStyle(TextInputStyle.Short)
                                                .setPlaceholder('"create-ticket-${ticket-name}", "close"'),
                                        ]),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('label')
                                                .setLabel('Button Label:')
                                                .setRequired(true)
                                                .setStyle(TextInputStyle.Short),
                                        ]),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('style')
                                                .setLabel('Button Style:')
                                                .setRequired(true)
                                                .setStyle(TextInputStyle.Short)
                                                .setPlaceholder('Primary, Secondary, Success, Danger'),
                                        ]),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('disabled')
                                                .setLabel('Disabled:')
                                                .setRequired(true)
                                                .setStyle(TextInputStyle.Short)
                                                .setValue('false'),
                                        ]),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('emoji')
                                                .setLabel('Button Emoji:')
                                                .setRequired(false)
                                                .setStyle(TextInputStyle.Short),
                                        ]),
                                )
                        );
                        const buttonSubmission = await interaction.awaitModalSubmit({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `add-button-${this.id}`,
                        })
                            .catch(() => null);
                        if (buttonSubmission) {
                            await buttonSubmission.deferReply({ ephemeral: true });
                            try {
                                this.message.buttons.push({
                                    customId: buttonSubmission.components[0].components[0].value || '',
                                    label: buttonSubmission.components[1].components[0].value || '',
                                    style: ButtonStyle[buttonSubmission.components[2].components[0].value as keyof typeof ButtonStyle],
                                    disabled: buttonSubmission.components[3].components[0].value === 'true',
                                    emoji: buttonSubmission.components[4].components[0].value || undefined,
                                });
                                await this.updateMessage();
                                await this.updateEditor();
                            } catch (e) {
                                console.error(e);
                                void buttonSubmission.editReply({
                                    content: 'Invalid button style / emoji.',
                                });
                            }
                        }
                        break;
                    case 'editbutton':
                        if (this.message.buttons.length === 0)
                            return interaction.replyError('No buttons to edit.', true);
                        await interaction.deferReply();
                        const selectButtonMessage = await interaction.followUp({
                            content: 'Select a button to edit.',
                            components: [
                                new ActionRowBuilder<StringSelectMenuBuilder>()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId(`sel-button-${this.id}`)
                                            .setMinValues(1)
                                            .setMaxValues(1)
                                            .addOptions(
                                                this.message.buttons.map((button, index) => ({
                                                    label: button.label,
                                                    description: button.customId,
                                                    value: index.toString(),
                                                })),
                                            )
                                    ),
                            ],
                        });
                        const selectButton = await selectButtonMessage.awaitMessageComponent({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `sel-button-${this.id}`,
                            componentType: ComponentType.StringSelect,
                        })
                            .catch(() => null);
                        if (!selectButton) return;
                        const ix = parseInt(selectButton.values[0]);
                        const button = this.message.buttons[ix];

                        await selectButton.showModal(
                            new ModalBuilder()
                                .setTitle('Edit Button')
                                .setCustomId(`edit-button-${this.id}`)
                                .addComponents(
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('id')
                                                .setLabel('Button ID:')
                                                .setRequired(false)
                                                .setStyle(TextInputStyle.Short)
                                                .setValue(button.customId),
                                        ]),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('label')
                                                .setLabel('Button Label:')
                                                .setRequired(false)
                                                .setStyle(TextInputStyle.Short)
                                                .setValue(button.label),
                                        ]),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('style')
                                                .setLabel('Button Style:')
                                                .setRequired(false)
                                                .setStyle(TextInputStyle.Short)
                                                .setValue(ButtonStyle[button.style]),
                                        ]),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('disabled')
                                                .setLabel('Disabled:')
                                                .setRequired(false)
                                                .setStyle(TextInputStyle.Short)
                                                .setValue(button.disabled.toString()),
                                        ]),
                                    new ActionRowBuilder<TextInputBuilder>()
                                        .addComponents([
                                            new TextInputBuilder()
                                                .setCustomId('emoji')
                                                .setLabel('Button Emoji:')
                                                .setRequired(false)
                                                .setStyle(TextInputStyle.Short)
                                                .setValue(button.emoji || ''),
                                        ]),
                                )
                        );

                        void selectButtonMessage.delete();

                        const editButtonSubmission = await selectButton.awaitModalSubmit({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `edit-button-${this.id}`,
                        })
                            .catch(() => null);
                        if (!editButtonSubmission) return;

                        await editButtonSubmission.deferUpdate();
                        const newId = editButtonSubmission.components[0].components[0].value || '';
                        const newLabel = editButtonSubmission.components[1].components[0].value || '';
                        const newStyle = ButtonStyle[editButtonSubmission.components[2].components[0].value as keyof typeof ButtonStyle];
                        const newDisabled = editButtonSubmission.components[3].components[0].value === 'true';
                        const newEmoji = editButtonSubmission.components[4].components[0].value || undefined;
                        button.customId = newId;
                        button.label = newLabel;
                        button.style = newStyle;
                        button.disabled = newDisabled;
                        button.emoji = newEmoji;
                        await this.updateMessage();
                        break;
                    case 'removebutton':
                        if (this.message.buttons.length === 0)
                            return interaction.replyError('No buttons to remove.', true);
                        await interaction.deferReply();
                        const selectRemoveButtonMessage = await interaction.followUp({
                            content: 'Select a button to remove.',
                            components: [
                                new ActionRowBuilder<StringSelectMenuBuilder>()
                                    .addComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId(`sel-remove-button-${this.id}`)
                                            .setMinValues(1)
                                            .setMaxValues(1)
                                            .addOptions(
                                                this.message.buttons.map((button, index) => ({
                                                    label: button.label,
                                                    description: button.customId,
                                                    value: index.toString(),
                                                })),
                                            )
                                    ),
                            ],
                        });
                        const selectRemoveButton = await selectRemoveButtonMessage.awaitMessageComponent({
                            time: 120_000,
                            filter: interaction => interaction.user.id === this.interaction!.user.id
                                && interaction.customId === `sel-remove-button-${this.id}`,
                            componentType: ComponentType.StringSelect,
                        })
                            .catch(() => null);
                        void selectRemoveButtonMessage.delete();
                        if (!selectRemoveButton) return;
                        const ixx = parseInt(selectRemoveButton.values[0]);
                        this.message.buttons.splice(ixx, 1);
                        await this.updateMessage();
                        await this.updateEditor();
                        break;
                }
            });
            this.collector.on('end', async () => {
                await this.editor!.delete();
                resolve(this.message);
            });
        });
        return this.completableFuture;
    }

    async updateMessage() {
        if (this.message.content.length === 0 &&
            this.message.embeds.length === 0 &&
            this.message.buttons.length === 0) {
            return this.interaction!.editReply({
                content: '_ _',
                embeds: [],
                components: [],
            });
        }

        return this.interaction!.editReply({
            content: this.message.content,
            embeds: DbMessageEditor.parseEmbeds(this.message.embeds),
            components: DbMessageEditor.parseButtons(this.message.buttons),
        });
    }

    async updateEditor() {
        return this.editor!.edit({
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId(`done-${this.id}`)
                            .setLabel('Done')
                            .setStyle(ButtonStyle.Success),
                    ]),
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId(`content-${this.id}`)
                            .setLabel('Edit Content')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`embeds-${this.id}`)
                            .setLabel(this.message.embeds.length === 0 ? 'Add Embed' : 'Remove Embed')
                            .setStyle(this.message.embeds.length === 0 ? ButtonStyle.Primary : ButtonStyle.Danger),
                    ]),
                ...(this.message.embeds.length === 0 ? [] : [
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`title-${this.id}`)
                                .setLabel('Edit Title')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`description-${this.id}`)
                                .setLabel('Edit Description')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`color-${this.id}`)
                                .setLabel('Edit Color')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`afield-${this.id}`)
                                .setLabel('Add Field')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`rfields-${this.id}`)
                                .setLabel('Edit/Remove Field')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(this.message.embeds[0].fields.length === 0),
                        )
                ]),
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`addbutton-${this.id}`)
                            .setLabel('Add Button')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`editbutton-${this.id}`)
                            .setLabel('Edit Button')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(this.message.buttons.length === 0),
                        new ButtonBuilder()
                            .setCustomId(`removebutton-${this.id}`)
                            .setLabel('Remove Button')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(this.message.buttons.length === 0),
                    )
            ],
        });
    }

    static parseEmbeds(embeds: DbEmbed[]): APIEmbed[] {
        return embeds.map(embed => this.parseEmbed(embed));
    }

    static parseEmbed(embed: DbEmbed): APIEmbed {
        return {
            title: embed.title,
            description: embed.description,
            color: parseInt(embed.color, 16),
            fields: embed.fields.map(field => ({
                name: field.name,
                value: field.value,
                inline: field.inline,
            })),
        };
    }

    static parseButtons(buttons: DbButton[]): ActionRowBuilder<ButtonBuilder>[] {
        if (buttons.length === 0) return [];
        if (buttons.length > 5) return [
            ...this.parseButtons(buttons.slice(0, 5)), ...this.parseButtons(buttons.slice(5))
        ];
        return [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    buttons.map(button => {
                        const builder = new ButtonBuilder()
                            .setCustomId(button.customId)
                            .setLabel(button.label)
                            .setStyle(button.style)
                            .setDisabled(button.disabled);
                        if (button.emoji)
                            builder.setEmoji(button.emoji);
                        return builder;
                    }
                    ))
        ];
    }

}
