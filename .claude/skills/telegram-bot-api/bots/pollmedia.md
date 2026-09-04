# pollmedia

- **URL:** https://core.telegram.org/bots/api/available-types/pollmedia
- **Summary:** At most **one** of the optional fields can be present in any given object. | animation | Animation | _Optional_.

# pollmedia

PollMedia

At most **one** of the optional fields can be present in any given object.

| Field | Type | Description |
| --- | --- | --- |
| animation | [Animation](https://core.telegram.org/bots/api#animation) | _Optional_. Media is an animation, information about the animation |
| audio | [Audio](https://core.telegram.org/bots/api#audio) | _Optional_. Media is an audio file, information about the file; currently, can't be received in a poll option |
| document | [Document](https://core.telegram.org/bots/api#document) | _Optional_. Media is a general file, information about the file; currently, can't be received in a poll option |
| link | [Link](https://core.telegram.org/bots/api#link) | _Optional_. The HTTP link attached to the poll option |
| live_photo | [LivePhoto](https://core.telegram.org/bots/api#livephoto) | _Optional_. Media is a live photo, information about the live photo |
| location | [Location](https://core.telegram.org/bots/api#location) | _Optional_. Media is a shared location, information about the location |
| photo | Array of [PhotoSize](https://core.telegram.org/bots/api#photosize) | _Optional_. Media is a photo, available sizes of the photo |
| sticker | [Sticker](https://core.telegram.org/bots/api#sticker) | _Optional_. Media is a sticker, information about the sticker; currently, for poll options only |
| venue | [Venue](https://core.telegram.org/bots/api#venue) | _Optional_. Media is a venue, information about the venue |
| video | [Video](https://core.telegram.org/bots/api#video) | _Optional_. Media is a video, information about the video |
