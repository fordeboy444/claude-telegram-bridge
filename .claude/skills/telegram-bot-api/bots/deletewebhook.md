# deletewebhook

- **URL:** https://core.telegram.org/bots/api/getting-updates/deletewebhook
- **Summary:** Use this method to remove webhook integration if you decide to switch back to getUpdates .

# deletewebhook

deleteWebhook

Use this method to remove webhook integration if you decide to switch back to [getUpdates](https://core.telegram.org/bots/api#getupdates)
. Returns _True_ on success.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| drop_pending_updates | Boolean | Optional | Pass _True_ to drop all pending updates |
