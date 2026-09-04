# [](https://core.telegram.org/bots/api#shippingquery)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#payments)\/[](https://core.telegram.org/bots/api#shippingquery)\
- **Summary:** This object contains information about an incoming shipping query.\

# \

ShippingQuery\
\
This object contains information about an incoming shipping query.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| id  | String | Unique query identifier |\
| from | [User](https://core.telegram.org/bots/api#user) | User who sent the query |\
| invoice_payload | String | Bot-specified invoice payload |\
| shipping_address | [ShippingAddress](https://core.telegram.org/bots/api#shippingaddress) | User specified shipping address |\
\
