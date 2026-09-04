# [](https://core.telegram.org/bots/api#setuseremojistatus)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setuseremojistatus)\
- **Summary:** Changes the emoji status for a given user that previously allowed the bot to manage their emoji status via the Mini App method requestEmojiStatusAccess\ .

# \

setUserEmojiStatus\
\
Changes the emoji status for a given user that previously allowed the bot to manage their emoji status via the Mini App method [requestEmojiStatusAccess](https://core.telegram.org/bots/webapps#initializing-mini-apps)\
. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| user_id | Integer | Yes | Unique identifier of the target user |\
| emoji_status_custom_emoji_id | String | Optional | Custom emoji identifier of the emoji status to set. Pass an empty string to remove the status. |\
| emoji_status_expiration_date | Integer | Optional | Expiration date of the emoji status, if any |\
\
