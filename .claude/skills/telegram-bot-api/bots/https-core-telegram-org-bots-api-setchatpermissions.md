# [](https://core.telegram.org/bots/api#setchatpermissions)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setchatpermissions)\
- **Summary:** Use this method to set default chat permissions for all members.

# \

setChatPermissions\
\
Use this method to set default chat permissions for all members. The bot must be an administrator in the group or a supergroup for this to work and must have the _can_restrict_members_ administrator rights. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
| permissions | [ChatPermissions](https://core.telegram.org/bots/api#chatpermissions) | Yes | A JSON-serialized object for new default chat permissions |\
| use_independent_chat_permissions | Boolean | Optional | Pass _True_ if chat permissions are set independently. Otherwise, the _can_send_other_messages_ and _can_add_web_page_previews_ permissions will imply the _can_send_messages_, _can_send_audios_, _can_send_documents_, _can_send_photos_, _can_send_videos_, _can_send_video_notes_, and _can_send_voice_notes_ permissions; the _can_send_polls_ permission will imply the _can_send_messages_ permission. |\
\
