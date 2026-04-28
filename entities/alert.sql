{
  "name": "Alert",
  "type": "object",
  "properties": {
    "title": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "severity": {
      "type": "string",
      "enum": [
        "info",
        "warning",
        "critical"
      ]
    },
    "disaster_type": {
      "type": "string",
      "enum": [
        "earthquake",
        "flood",
        "fire",
        "cyclone",
        "chemical",
        "biological",
        "general"
      ]
    },
    "target_institution": {
      "type": "string"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    },
    "expires_at": {
      "type": "string",
      "format": "date-time"
    },
    "sent_by": {
      "type": "string"
    }
  },
  "required": [
    "title",
    "message",
    "severity",
    "disaster_type"
  ]
}