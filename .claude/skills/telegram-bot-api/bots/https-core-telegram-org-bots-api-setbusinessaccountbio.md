# [](https://core.telegram.org/bots/api#setbusinessaccountbio)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setbusinessaccountbio)\
- **Summary:** setBusinessAccountBio\ Changes the bio of a managed business account.

# \

setBusinessAccountBio\
\
Changes the bio of a managed business account. Requires the _can_change_bio_ business bot right. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Yes | Unique identifier of the business connection |\
| bio | String | Optional | The new value of the bio for the business account; 0-140 characters |\
\
