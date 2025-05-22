# Backend API Documentation

This is the backend API for the To-Do application, built with FastAPI and MongoDB. The API provides endpoints for task management, user authentication, and AI-powered features using Google's Gemini API.

## Features

- User authentication with JWT
- Task management (CRUD operations)
- Project management
- AI-powered task suggestions and mentoring
- Timetable generation
- MongoDB integration

## Prerequisites

- Python 3.8 or higher
- MongoDB
- Google Cloud account with Gemini API access

## Setup

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with the following variables:
```env
# Google API Configuration
GOOGLE_API_KEY=your_google_api_key_here

# JWT Configuration
SECRET_KEY=your_secret_key_here

# Database Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=todo_app
```

5. Start the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user information

### Task Endpoints

- `GET /api/tasks/` - Get all tasks
- `POST /api/tasks/` - Create a new task
- `GET /api/tasks/{task_id}` - Get a specific task
- `PUT /api/tasks/{task_id}` - Update a task
- `DELETE /api/tasks/{task_id}` - Delete a task

### Project Endpoints

- `GET /api/projects/` - Get all projects
- `POST /api/projects/` - Create a new project
- `GET /api/projects/{project_id}` - Get a specific project
- `PUT /api/projects/{project_id}` - Update a project
- `DELETE /api/projects/{project_id}` - Delete a project

### AI Endpoints

- `POST /api/ai/mentor` - Get AI-powered task management advice
- `POST /api/ai/generate-timetable` - Generate a personalized timetable
- `GET /api/ai/suggestions` - Get AI-powered task suggestions

## AI Features

### Mentor Endpoint
The mentor endpoint provides personalized advice for task management and productivity. It accepts:
- User message
- List of current tasks

Example request:
```json
{
  "text": "I'm feeling overwhelmed with my tasks",
  "tasks": ["Complete project proposal", "Review code", "Team meeting"]
}
```

### Timetable Generation
Generate a personalized daily schedule based on tasks and preferences:
```json
{
  "tasks": ["Project work", "Exercise", "Team meeting"],
  "preferences": {
    "work_hours": "9-5",
    "break_duration": "15",
    "preferred_exercise_time": "morning"
  }
}
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation using Pydantic
- Rate limiting on AI endpoints
- Secure environment variable handling

## Development

### Running Tests
```bash
pytest
```

### Code Style
The project follows PEP 8 guidelines. Use black for code formatting:
```bash
black .
```

### API Documentation
Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Dependencies

- FastAPI: Web framework
- Motor: MongoDB async driver
- Google Generative AI: AI features
- Pydantic: Data validation
- Python-Jose: JWT handling
- Passlib: Password hashing
- Tenacity: Retry logic for API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 