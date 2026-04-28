{
  "name": "Incident",
  "type": "object",
  "properties": {
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "incident_type": {
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
    "location": {
      "type": "string"
    },
    "institution": {
      "type": "string"
    },
    "severity": {
      "type": "string",
      "enum": [
        "low",
        "medium",
        "high",
        "critical"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "reported",
        "under_review",
        "responding",
        "resolved"
      ],
      "default": "reported"
    },
    "reported_by": {
      "type": "string"
    },
    "casualties": {
      "type": "number",
      "default": 0
    },
    "response_notes": {
      "type": "string"
    },
    "resolved_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "title",
    "incident_type",
    "location",
    "severity"
  ]
}