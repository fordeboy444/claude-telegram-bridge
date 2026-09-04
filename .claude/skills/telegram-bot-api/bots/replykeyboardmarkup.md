# replykeyboardmarkup

- **URL:** https://core.telegram.org/bots/api/available-types/replykeyboardmarkup
- **Summary:** This object represents a custom keyboard with reply options (see Introduction to bots for details and examples).

# replykeyboardmarkup

ReplyKeyboardMarkup

This object represents a [custom keyboard](https://core.telegram.org/bots/features#keyboards)
 with reply options (see [Introduction to bots](https://core.telegram.org/bots/features#keyboards)
 for details and examples). Not supported in channels and for messages sent on behalf of a business account.

| Field | Type | Description |
| --- | --- | --- |
| keyboard | Array of Array of [KeyboardButton](https://core.telegram.org/bots/api#keyboardbutton) | Array of button rows, each represented by an Array of [KeyboardButton](https://core.telegram.org/bots/api#keyboardbutton)<br> objects |
| is_persistent | Boolean | _Optional_. Requests clients to always show the keyboard when the regular keyboard is hidden. Defaults to _False_, in which case the custom keyboard can be hidden and opened with a keyboard icon. |
| resize_keyboard | Boolean | _Optional_. Requests clients to resize the keyboard vertically for optimal fit (e.g., make the keyboard smaller if there are just two rows of buttons). Defaults to _False_, in which case the custom keyboard is always of the same height as the app's standard keyboard. |
| one_time_keyboard | Boolean | _Optional_. Requests clients to hide the keyboard as soon as it's been used. The keyboard will still be available, but clients will automatically display the usual letter-keyboard in the chat - the user can press a special button in the input field to see the custom keyboard again. Defaults to _False_. |
| input_field_placeholder | String | _Optional_. The placeholder to be shown in the input field when the keyboard is active; 1-64 characters |
| selective | Boolean | _Optional_. Use this parameter if you want to show the keyboard to specific users only. Targets: 1) users that are @mentioned in the _text_ of the [Message](https://core.telegram.org/bots/api#message)<br> object; 2) if the bot's message is a reply to a message in the same chat and forum topic, sender of the original message.  <br>  <br>_Example:_ A user requests to change the bot's language, bot replies to the request with a keyboard to select the new language. Other users in the group don't see the keyboard. |
| force_reply | Boolean | _Optional_. Pass _True_ if the reply interface must be shown to the user, as if they had manually selected the bot's message and tapped 'Reply' |
