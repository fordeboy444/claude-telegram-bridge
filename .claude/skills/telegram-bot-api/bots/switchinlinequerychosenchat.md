# switchinlinequerychosenchat

- **URL:** https://core.telegram.org/bots/api/available-types/switchinlinequerychosenchat
- **Summary:** SwitchInlineQueryChosenChat This object represents an inline button that switches the current user to inline mode in a chosen chat, with an optional default inline query. | query | String | _Optional_.

# switchinlinequerychosenchat

SwitchInlineQueryChosenChat

This object represents an inline button that switches the current user to inline mode in a chosen chat, with an optional default inline query.

| Field | Type | Description |
| --- | --- | --- |
| query | String | _Optional_. The default inline query to be inserted in the input field. If left empty, only the bot's username will be inserted. |
| allow_user_chats | Boolean | _Optional_. _True_, if private chats with users can be chosen |
| allow_bot_chats | Boolean | _Optional_. _True_, if private chats with bots can be chosen |
| allow_group_chats | Boolean | _Optional_. _True_, if group and supergroup chats can be chosen |
| allow_channel_chats | Boolean | _Optional_. _True_, if channel chats can be chosen |
