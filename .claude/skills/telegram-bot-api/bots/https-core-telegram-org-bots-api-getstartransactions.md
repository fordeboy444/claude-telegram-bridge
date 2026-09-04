# [](https://core.telegram.org/bots/api#getstartransactions)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#payments)\/[](https://core.telegram.org/bots/api#getstartransactions)\
- **Summary:** getStarTransactions\ Returns the bot's Telegram Star transactions in chronological order.

# \

getStarTransactions\
\
Returns the bot's Telegram Star transactions in chronological order. On success, returns a [StarTransactions](https://core.telegram.org/bots/api#startransactions)\
 object.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| offset | Integer | Optional | Number of transactions to skip in the response |\
| limit | Integer | Optional | The maximum number of transactions to be retrieved. Values between 1-100 are accepted. Defaults to 100. |\
\
