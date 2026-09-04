# [](https://core.telegram.org/bots/api#richmessagebutton)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#richmessagebutton)\
- **Summary:** This object represents a button in a RichMessage\ .

# \

RichMessageButton\
\
This object represents a button in a [RichMessage](https://core.telegram.org/bots/api#richmessage)\
. Exactly one of the fields other than _text_ and _style_ must be used to specify the type of the button.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| text | [RichText](https://core.telegram.org/bots/api#richtext) | Text of the button. May contain only plain text, [RichTextCustomEmoji](https://core.telegram.org/bots/api#richtextcustomemoji)<br> and [RichTextDateTime](https://core.telegram.org/bots/api#richtextdatetime)<br> entities. |\
| style | String | _Optional_. Style of the button. Must be one of “danger”, “success”, “primary”, or “link” (the button is shown as a regular link without borders). Apps may use theme-specific colors for the button background and text based on the style. The style “link” is allowed only for callback buttons. |\
| url | String | _Optional_. HTTP or tg:// URL to be opened when the button is pressed. Links `tg://user?id=<user_id>` can be used to mention a user by their identifier without using a username, if this is allowed by their privacy settings. |\
| callback_data | String | _Optional_. Data to be sent in a [callback query](https://core.telegram.org/bots/api#callbackquery)<br> to the bot when the button is pressed, 1-64 bytes |\
| web_app | [WebAppInfo](https://core.telegram.org/bots/api#webappinfo) | _Optional_. Description of the [Web App](https://core.telegram.org/bots/webapps)<br> that will be launched when the user presses the button. The Web App will be able to send an arbitrary message on behalf of the user using the method [answerWebAppQuery](https://core.telegram.org/bots/api#answerwebappquery)<br>. Available only in private chats between a user and the bot. Not supported for messages sent on behalf of a business account. |\
| login_url | [LoginUrl](https://core.telegram.org/bots/api#loginurl) | _Optional_. An HTTPS URL used to automatically authorize the user. Can be used as a replacement for the [Telegram Login Widget](https://core.telegram.org/widgets/login)<br>. Not supported for ephemeral messages. |\
| switch_inline_query | String | _Optional_. If set, pressing the button will prompt the user to select one of their chats, open that chat and insert the bot's username and the specified inline query in the input field. May be empty, in which case just the bot's username will be inserted. Not supported for messages sent in channel direct messages chats and on behalf of a business account. |\
| switch_inline_query_current_chat | String | _Optional_. If set, pressing the button will insert the bot's username and the specified inline query in the current chat's input field. May be empty, in which case only the bot's username will be inserted. Not supported in channels and for messages sent in channel direct messages chats and on behalf of a business account. |\
| switch_inline_query_chosen_chat | [SwitchInlineQueryChosenChat](https://core.telegram.org/bots/api#switchinlinequerychosenchat) | _Optional_. If set, pressing the button will prompt the user to select one of their chats of the specified type, open that chat and insert the bot's username and the specified inline query in the input field. Not supported for messages sent in channel direct messages chats and on behalf of a business account. |\
| copy_text | [CopyTextButton](https://core.telegram.org/bots/api#copytextbutton) | _Optional_. A button that copies the specified text to the clipboard |\
| disabled | [DisabledButton](https://core.telegram.org/bots/api#disabledbutton) | _Optional_. If set, then the button is disabled and does nothing |\
\
