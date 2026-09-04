# [](https://core.telegram.org/bots/api#upgradegift)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#upgradegift)\
- **Summary:** Upgrades a given regular gift to a unique gift.

# \

upgradeGift\
\
Upgrades a given regular gift to a unique gift. Requires the _can_transfer_and_upgrade_gifts_ business bot right. Additionally requires the _can_transfer_stars_ business bot right if the upgrade is paid. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Yes | Unique identifier of the business connection |\
| owned_gift_id | String | Yes | Unique identifier of the regular gift that should be upgraded to a unique one |\
| keep_original_details | Boolean | Optional | Pass _True_ to keep the original gift text, sender and receiver in the upgraded gift |\
| star_count | Integer | Optional | The amount of Telegram Stars that will be paid for the upgrade from the business account balance. If `gift.prepaid_upgrade_star_count > 0`, then pass 0, otherwise, the _can_transfer_stars_ business bot right is required and `gift.upgrade_star_count` must be passed. |\
\
