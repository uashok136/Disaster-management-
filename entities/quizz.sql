{
  "name": "Quiz",
  "type": "object",
  "properties": {
    "title": {
      "type": "string"
    },
    "course_id": {
      "type": "string"
    },
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question": {
            "type": "string"
          },
          "options": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "correct_answer": {
            "type": "number"
          },
          "explanation": {
            "type": "string"
          }
        }
      }
    },
    "passing_score": {
      "type": "number",
      "default": 70
    },
    "time_limit_minutes": {
      "type": "number"
    }
  },
  "required": [
    "title",
    "course_id"
  ]
}