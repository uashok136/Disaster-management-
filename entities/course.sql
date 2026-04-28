{
  "name": "Course",
  "type": "object",
  "properties": {
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "category": {
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
    "level": {
      "type": "string",
      "enum": [
        "beginner",
        "intermediate",
        "advanced"
      ]
    },
    "duration_minutes": {
      "type": "number"
    },
    "content": {
      "type": "string"
    },
    "thumbnail_url": {
      "type": "string"
    },
    "is_published": {
      "type": "boolean",
      "default": false
    },
    "target_audience": {
      "type": "string",
      "enum": [
        "students",
        "teachers",
        "all"
      ]
    }
  },
  "required": [
    "title",
    "category",
    "level"
  ]
}