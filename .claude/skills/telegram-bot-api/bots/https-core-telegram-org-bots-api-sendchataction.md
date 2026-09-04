# [](https://core.telegram.org/bots/api#sendchataction)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#sendchataction)\
- **Summary:** Use this method when you need to tell the user that something is happening on the bot's side.

# \

sendChatAction\
\
Use this method when you need to tell the user that something is happening on the bot's side. The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status). Returns _True_ on success.\
\
> Example: The [ImageBot](https://t.me/imagebot)\
>  needs some time to process a request and upload the image. Instead of sending a text message along the lines of “Retrieving image, please wait…”, the bot may use [sendChatAction](https://core.telegram.org/bots/api#sendchataction)\
>  with _action_ = _upload_photo_. The user will see a “sending photo” status for the bot.\
\
We only recommend using this method when a response from the bot will take a **noticeable** amount of time to arrive.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Optional | Unique identifier of the business connection on behalf of which the action will be sent |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target bot or supergroup in the format `@username`. Channel chats and channel direct messages chats aren't supported. |\
| message_thread_id | Integer | Optional | Unique identifier for the target message thread or topic of a forum; for supergroups and private chats of bots with forum topic mode enabled only |\
| action | String | Yes | Type of action to broadcast. Choose one, depending on what the user is about to receive: _typing_ for [text messages](https://core.telegram.org/bots/api#sendmessage)<br>, _upload_photo_ for [photos](https://core.telegram.org/bots/api#sendphoto)<br>, _record_video_ or _upload_video_ for [videos](https://core.telegram.org/bots/api#sendvideo)<br>, _record_voice_ or _upload_voice_ for [voice notes](https://core.telegram.org/bots/api#sendvoice)<br>, _upload_document_ for [general files](https://core.telegram.org/bots/api#senddocument)<br>, _choose_sticker_ for [stickers](https://core.telegram.org/bots/api#sendsticker)<br>, _find_location_ for [location data](https://core.telegram.org/bots/api#sendlocation)<br>, _record_video_note_ or _upload_video_note_ for [video notes](https://core.telegram.org/bots/api#sendvideonote)<br>. |\
\
