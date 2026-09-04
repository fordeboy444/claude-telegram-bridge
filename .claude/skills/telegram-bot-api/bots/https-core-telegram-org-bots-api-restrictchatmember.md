# [](https://core.telegram.org/bots/api#restrictchatmember)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#restrictchatmember)\
- **Summary:** Use this method to restrict a user in a supergroup.

# \

restrictChatMember\
\
Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate administrator rights. Pass _True_ for all permissions to lift restrictions from a user. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
| user_id | Integer | Yes | Unique identifier of the target user |\
| permissions | [ChatPermissions](https://core.telegram.org/bots/api#chatpermissions) | Yes | A JSON-serialized object for new user permissions |\
| use_independent_chat_permissions | Boolean | Optional | Pass _True_ if chat permissions are set independently. Otherwise, the _can_send_other_messages_ and _can_add_web_page_previews_ permissions will imply the _can_send_messages_, _can_send_audios_, _can_send_documents_, _can_send_photos_, _can_send_videos_, _can_send_video_notes_, and _can_send_voice_notes_ permissions; the _can_send_polls_ permission will imply the _can_send_messages_ permission. |\
| until_date | Integer | Optional | Date when restrictions will be lifted for the user; Unix time. If user is restricted for more than 366 days or less than 30 seconds from the current time, they are considered to be restricted forever. |\
\
