# [](https://core.telegram.org/bots/api#transferbusinessaccountstars)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#transferbusinessaccountstars)\
- **Summary:** transferBusinessAccountStars\ Transfers Telegram Stars from the business account balance to the bot's balance.

# \

transferBusinessAccountStars\
\
Transfers Telegram Stars from the business account balance to the bot's balance. Requires the _can_transfer_stars_ business bot right. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Yes | Unique identifier of the business connection |\
| star_count | Integer | Yes | Number of Telegram Stars to transfer; 1-10000 |\
\
