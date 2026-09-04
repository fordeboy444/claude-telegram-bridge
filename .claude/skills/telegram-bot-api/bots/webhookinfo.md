# webhookinfo

- **URL:** https://core.telegram.org/bots/api/getting-updates/webhookinfo
- **Summary:** Describes the current status of a webhook. | url | String | Webhook URL, may be empty if webhook is not set up | | has_custom_certificate | Boolean | _True_, if a custom certificate was provided for webhook certificate checks | | pending_update_count | Integer | Number of updates awaiting delivery...

# webhookinfo

WebhookInfo

Describes the current status of a webhook.

| Field | Type | Description |
| --- | --- | --- |
| url | String | Webhook URL, may be empty if webhook is not set up |
| has_custom_certificate | Boolean | _True_, if a custom certificate was provided for webhook certificate checks |
| pending_update_count | Integer | Number of updates awaiting delivery |
| ip_address | String | _Optional_. Currently used webhook IP address |
| last_error_date | Integer | _Optional_. Unix time for the most recent error that happened when trying to deliver an update via webhook |
| last_error_message | String | _Optional_. Error message in human-readable format for the most recent error that happened when trying to deliver an update via webhook |
| last_synchronization_error_date | Integer | _Optional_. Unix time of the most recent error that happened when trying to synchronize available updates with Telegram datacenters |
| max_connections | Integer | _Optional_. The maximum allowed number of simultaneous HTTPS connections to the webhook for update delivery |
| allowed_updates | Array of String | _Optional_. A list of update types the bot is subscribed to. Defaults to all update types except _chat_member_, _message_reaction_, and _message_reaction_count_. |
