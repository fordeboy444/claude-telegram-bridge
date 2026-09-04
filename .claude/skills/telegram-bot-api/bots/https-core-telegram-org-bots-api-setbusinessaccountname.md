# [](https://core.telegram.org/bots/api#setbusinessaccountname)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setbusinessaccountname)\
- **Summary:** setBusinessAccountName\ Changes the first and last name of a managed business account.

# \

setBusinessAccountName\
\
Changes the first and last name of a managed business account. Requires the _can_change_name_ business bot right. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Yes | Unique identifier of the business connection |\
| first_name | String | Yes | The new value of the first name for the business account; 1-64 characters |\
| last_name | String | Optional | The new value of the last name for the business account; 0-64 characters |\
\
