# botaccesssettings

- **URL:** https://core.telegram.org/bots/api/available-types/botaccesssettings
- **Summary:** This object describes the access settings of a bot. | is_access_restricted | Boolean | _True_, if only selected users can access the bot.

# botaccesssettings

BotAccessSettings

This object describes the access settings of a bot.

| Field | Type | Description |
| --- | --- | --- |
| is_access_restricted | Boolean | _True_, if only selected users can access the bot. The bot's owner can always access it. |
| added_users | Array of [User](https://core.telegram.org/bots/api#user) | _Optional_. The list of other users who have access to the bot if the access is restricted |
