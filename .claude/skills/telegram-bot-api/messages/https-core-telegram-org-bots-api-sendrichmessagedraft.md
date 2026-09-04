# [](https://core.telegram.org/bots/api#sendrichmessagedraft)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#sendrichmessagedraft)\
- **Summary:** sendRichMessageDraft\ Use this method to stream a partial rich message to a user while the message is being generated.

# \

sendRichMessageDraft\
\
Use this method to stream a partial rich message to a user while the message is being generated. Note that the streamed draft is ephemeral and acts as a temporary 30-second preview - once the output is finalized, you **must** call [sendRichMessage](https://core.telegram.org/bots/api#sendrichmessage)\
 with the complete message to persist it in the user's chat. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer | Yes | Unique identifier for the target private chat |\
| message_thread_id | Integer | Optional | Unique identifier for the target message thread |\
| draft_id | Integer | Yes | Unique identifier of the message draft; must be non-zero. Changes to drafts with the same identifier are animated. Otherwise, the draft is replaced without animation. |\
| rich_message | [InputRichMessage](https://core.telegram.org/bots/api#inputrichmessage) | Yes | The partial message to be streamed. Direct upload of new files and explicit upload of files by a URL isn't supported. |\
| can_stop | Boolean | Optional | Pass _True_ to show the user a button to stop further drafts. The bot will receive an [Update](https://core.telegram.org/bots/api#update)<br> “stopped_message_generation” if the user presses the button. |\
| keep_on_stop | Boolean | Optional | Pass _True_ to keep the draft in the chat when the button is pressed. The draft will still disappear after a short time or if the bot sends a message. To fully preserve the partial draft, the bot should send it as a new message. |\
\
