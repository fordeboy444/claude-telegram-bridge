# [](https://core.telegram.org/bots/api#setbusinessaccountusername)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setbusinessaccountusername)\
- **Summary:** setBusinessAccountUsername\ Changes the username of a managed business account.

# \

setBusinessAccountUsername\
\
Changes the username of a managed business account. Requires the _can_change_username_ business bot right. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Yes | Unique identifier of the business connection |\
| username | String | Optional | The new value of the username for the business account; 0-32 characters |\
\
