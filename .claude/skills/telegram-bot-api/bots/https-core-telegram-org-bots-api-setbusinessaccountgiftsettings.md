# [](https://core.telegram.org/bots/api#setbusinessaccountgiftsettings)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setbusinessaccountgiftsettings)\
- **Summary:** setBusinessAccountGiftSettings\ Changes the privacy settings pertaining to incoming gifts in a managed business account.

# \

setBusinessAccountGiftSettings\
\
Changes the privacy settings pertaining to incoming gifts in a managed business account. Requires the _can_change_gift_settings_ business bot right. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Yes | Unique identifier of the business connection |\
| show_gift_button | Boolean | Yes | Pass _True_ if a button for sending a gift to the user or by the business account must always be shown in the input field |\
| accepted_gift_types | [AcceptedGiftTypes](https://core.telegram.org/bots/api#acceptedgifttypes) | Yes | Types of gifts accepted by the business account |\
\
