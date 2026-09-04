# keyboardbuttonrequestmanagedbot

- **URL:** https://core.telegram.org/bots/api/available-types/keyboardbuttonrequestmanagedbot
- **Summary:** KeyboardButtonRequestManagedBot This object defines the parameters for the creation of a managed bot.

# keyboardbuttonrequestmanagedbot

KeyboardButtonRequestManagedBot

This object defines the parameters for the creation of a managed bot. Information about the created bot will be shared with the bot using the update _managed_bot_ and a [Message](https://core.telegram.org/bots/api#message)
 with the field _managed_bot_created_.

| Field | Type | Description |
| --- | --- | --- |
| request_id | Integer | Signed 32-bit identifier of the request. Must be unique within the message. |
| suggested_name | String | _Optional_. Suggested name for the bot |
| suggested_username | String | _Optional_. Suggested username for the bot |
