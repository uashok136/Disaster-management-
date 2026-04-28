{
  "name": "CourseEnrollment",
  "type": "object",
  "properties": {
    "course_id": {
      "type": "string"
    },
    "user_email": {
      "type": "string"
    },
    "progress_percent": {
      "type": "number",
      "default": 0
    },
    "completed": {
      "type": "boolean",
      "default": false
    },
    "completed_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "course_id",
    "user_email"
  ]
}