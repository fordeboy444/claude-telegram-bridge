# getwebhookinfo

- **URL:** https://core.telegram.org/bots/api/getting-updates/getwebhookinfo
- **Summary:** Use this method to get current webhook status.

# getwebhookinfo

getWebhookInfo

Use this method to get current webhook status. Requires no parameters. On success, returns a [WebhookInfo](https://core.telegram.org/bots/api#webhookinfo)
 object. If the bot is using [getUpdates](https://core.telegram.org/bots/api#getupdates)
, will return an object with the _url_ field empty.
