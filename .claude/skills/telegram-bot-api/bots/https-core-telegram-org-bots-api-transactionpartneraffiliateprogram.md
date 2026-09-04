# [](https://core.telegram.org/bots/api#transactionpartneraffiliateprogram)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#payments)\/[](https://core.telegram.org/bots/api#transactionpartneraffiliateprogram)\
- **Summary:** TransactionPartnerAffiliateProgram\ Describes the affiliate program that issued the affiliate commission received via this transaction.\ | type | String | Type of the transaction partner, always “affiliate_program” |\ | sponsor_user | User | _Optional_.

# \

TransactionPartnerAffiliateProgram\
\
Describes the affiliate program that issued the affiliate commission received via this transaction.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the transaction partner, always “affiliate_program” |\
| sponsor_user | [User](https://core.telegram.org/bots/api#user) | _Optional_. Information about the bot that sponsored the affiliate program |\
| commission_per_mille | Integer | The number of Telegram Stars received by the bot for each 1000 Telegram Stars received by the affiliate program sponsor from referred users |\
\
