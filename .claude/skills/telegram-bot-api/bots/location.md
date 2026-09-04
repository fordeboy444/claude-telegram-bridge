# location

- **URL:** https://core.telegram.org/bots/api/available-types/location
- **Summary:** This object represents a point on the map. | latitude | Float | Latitude as defined by the sender | | longitude | Float | Longitude as defined by the sender | | horizontal_accuracy | Float | _Optional_.

# location

Location

This object represents a point on the map.

| Field | Type | Description |
| --- | --- | --- |
| latitude | Float | Latitude as defined by the sender |
| longitude | Float | Longitude as defined by the sender |
| horizontal_accuracy | Float | _Optional_. The radius of uncertainty for the location, measured in meters; 0-1500 |
| live_period | Integer | _Optional_. Time relative to the message sending date, during which the location can be updated; in seconds. For active live locations only. |
| heading | Integer | _Optional_. The direction in which user is moving, in degrees; 1-360. For active live locations only. |
| proximity_alert_radius | Integer | _Optional_. The maximum distance for proximity alerts about approaching another chat member, in meters. For sent live locations only. |
