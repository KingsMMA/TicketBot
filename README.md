# Ticket Bot
###### A commission developed by KingsDev

![Support ticket panel](https://github.com/user-attachments/assets/6076c2d3-a14f-40b8-9c37-56057aab6097)
###### To see more of my work, including more screenshots, go to https://kingrabbit.dev/

Ticket Bot is an advanced ticketing management system, with it's most unique selling point being the ticket panels being fully customisable from inside Discord.  The bot stores all of its data per-server, meaning one instance of the bot can handle the tickets for an unlimited number of discord servers.  The bot allows users to create tickets using the ticket configs provided by server staff, with extensive customisability being supported.  Server staff can setup which users and roles (and optionally the ticket owner) can manage the ticket; they can also configure the category, name template, maximum number of tickets per user, and default role overrides for each individual ticket config.  Users and roles can be added to tickets as either a viewer or a manager.  As previously stated, the ticket panels and starting messages are fully configurable from inside Discord.

The name template and the message content for ticket configs can contain the following variables:

| Variable  | Result                      |  
|-----------|-----------------------------|
| {user}    | The ticket owner's username |
| {tag}     | The ticket owner's tag      |
| {id}      | The ticket owner's user ID  |
| {mention} | Pings the ticket owner      |


## Commands
`<>` required parameter  
`[]` optional parameter

### `/create <config-name>`
Creates a ticket using a ticket config, as if the user had clicked the corresponding button.

### `/add <user/role> <permission>`
Adds a user or a role to a ticket, giving them perms to either view or manage the ticket.  This command can only be run be a user with perms to manage the respective ticket.

### `/remove <user/role>`
Removes a user or a role from a ticket.  This command can only be run be a user with perms to manage the respective ticket.

### `/close`
Closes the current ticket.  This command can only be run be a user with perms to manage the respective ticket.

---

### `/ticket-config`
Manages the server's ticket configs.  This is an admin-only command, although additional overrides can be setup with `Server Settings > Integrations`.  Autocompletion is provided for ticket config names.
- #### `/ticket-config list`
  Lists all ticket configs that have been set up.
- #### `/ticket-config view <name>`
  Displays more information about a ticket config.
- #### `/ticket-config create <name> <category> <name-template> <max-tickets> <can-owner-manage>`
  Creates a new ticket config.
- #### `/ticket-config edit <name> [category] [name-template] [max-tickets] [can-owner-manage]`
  Edits an existing ticket config.
- #### `/ticket-config set-message <name>`
  Opens the message builder to create the message that appears at the start of tickets using the provided ticket config.  If the message is left completely blank, none will be sent.
- #### `/ticket-config set-default-override <name> <user-role> <permission>`
  Sets up a default permission override for a user or role for all future tickets created using the ticket config.  For example, this can be used to add staff as ticket managers to all support tickets.
- #### `/ticket-config remove-default-override <name> <user-role>`
  Removes the default permission override for a user or role that was created using `/ticket-config set-default-override`.
- #### `/ticket-config clone <name> <new-name>`
  Creates a clone of a ticket config.
- #### `/ticket-config delete <name>`
  Deletes a ticket config.

### `/panel`
Manages the server's ticket panels.  This is an admin-only command, although additional overrides can be setup with `Server Settings > Integrations`.  Autocompletion is provided for panel names.
- #### `/panel list`
  Lists all ticket panels that have been set up.
- #### `/panel send <panel> [channel]`
  Sends a ticket panel to a channel.  If no channel was provided, the current channel will be used.
- #### `/panel create <panel>`
  Creates a new ticket panel with the provided name.  This immediately opens up the message builder for the panel, although this can later be reopned with `/panel edit`.
- #### `/panel edit <panel>`
  Edits an existing ticket panel by opening up the message builder for it.
- #### `/panel clone <panel> <new-panel>`
  Creates a clone of a ticket panel.
- #### `/panel delete <panel>`
  Deletes a ticket panel.

## Running the bot
The bot is built using Node.js 20.  To run the bot, install the required dependencies with `npm i` and then run the bot with `npm run start`.  
The bot requires environment variables to be set (optionally through the creation of a `.env` file):
- `BOT_ID` - The bot's user ID
- `BOT_TOKEN` - The bot token
- `MONGO_URI` - The MongoDB URI the bot should connect to.  This database will be used to store the ticket configs, ticket panels, and active tickets.
