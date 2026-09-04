# chatpermissions

- **URL:** https://core.telegram.org/bots/api/available-types/chatpermissions
- **Summary:** Describes actions that a non-administrator user is allowed to take in a chat. | can_send_messages | Boolean | _Optional_. _True_, if the user is allowed to send text messages, rich messages, contacts, giveaways, giveaway winners, invoices, locations and venues | | can_send_audios | Boolean |...

# chatpermissions

ChatPermissions

Describes actions that a non-administrator user is allowed to take in a chat.

| Field | Type | Description |
| --- | --- | --- |
| can_send_messages | Boolean | _Optional_. _True_, if the user is allowed to send text messages, rich messages, contacts, giveaways, giveaway winners, invoices, locations and venues |
| can_send_audios | Boolean | _Optional_. _True_, if the user is allowed to send audios |
| can_send_documents | Boolean | _Optional_. _True_, if the user is allowed to send documents |
| can_send_photos | Boolean | _Optional_. _True_, if the user is allowed to send photos |
| can_send_videos | Boolean | _Optional_. _True_, if the user is allowed to send videos |
| can_send_video_notes | Boolean | _Optional_. _True_, if the user is allowed to send video notes |
| can_send_voice_notes | Boolean | _Optional_. _True_, if the user is allowed to send voice notes |
| can_send_polls | Boolean | _Optional_. _True_, if the user is allowed to send polls and checklists |
| can_send_other_messages | Boolean | _Optional_. _True_, if the user is allowed to send animations, games, stickers and use inline bots |
| can_add_web_page_previews | Boolean | _Optional_. _True_, if the user is allowed to add web page previews to their messages |
| can_react_to_messages | Boolean | _Optional_. _True_, if the user is allowed to react to messages. If omitted, defaults to the value of _can_send_messages_. |
| can_edit_tag | Boolean | _Optional_. _True_, if the user is allowed to edit their own tag. If omitted, defaults to the value of _can_pin_messages_. |
| can_change_info | Boolean | _Optional_. _True_, if the user is allowed to change the chat title, photo and other settings. Ignored in public supergroups. |
| can_invite_users | Boolean | _Optional_. _True_, if the user is allowed to invite new users to the chat |
| can_pin_messages | Boolean | _Optional_. _True_, if the user is allowed to pin messages. Ignored in public supergroups. |
| can_manage_topics | Boolean | _Optional_. _True_, if the user is allowed to create forum topics. If omitted, defaults to the value of can_pin_messages. |
