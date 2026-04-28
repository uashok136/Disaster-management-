{
  "name": "QuizAttempt",
  "type": "object",
  "properties": {
    "quiz_id": {
      "type": "string"
    },
    "user_email": {
      "type": "string"
    },
    "score": {
      "type": "number"
    },
    "passed": {
      "type": "boolean"
    },
    "answers": {
      "type": "array",
      "items": {
        "type": "number"
      }
    },
    "completed_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "quiz_id",
    "user_email"
  ]
}