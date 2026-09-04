# keyboardbutton

- **URL:** https://core.telegram.org/bots/api/available-types/keyboardbutton
- **Summary:** This object represents one button of the reply keyboard.

# keyboardbutton

KeyboardButton

This object represents one button of the reply keyboard. At most one of the fields other than _text_, _icon_custom_emoji_id_, and _style_ must be used to specify the type of the button. For simple text buttons, _String_ can be used instead of this object to specify the button text.

| Field | Type | Description |
| --- | --- | --- |
| text | String | Text of the button. If none of the fields other than _text_, _icon_custom_emoji_id_, and _style_ are used, it will be sent as a message when the button is pressed. |
| icon_custom_emoji_id | String | _Optional_. Unique identifier of the custom emoji shown before the text of the button. Can only be used by bots that purchased additional usernames on [Fragment](https://fragment.com/)<br> or in the messages directly sent by the bot to private, group and supergroup chats if the owner of the bot has a Telegram Premium subscription. |
| style | String | _Optional_. Style of the button. Must be one of “danger” (red), “success” (green) or “primary” (blue). If omitted, then an app-specific style is used. |
| request_users | [KeyboardButtonRequestUsers](https://core.telegram.org/bots/api#keyboardbuttonrequestusers) | _Optional_. If specified, pressing the button will open a list of suitable users. Identifiers of selected users will be sent to the bot in a “users_shared” service message. Available in private chats only. |
| request_chat | [KeyboardButtonRequestChat](https://core.telegram.org/bots/api#keyboardbuttonrequestchat) | _Optional_. If specified, pressing the button will open a list of suitable chats. Tapping on a chat will send its identifier to the bot in a “chat_shared” service message. Available in private chats only. |
| request_managed_bot | [KeyboardButtonRequestManagedBot](https://core.telegram.org/bots/api#keyboardbuttonrequestmanagedbot) | _Optional_. If specified, pressing the button will ask the user to create and share a bot that will be managed by the current bot. Available for bots that enabled management of other bots in the [@BotFather](https://t.me/BotFather)<br> Mini App. Available in private chats only. |
| request_contact | Boolean | _Optional_. If _True_, the user's phone number will be sent as a contact when the button is pressed. Available in private chats only. |
| request_location | Boolean | _Optional_. If _True_, the user's current location will be sent when the button is pressed. Available in private chats only. |
| request_poll | [KeyboardButtonPollType](https://core.telegram.org/bots/api#keyboardbuttonpolltype) | _Optional_. If specified, the user will be asked to create a poll and send it to the bot when the button is pressed. Available in private chats only. |
| web_app | [WebAppInfo](https://core.telegram.org/bots/api#webappinfo) | _Optional_. If specified, the described [Web App](https://core.telegram.org/bots/webapps)<br> will be launched when the button is pressed. The Web App will be able to send a “web_app_data” service message. Available in private chats only. |
