# [](https://core.telegram.org/bots/api#startransaction)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#payments)\/[](https://core.telegram.org/bots/api#startransaction)\
- **Summary:** Describes a Telegram Star transaction.

# \

StarTransaction\
\
Describes a Telegram Star transaction. Note that if the buyer initiates a chargeback with the payment provider from whom they acquired Stars (e.g., Apple, Google) following this transaction, the refunded Stars will be deducted from the bot's balance. This is outside of Telegram's control.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| id  | String | Unique identifier of the transaction. Coincides with the identifier of the original transaction for refund transactions. Coincides with _SuccessfulPayment.telegram_payment_charge_id_ for successful incoming payments from users. |\
| amount | Integer | Integer amount of Telegram Stars transferred by the transaction |\
| nanostar_amount | Integer | _Optional_. The number of 1/1000000000 shares of Telegram Stars transferred by the transaction; from 0 to 999999999 |\
| date | Integer | Date the transaction was created in Unix time |\
| source | [TransactionPartner](https://core.telegram.org/bots/api#transactionpartner) | _Optional_. Source of an incoming transaction (e.g., a user purchasing goods or services, Fragment refunding a failed withdrawal). Only for incoming transactions. |\
| receiver | [TransactionPartner](https://core.telegram.org/bots/api#transactionpartner) | _Optional_. Receiver of an outgoing transaction (e.g., a user for a purchase refund, Fragment for a withdrawal). Only for outgoing transactions. |\
\
