# externalreplyinfo

- **URL:** https://core.telegram.org/bots/api/available-types/externalreplyinfo
- **Summary:** This object contains information about a message that is being replied to, which may come from another chat or forum topic. | origin | MessageOrigin | Origin of the message replied to by the given message | | chat | Chat | _Optional_.

# externalreplyinfo

ExternalReplyInfo

This object contains information about a message that is being replied to, which may come from another chat or forum topic.

| Field | Type | Description |
| --- | --- | --- |
| origin | [MessageOrigin](https://core.telegram.org/bots/api#messageorigin) | Origin of the message replied to by the given message |
| chat | [Chat](https://core.telegram.org/bots/api#chat) | _Optional_. Chat the original message belongs to. Available only if the chat is a supergroup or a channel. |
| message_id | Integer | _Optional_. Unique message identifier inside the original chat. Available only if the original chat is a supergroup or a channel. |
| link_preview_options | [LinkPreviewOptions](https://core.telegram.org/bots/api#linkpreviewoptions) | _Optional_. Options used for link preview generation for the original message, if it is a text message |
| animation | [Animation](https://core.telegram.org/bots/api#animation) | _Optional_. Message is an animation, information about the animation |
| audio | [Audio](https://core.telegram.org/bots/api#audio) | _Optional_. Message is an audio file, information about the file |
| document | [Document](https://core.telegram.org/bots/api#document) | _Optional_. Message is a general file, information about the file |
| live_photo | [LivePhoto](https://core.telegram.org/bots/api#livephoto) | _Optional_. Message is a live photo, information about the live photo |
| paid_media | [PaidMediaInfo](https://core.telegram.org/bots/api#paidmediainfo) | _Optional_. Message contains paid media; information about the paid media |
| photo | Array of [PhotoSize](https://core.telegram.org/bots/api#photosize) | _Optional_. Message is a photo, available sizes of the photo |
| sticker | [Sticker](https://core.telegram.org/bots/api#sticker) | _Optional_. Message is a sticker, information about the sticker |
| story | [Story](https://core.telegram.org/bots/api#story) | _Optional_. Message is a forwarded story |
| video | [Video](https://core.telegram.org/bots/api#video) | _Optional_. Message is a video, information about the video |
| video_note | [VideoNote](https://core.telegram.org/bots/api#videonote) | _Optional_. Message is a [video note](https://telegram.org/blog/video-messages-and-telescope)<br>, information about the video message |
| voice | [Voice](https://core.telegram.org/bots/api#voice) | _Optional_. Message is a voice message, information about the file |
| has_media_spoiler | True | _Optional_. _True_, if the message media is covered by a spoiler animation |
| checklist | [Checklist](https://core.telegram.org/bots/api#checklist) | _Optional_. Message is a checklist |
| contact | [Contact](https://core.telegram.org/bots/api#contact) | _Optional_. Message is a shared contact, information about the contact |
| dice | [Dice](https://core.telegram.org/bots/api#dice) | _Optional_. Message is a dice with random value |
| game | [Game](https://core.telegram.org/bots/api#game) | _Optional_. Message is a game, information about the game. [More about games »](https://core.telegram.org/bots/api#games) |
| giveaway | [Giveaway](https://core.telegram.org/bots/api#giveaway) | _Optional_. Message is a scheduled giveaway, information about the giveaway |
| giveaway_winners | [GiveawayWinners](https://core.telegram.org/bots/api#giveawaywinners) | _Optional_. A giveaway with public winners was completed |
| invoice | [Invoice](https://core.telegram.org/bots/api#invoice) | _Optional_. Message is an invoice for a [payment](https://core.telegram.org/bots/api#payments)<br>, information about the invoice. [More about payments »](https://core.telegram.org/bots/api#payments) |
| location | [Location](https://core.telegram.org/bots/api#location) | _Optional_. Message is a shared location, information about the location |
| poll | [Poll](https://core.telegram.org/bots/api#poll) | _Optional_. Message is a native poll, information about the poll |
| venue | [Venue](https://core.telegram.org/bots/api#venue) | _Optional_. Message is a venue, information about the venue |
