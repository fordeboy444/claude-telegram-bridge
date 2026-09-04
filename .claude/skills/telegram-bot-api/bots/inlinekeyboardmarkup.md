# inlinekeyboardmarkup

- **URL:** https://core.telegram.org/bots/api/available-types/inlinekeyboardmarkup
- **Summary:** InlineKeyboardMarkup This object represents an inline keyboard that appears right next to the message it belongs to. | inline_keyboard | Array of Array of InlineKeyboardButton | Array of button rows, each represented by an Array of InlineKeyboardButton<br> objects | | force_reply | Boolean |...

# inlinekeyboardmarkup

InlineKeyboardMarkup

This object represents an [inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)
 that appears right next to the message it belongs to.

| Field | Type | Description |
| --- | --- | --- |
| inline_keyboard | Array of Array of [InlineKeyboardButton](https://core.telegram.org/bots/api#inlinekeyboardbutton) | Array of button rows, each represented by an Array of [InlineKeyboardButton](https://core.telegram.org/bots/api#inlinekeyboardbutton)<br> objects |
| force_reply | Boolean | _Optional_. Pass _True_ if the reply interface must be shown to the user, as if they had manually selected the bot's message and tapped 'Reply'. The value of the field can't be changed when the inline keyboard is edited. |
