# [](https://core.telegram.org/bots/api#getchatgifts)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#getchatgifts)\
- **Summary:** Returns the gifts owned by a chat.

# \

getChatGifts\
\
Returns the gifts owned by a chat. Returns [OwnedGifts](https://core.telegram.org/bots/api#ownedgifts)\
 on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target channel in the format `@username` |\
| exclude_unsaved | Boolean | Optional | Pass _True_ to exclude gifts that aren't saved to the chat's profile page. Always _True_, unless the bot has the _can_post_messages_ administrator right in the channel. |\
| exclude_saved | Boolean | Optional | Pass _True_ to exclude gifts that are saved to the chat's profile page. Always _False_, unless the bot has the _can_post_messages_ administrator right in the channel. |\
| exclude_unlimited | Boolean | Optional | Pass _True_ to exclude gifts that can be purchased an unlimited number of times |\
| exclude_limited_upgradable | Boolean | Optional | Pass _True_ to exclude gifts that can be purchased a limited number of times and can be upgraded to unique |\
| exclude_limited_non_upgradable | Boolean | Optional | Pass _True_ to exclude gifts that can be purchased a limited number of times and can't be upgraded to unique |\
| exclude_from_blockchain | Boolean | Optional | Pass _True_ to exclude gifts that were assigned from the TON blockchain and can't be resold or transferred in Telegram |\
| exclude_unique | Boolean | Optional | Pass _True_ to exclude unique gifts |\
| sort_by_price | Boolean | Optional | Pass _True_ to sort results by gift price instead of send date. Sorting is applied before pagination. |\
| offset | String | Optional | Offset of the first entry to return as received from the previous request; use an empty string to get the first chunk of results |\
| limit | Integer | Optional | The maximum number of gifts to be returned; 1-100. Defaults to 100. |\
\
