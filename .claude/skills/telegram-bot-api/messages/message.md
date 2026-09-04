# message

- **URL:** https://core.telegram.org/bots/api/available-types/message
- **Summary:** This object represents a message. | message_id | Integer | Unique message identifier inside this chat; 0 for ephemeral messages.

# message

Message

This object represents a message.

| Field | Type | Description |
| --- | --- | --- |
| message_id | Integer | Unique message identifier inside this chat; 0 for ephemeral messages. In specific instances (e.g., a message containing a video sent to a big chat), the server might automatically schedule a message instead of sending it immediately. In such cases, this field will be 0 and the relevant message will be unusable until it is actually sent. |
| message_thread_id | Integer | _Optional_. Unique identifier of a message thread or forum topic to which the message belongs; for supergroups and private chats only |
| direct_messages_topic | [DirectMessagesTopic](https://core.telegram.org/bots/api#directmessagestopic) | _Optional_. Information about the direct messages chat topic that contains the message |
| from | [User](https://core.telegram.org/bots/api#user) | _Optional_. Sender of the message; may be empty for messages sent to channels. For backward compatibility, if the message was sent on behalf of a chat, the field contains a fake sender user in non-channel chats. |
| sender_chat | [Chat](https://core.telegram.org/bots/api#chat) | _Optional_. Sender of the message when sent on behalf of a chat. For example, the supergroup itself for messages sent by its anonymous administrators or a linked channel for messages automatically forwarded to the channel's discussion group. For backward compatibility, if the message was sent on behalf of a chat, the field _from_ contains a fake sender user in non-channel chats. |
| sender_boost_count | Integer | _Optional_. If the sender of the message boosted the chat, the number of boosts added by the user |
| sender_business_bot | [User](https://core.telegram.org/bots/api#user) | _Optional_. The bot that actually sent the message on behalf of the business account. Available only for outgoing messages sent on behalf of the connected business account. |
| sender_tag | String | _Optional_. Tag or custom title of the sender of the message; for supergroups only |
| receiver_user | [User](https://core.telegram.org/bots/api#user) | _Optional_. For ephemeral messages, the user who received the message |
| ephemeral_message_id | Integer | _Optional_. For ephemeral messages, identifier of the ephemeral message inside this chat. The identifier may be reused for another ephemeral message after the message is deleted or expires. |
| date | Integer | Date the message was sent in Unix time. It is always a positive number, representing a valid date. |
| guest_query_id | String | _Optional_. The unique identifier for the guest query. Use this identifier with the method [answerGuestQuery](https://core.telegram.org/bots/api#answerguestquery)<br> to send a response message. If non-empty, the message belongs to the chat where the guest bot was summoned, which may not coincide with other existing bot chats sharing the same identifier. |
| business_connection_id | String | _Optional_. Unique identifier of the business connection from which the message was received. If non-empty, the message belongs to a chat of the corresponding business account that is independent from any potential bot chat which might share the same identifier. |
| chat | [Chat](https://core.telegram.org/bots/api#chat) | Chat the message belongs to |
| forward_origin | [MessageOrigin](https://core.telegram.org/bots/api#messageorigin) | _Optional_. Information about the original message for forwarded messages |
| is_topic_message | True | _Optional_. _True_, if the message is sent to a topic in a forum supergroup or a private chat with the bot |
| is_automatic_forward | True | _Optional_. _True_, if the message is a channel post that was automatically forwarded to the connected discussion group |
| reply_to_message | [Message](https://core.telegram.org/bots/api#message) | _Optional_. For replies in the same chat and message thread, the original message. Note that the [Message](https://core.telegram.org/bots/api#message)<br> object in this field will not contain further _reply_to_message_ fields even if it itself is a reply. If the message is a reply to an ephemeral message, then this field may be omitted. |
| external_reply | [ExternalReplyInfo](https://core.telegram.org/bots/api#externalreplyinfo) | _Optional_. Information about the message that is being replied to, which may come from another chat or forum topic |
| quote | [TextQuote](https://core.telegram.org/bots/api#textquote) | _Optional_. For replies that quote part of the original message, the quoted part of the message |
| reply_to_story | [Story](https://core.telegram.org/bots/api#story) | _Optional_. For replies to a story, the original story |
| reply_to_checklist_task_id | Integer | _Optional_. Identifier of the specific checklist task that is being replied to |
| reply_to_poll_option_id | String | _Optional_. Persistent identifier of the specific poll option that is being replied to |
| via_bot | [User](https://core.telegram.org/bots/api#user) | _Optional_. Bot through which the message was sent |
| guest_bot_caller_user | [User](https://core.telegram.org/bots/api#user) | _Optional_. For a message sent by a guest bot, this is the user whose original message triggered the bot's response |
| guest_bot_caller_chat | [Chat](https://core.telegram.org/bots/api#chat) | _Optional_. For a message sent by a guest bot, this is the chat whose original message triggered the bot's response |
| edit_date | Integer | _Optional_. Date the message was last edited in Unix time |
| has_protected_content | True | _Optional_. _True_, if the message can't be forwarded |
| is_from_offline | True | _Optional_. _True_, if the message was sent by an implicit action, for example, as an away or a greeting business message, or as a scheduled message |
| is_paid_post | True | _Optional_. _True_, if the message is a paid post. Note that such posts must not be deleted for 24 hours to receive the payment and can't be edited. |
| media_group_id | String | _Optional_. The unique identifier inside this chat of a media message group this message belongs to |
| author_signature | String | _Optional_. Signature of the post author for messages in channels, or the custom title of an anonymous group administrator |
| paid_star_count | Integer | _Optional_. The number of Telegram Stars that were paid by the sender of the message to send it |
| text | String | _Optional_. For text messages, the actual UTF-8 text of the message |
| entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. For text messages, special entities like usernames, URLs, bot commands, etc. that appear in the text |
| link_preview_options | [LinkPreviewOptions](https://core.telegram.org/bots/api#linkpreviewoptions) | _Optional_. Options used for link preview generation for the message, if it is a text message and link preview options were changed |
| suggested_post_info | [SuggestedPostInfo](https://core.telegram.org/bots/api#suggestedpostinfo) | _Optional_. Information about suggested post parameters if the message is a suggested post in a channel direct messages chat. If the message is an approved or declined suggested post, then it can't be edited. |
| effect_id | String | _Optional_. Unique identifier of the message effect added to the message |
| rich_message | [RichMessage](https://core.telegram.org/bots/api#richmessage) | _Optional_. Message is a rich formatted message |
| animation | [Animation](https://core.telegram.org/bots/api#animation) | _Optional_. Message is an animation, information about the animation. For backward compatibility, when this field is set, the _document_ field will also be set. |
| audio | [Audio](https://core.telegram.org/bots/api#audio) | _Optional_. Message is an audio file, information about the file |
| document | [Document](https://core.telegram.org/bots/api#document) | _Optional_. Message is a general file, information about the file |
| live_photo | [LivePhoto](https://core.telegram.org/bots/api#livephoto) | _Optional_. Message is a live photo, information about the live photo. For backward compatibility, when this field is set, the _photo_ field will also be set. |
| paid_media | [PaidMediaInfo](https://core.telegram.org/bots/api#paidmediainfo) | _Optional_. Message contains paid media; information about the paid media |
| photo | Array of [PhotoSize](https://core.telegram.org/bots/api#photosize) | _Optional_. Message is a photo, available sizes of the photo |
| sticker | [Sticker](https://core.telegram.org/bots/api#sticker) | _Optional_. Message is a sticker, information about the sticker |
| story | [Story](https://core.telegram.org/bots/api#story) | _Optional_. Message is a forwarded story |
| video | [Video](https://core.telegram.org/bots/api#video) | _Optional_. Message is a video, information about the video |
| video_note | [VideoNote](https://core.telegram.org/bots/api#videonote) | _Optional_. Message is a [video note](https://telegram.org/blog/video-messages-and-telescope)<br>, information about the video message |
| voice | [Voice](https://core.telegram.org/bots/api#voice) | _Optional_. Message is a voice message, information about the file |
| caption | String | _Optional_. Caption for the animation, audio, document, paid media, photo, video or voice |
| caption_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. For messages with a caption, special entities like usernames, URLs, bot commands, etc. that appear in the caption |
| show_caption_above_media | True | _Optional_. _True_, if the caption must be shown above the message media |
| has_media_spoiler | True | _Optional_. _True_, if the message media is covered by a spoiler animation |
| checklist | [Checklist](https://core.telegram.org/bots/api#checklist) | _Optional_. Message is a checklist |
| contact | [Contact](https://core.telegram.org/bots/api#contact) | _Optional_. Message is a shared contact, information about the contact |
| dice | [Dice](https://core.telegram.org/bots/api#dice) | _Optional_. Message is a dice with random value |
| game | [Game](https://core.telegram.org/bots/api#game) | _Optional_. Message is a game, information about the game. [More about games »](https://core.telegram.org/bots/api#games) |
| poll | [Poll](https://core.telegram.org/bots/api#poll) | _Optional_. Message is a native poll, information about the poll |
| venue | [Venue](https://core.telegram.org/bots/api#venue) | _Optional_. Message is a venue, information about the venue. For backward compatibility, when this field is set, the _location_ field will also be set. |
| location | [Location](https://core.telegram.org/bots/api#location) | _Optional_. Message is a shared location, information about the location |
| new_chat_members | Array of [User](https://core.telegram.org/bots/api#user) | _Optional_. New members that were added to the group or supergroup and information about them (the bot itself may be one of these members) |
| left_chat_member | [User](https://core.telegram.org/bots/api#user) | _Optional_. A member was removed from the group, information about them (this member may be the bot itself) |
| chat_owner_left | [ChatOwnerLeft](https://core.telegram.org/bots/api#chatownerleft) | _Optional_. Service message: chat owner has left |
| chat_owner_changed | [ChatOwnerChanged](https://core.telegram.org/bots/api#chatownerchanged) | _Optional_. Service message: chat owner has changed |
| new_chat_title | String | _Optional_. A chat title was changed to this value |
| new_chat_photo | Array of [PhotoSize](https://core.telegram.org/bots/api#photosize) | _Optional_. A chat photo was change to this value |
| delete_chat_photo | True | _Optional_. Service message: the chat photo was deleted |
| group_chat_created | True | _Optional_. Service message: the group has been created |
| supergroup_chat_created | True | _Optional_. Service message: the supergroup has been created. This field can't be received in a message coming through updates, because bot can't be a member of a supergroup when it is created. It can only be found in reply_to_message if someone replies to a very first message in a directly created supergroup. |
| channel_chat_created | True | _Optional_. Service message: the channel has been created. This field can't be received in a message coming through updates, because bot can't be a member of a channel when it is created. It can only be found in reply_to_message if someone replies to a very first message in a channel. |
| message_auto_delete_timer_changed | [MessageAutoDeleteTimerChanged](https://core.telegram.org/bots/api#messageautodeletetimerchanged) | _Optional_. Service message: auto-delete timer settings changed in the chat |
| migrate_to_chat_id | Integer | _Optional_. The group has been migrated to a supergroup with the specified identifier. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this identifier. |
| migrate_from_chat_id | Integer | _Optional_. The supergroup has been migrated from a group with the specified identifier. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this identifier. |
| pinned_message | [MaybeInaccessibleMessage](https://core.telegram.org/bots/api#maybeinaccessiblemessage) | _Optional_. Specified message was pinned. Note that the [Message](https://core.telegram.org/bots/api#message)<br> object in this field will not contain further _reply_to_message_ fields even if it itself is a reply. |
| invoice | [Invoice](https://core.telegram.org/bots/api#invoice) | _Optional_. Message is an invoice for a [payment](https://core.telegram.org/bots/api#payments)<br>, information about the invoice. [More about payments »](https://core.telegram.org/bots/api#payments) |
| successful_payment | [SuccessfulPayment](https://core.telegram.org/bots/api#successfulpayment) | _Optional_. Message is a service message about a successful payment, information about the payment. [More about payments »](https://core.telegram.org/bots/api#payments) |
| refunded_payment | [RefundedPayment](https://core.telegram.org/bots/api#refundedpayment) | _Optional_. Message is a service message about a refunded payment, information about the payment. [More about payments »](https://core.telegram.org/bots/api#payments) |
| users_shared | [UsersShared](https://core.telegram.org/bots/api#usersshared) | _Optional_. Service message: users were shared with the bot |
| chat_shared | [ChatShared](https://core.telegram.org/bots/api#chatshared) | _Optional_. Service message: a chat was shared with the bot |
| gift | [GiftInfo](https://core.telegram.org/bots/api#giftinfo) | _Optional_. Service message: a regular gift was sent or received |
| unique_gift | [UniqueGiftInfo](https://core.telegram.org/bots/api#uniquegiftinfo) | _Optional_. Service message: a unique gift was sent or received |
| gift_upgrade_sent | [GiftInfo](https://core.telegram.org/bots/api#giftinfo) | _Optional_. Service message: upgrade of a gift was purchased after the gift was sent |
| connected_website | String | _Optional_. The domain name of the website on which the user has logged in. [More about Telegram Login »](https://core.telegram.org/widgets/login) |
| write_access_allowed | [WriteAccessAllowed](https://core.telegram.org/bots/api#writeaccessallowed) | _Optional_. Service message: the user allowed the bot to write messages after adding it to the attachment or side menu, launching a Web App from a link, or accepting an explicit request from a Web App sent by the method [requestWriteAccess](https://core.telegram.org/bots/webapps#initializing-mini-apps) |
| passport_data | [PassportData](https://core.telegram.org/bots/api#passportdata) | _Optional_. Telegram Passport data |
| proximity_alert_triggered | [ProximityAlertTriggered](https://core.telegram.org/bots/api#proximityalerttriggered) | _Optional_. Service message: a user in the chat triggered another user's proximity alert while sharing Live Location |
| boost_added | [ChatBoostAdded](https://core.telegram.org/bots/api#chatboostadded) | _Optional_. Service message: user boosted the chat |
| chat_background_set | [ChatBackground](https://core.telegram.org/bots/api#chatbackground) | _Optional_. Service message: chat background set |
| checklist_tasks_done | [ChecklistTasksDone](https://core.telegram.org/bots/api#checklisttasksdone) | _Optional_. Service message: some tasks in a checklist were marked as done or not done |
| checklist_tasks_added | [ChecklistTasksAdded](https://core.telegram.org/bots/api#checklisttasksadded) | _Optional_. Service message: tasks were added to a checklist |
| community_chat_added | [CommunityChatAdded](https://core.telegram.org/bots/api#communitychatadded) | _Optional_. Service message: chat or bot added to a [Community](https://core.telegram.org/bots/api#community) |
| community_chat_joined | [CommunityChatJoined](https://core.telegram.org/bots/api#communitychatjoined) | _Optional_. Service message: chat was joined by a user from a [Community](https://core.telegram.org/bots/api#community) |
| community_chat_removed | [CommunityChatRemoved](https://core.telegram.org/bots/api#communitychatremoved) | _Optional_. Service message: chat or bot removed from a [Community](https://core.telegram.org/bots/api#community) |
| direct_message_price_changed | [DirectMessagePriceChanged](https://core.telegram.org/bots/api#directmessagepricechanged) | _Optional_. Service message: the price for paid messages in the corresponding direct messages chat of a channel has changed |
| forum_topic_created | [ForumTopicCreated](https://core.telegram.org/bots/api#forumtopiccreated) | _Optional_. Service message: forum topic created |
| forum_topic_edited | [ForumTopicEdited](https://core.telegram.org/bots/api#forumtopicedited) | _Optional_. Service message: forum topic edited |
| forum_topic_closed | [ForumTopicClosed](https://core.telegram.org/bots/api#forumtopicclosed) | _Optional_. Service message: forum topic closed |
| forum_topic_reopened | [ForumTopicReopened](https://core.telegram.org/bots/api#forumtopicreopened) | _Optional_. Service message: forum topic reopened |
| general_forum_topic_hidden | [GeneralForumTopicHidden](https://core.telegram.org/bots/api#generalforumtopichidden) | _Optional_. Service message: the 'General' forum topic hidden |
| general_forum_topic_unhidden | [GeneralForumTopicUnhidden](https://core.telegram.org/bots/api#generalforumtopicunhidden) | _Optional_. Service message: the 'General' forum topic unhidden |
| giveaway_created | [GiveawayCreated](https://core.telegram.org/bots/api#giveawaycreated) | _Optional_. Service message: a scheduled giveaway was created |
| giveaway | [Giveaway](https://core.telegram.org/bots/api#giveaway) | _Optional_. The message is a scheduled giveaway message |
| giveaway_winners | [GiveawayWinners](https://core.telegram.org/bots/api#giveawaywinners) | _Optional_. A giveaway with public winners was completed |
| giveaway_completed | [GiveawayCompleted](https://core.telegram.org/bots/api#giveawaycompleted) | _Optional_. Service message: a giveaway without public winners was completed |
| managed_bot_created | [ManagedBotCreated](https://core.telegram.org/bots/api#managedbotcreated) | _Optional_. Service message: user created a bot that will be managed by the current bot |
| paid_message_price_changed | [PaidMessagePriceChanged](https://core.telegram.org/bots/api#paidmessagepricechanged) | _Optional_. Service message: the price for paid messages has changed in the chat |
| poll_option_added | [PollOptionAdded](https://core.telegram.org/bots/api#polloptionadded) | _Optional_. Service message: answer option was added to a poll |
| poll_option_deleted | [PollOptionDeleted](https://core.telegram.org/bots/api#polloptiondeleted) | _Optional_. Service message: answer option was deleted from a poll |
| suggested_post_approved | [SuggestedPostApproved](https://core.telegram.org/bots/api#suggestedpostapproved) | _Optional_. Service message: a suggested post was approved |
| suggested_post_approval_failed | [SuggestedPostApprovalFailed](https://core.telegram.org/bots/api#suggestedpostapprovalfailed) | _Optional_. Service message: approval of a suggested post has failed |
| suggested_post_declined | [SuggestedPostDeclined](https://core.telegram.org/bots/api#suggestedpostdeclined) | _Optional_. Service message: a suggested post was declined |
| suggested_post_paid | [SuggestedPostPaid](https://core.telegram.org/bots/api#suggestedpostpaid) | _Optional_. Service message: payment for a suggested post was received |
| suggested_post_refunded | [SuggestedPostRefunded](https://core.telegram.org/bots/api#suggestedpostrefunded) | _Optional_. Service message: payment for a suggested post was refunded |
| video_chat_scheduled | [VideoChatScheduled](https://core.telegram.org/bots/api#videochatscheduled) | _Optional_. Service message: video chat scheduled |
| video_chat_started | [VideoChatStarted](https://core.telegram.org/bots/api#videochatstarted) | _Optional_. Service message: video chat started |
| video_chat_ended | [VideoChatEnded](https://core.telegram.org/bots/api#videochatended) | _Optional_. Service message: video chat ended |
| video_chat_participants_invited | [VideoChatParticipantsInvited](https://core.telegram.org/bots/api#videochatparticipantsinvited) | _Optional_. Service message: new participants invited to a video chat |
| web_app_data | [WebAppData](https://core.telegram.org/bots/api#webappdata) | _Optional_. Service message: data sent by a Web App |
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | _Optional_. [Inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)<br> attached to the message. `login_url` buttons are represented as ordinary `url` buttons. |
