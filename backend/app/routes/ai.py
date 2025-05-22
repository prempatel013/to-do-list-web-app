from fastapi import APIRouter, Depends, HTTPException, Body, status, Request, Response
from app.auth import get_current_user
import logging
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Callable
from datetime import datetime
import json
import os
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware
import uuid
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory storage for chat history
chat_history = defaultdict(list)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging request and response details"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        
        # Log request details
        request_body = None
        try:
            request_body = await request.body()
            if request_body:
                try:
                    request_body = json.loads(request_body)
                except:
                    request_body = request_body.decode('utf-8')
        except:
            pass
        
        logger.info(f"Request {request_id} - Method: {request.method} - Path: {request.url.path}")
        logger.debug(f"Request {request_id} - Headers: {dict(request.headers)}")
        logger.debug(f"Request {request_id} - Body: {request_body}")
        
        # Process request
        try:
            response = await call_next(request)
            
            # Log response details
            logger.info(f"Request {request_id} - Status: {response.status_code}")
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as e:
            logger.error(f"Request {request_id} - Error: {str(e)}")
            raise

# Predefined responses for different types of queries
PREDEFINED_RESPONSES = {
    "task_management": [
        "Break down your task into smaller, manageable steps.",
        "Set specific deadlines for each subtask.",
        "Use the Pomodoro technique: work for 25 minutes, then take a 5-minute break.",
        "Prioritize your tasks using the Eisenhower Matrix.",
        "Create a daily to-do list and review it each morning."
    ],
    "productivity": [
        "Eliminate distractions by using focus mode on your devices.",
        "Schedule your most important tasks during your peak productivity hours.",
        "Take regular breaks to maintain focus and prevent burnout.",
        "Use time-blocking to dedicate specific hours to specific tasks.",
        "Review your progress at the end of each day."
    ],
    "motivation": [
        "Remember your 'why' - the reason you started this task.",
        "Celebrate small wins along the way.",
        "Visualize the end result and how it will benefit you.",
        "Find an accountability partner to keep you on track.",
        "Break through resistance by starting with the easiest part of the task."
    ],
    "stress_management": [
        "Practice deep breathing exercises when feeling overwhelmed.",
        "Take short breaks to stretch and move around.",
        "Break large tasks into smaller, more manageable pieces.",
        "Use the 2-minute rule: if a task takes less than 2 minutes, do it immediately.",
        "Maintain a healthy work-life balance."
    ],
    "default": [
        "I understand you're looking for guidance. Could you provide more specific details about your situation?",
        "That's an interesting question. Let me help you break this down into actionable steps.",
        "I'd be happy to help you with that. What specific aspects would you like to focus on?",
        "Let's approach this systematically. What's the first step you'd like to take?",
        "I can provide some suggestions. What's your current progress on this?"
    ]
}

# Specific Q&A responses
SPECIFIC_QA_RESPONSES = {
    "what's on my to-do list today?".lower(): "Here are your tasks for today: [List today's tasks].",
    "what are my pending tasks?".lower(): "These tasks are still pending: [List of incomplete tasks].",
    "do i have any tasks due tomorrow?".lower(): "Yes, here are the tasks due tomorrow: [List of tomorrow's tasks].",
    "what tasks are due this week?".lower(): "These tasks are scheduled for this week: [Weekly tasks list].",
    "show me my completed tasks.".lower(): "Here are the tasks you've completed: [List of completed tasks].",
    "what's overdue?".lower(): "The following tasks are overdue: [List of overdue tasks].",
    "how many tasks do i have today?".lower(): "You have [number] tasks scheduled for today.",
    "what's my highest priority task?".lower(): "Your top priority task is: [Task name].",
    "can you sort my tasks by priority?".lower(): "Sure! Here is your task list sorted by priority: [Sorted task list].",
    "what are my personal tasks?".lower(): "These are your personal tasks: [List of personal tasks].",
    "add a task to my list.".lower(): "Please enter the task name and details. I'll add it right away.",
    "mark this task as complete.".lower(): "Got it! The task is now marked as complete.",
    "delete a task.".lower(): "The task has been deleted successfully.",
    "edit a task.".lower(): "Please tell me what you want to change.",
    "set a due date for this task.".lower(): "Enter the due date, and I'll set it for you.",
    "move this task to tomorrow.".lower(): "The task is now scheduled for tomorrow.",
    "set a reminder for this task.".lower(): "When would you like to be reminded?",
    "add notes to this task.".lower(): "What note would you like to add?",
    "prioritize this task.".lower(): "The task has been marked as high priority.",
    "assign this task to someone.".lower(): "Who would you like to assign it to?",
    "what tasks are due today?".lower(): "These are your tasks for today: [List today's tasks].",
    "what tasks are due this weekend?".lower(): "Here are the weekend tasks: [List of weekend tasks].",
    "what are my upcoming tasks?".lower(): "Here are your upcoming tasks: [List of tasks with future due dates].",
    "do i have any tasks for next week?".lower(): "Yes, here are your tasks for next week: [List].",
    "show me tasks for monday.".lower(): "These are your tasks for Monday: [List].",
    "remind me tomorrow about this task.".lower(): "Reminder set for tomorrow.",
    "what tasks are overdue?".lower(): "You have these overdue tasks: [List].",
    "what's my schedule for today?".lower(): "Your schedule today includes: [Timeline or list of tasks].",
    "what's my weekly agenda?".lower(): "Here's your agenda for the week: [List of tasks with days].",
    "what's due in the next 3 days?".lower(): "These tasks are due in the next 3 days: [List].",
    "suggest a task i can do in 5 minutes.".lower(): "Try this quick task: [Short task suggestion].",
    "what task should i do first?".lower(): "Start with your highest priority task: [Task name].",
    "what's the most urgent thing right now?".lower(): "This task needs your immediate attention: [Urgent task].",
    "help me focus.".lower(): "I've enabled Focus Mode. Let's work on one task at a time.",
    "hide all completed tasks.".lower(): "Done! Only active tasks are now visible.",
    "break this task into subtasks.".lower(): "Please list the subtasks.",
    "start a pomodoro timer.".lower(): "Pomodoro timer started: 25 minutes focus.",
    "what's my progress today?".lower(): "You've completed [X] out of [Y] tasks today.",
    "how can i be more productive?".lower(): "Try time blocking and focus on one task at a time.",
    "suggest a daily habit to add.".lower(): "Consider adding \"Plan tomorrow today\" or \"15 min daily reflection.\"".replace('\\"', '"'), # Handle escaped quotes
    "make this a daily task.".lower(): "Done! This task now repeats daily.",
    "repeat this task weekly.".lower(): "Task will now repeat every week.",
    "how do i stop recurring tasks?".lower(): "Open task settings and turn off repeat.",
    "what are my recurring tasks?".lower(): "Here are your repeating tasks: [List].",
    "set a task to repeat every monday.".lower(): "Task set to repeat every Monday.",
    "create a task that repeats every month.".lower(): "Task will now repeat monthly.",
    "can i set a yearly reminder?".lower(): "Yes, your reminder is now set yearly.",
    "show me all my repeating tasks.".lower(): "Here is a list of all recurring tasks: [List].",
    "edit recurrence for this task.".lower(): "Please select the new repeat interval.",
    "turn off repeat for this task.".lower(): "Repeating is now turned off for this task.",
    "add this to my work list.".lower(): "The task has been added to your Work list.",
    "show me personal tasks.".lower(): "Here are your personal tasks: [List].",
    "show me tasks in the shopping list.".lower(): "Your shopping tasks are: [List].",
    "move this to another category.".lower(): "Which category do you want to move it to?",
    "create a new list.".lower(): "What should the new list be called?",
    "delete this list.".lower(): "Are you sure? The list has been deleted.",
    "rename this list.".lower(): "What would you like to rename it to?",
    "what are the categories i have?".lower(): "You currently have these categories: [List].",
    "add a task to the \"weekend\" list.".lower(): "Task added to your Weekend list.",
    "show me only high-priority tasks.".lower(): "These are your high-priority tasks: [List].",
    "remind me to buy groceries at 5 pm.".lower(): "Reminder set for 5 PM today.",
    "notify me when this is due.".lower(): "Notification will be sent at the due time.",
    "set a location-based reminder.".lower(): "Please enter the location.",
    "can i get a daily summary?".lower(): "Daily summaries will now be sent each morning.",
    "send me a reminder 10 mins before the task.".lower(): "Reminder set for 10 minutes before the task.",
    "turn off notifications for this task.".lower(): "Notifications are now disabled for this task.",
    "what reminders do i have today?".lower(): "You have these reminders scheduled today: [List].",
    "clear all reminders.".lower(): "All reminders have been cleared.",
    "delay reminder for this task.".lower(): "How long would you like to delay it?",
    "remind me again in 1 hour.".lower(): "Got it! I'll remind you again in 1 hour.",
    "what can you do?".lower(): "I can help you manage tasks, set reminders, boost productivity, and organize your day.",
    "help me manage my tasks.".lower(): "Sure! Let's review your tasks and organize them by priority.",
    "can you organize my to-do list?".lower(): "I can sort tasks by date, priority, or category. Which one would you like?",
    "can you suggest a better schedule?".lower(): "Try focusing on 3 major tasks per day and schedule breaks in between.",
    "what's the best time to do this?".lower(): "Based on urgency and your schedule, try doing it [Suggested time].",
    "can you help me plan my day?".lower(): "Sure! Let's divide your day into focus blocks.",
    "what's the first task i should do?".lower(): "Start with your most important or urgent task.",
    "can you prioritize my tasks?".lower(): "Tasks are now sorted by priority: [List].",
    "how do i use this app?".lower(): "You can add, edit, prioritize tasks, and set reminders. Want a quick tutorial?",
    "what are some productivity tips?".lower(): "Use time blocking, set priorities, and avoid multitasking.",
    "assign this to john.".lower(): "Task has been assigned to John.",
    "share my task list with my team.".lower(): "Your task list has been shared with your team.",
    "who is assigned to this task?".lower(): "This task is currently assigned to: [Name].",
    "can i see team tasks?".lower(): "Here are all tasks assigned to the team: [List].",
    "notify my team about this task.".lower(): "Notification sent to your team.",
    "add a comment for john.".lower(): "What comment would you like to leave?",
    "show tasks assigned to others.".lower(): "These are tasks assigned to your team: [List].",
    "what's the team working on today?".lower(): "Your team is working on: [List of tasks].",
    "can we collaborate on this task?".lower(): "Yes! Collaboration is enabled.",
    "add a shared checklist.".lower(): "Shared checklist created. You can now collaborate on this task.",
}

class MentorRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="The task or question to get advice about"
    )
    tasks: List[str] = Field(
        default_factory=list,
        description="Optional list of current tasks for context"
    )
    priority: Optional[str] = Field(
        default="medium",
        description="Priority level of the task"
    )

class ChatMessage(BaseModel):
    user_id: str
    message: str
    response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    tasks: List[str] = Field(default_factory=list)

class ChatHistoryResponse(BaseModel):
    messages: List[Dict]
    total: int

def categorize_query(text: str) -> str:
    """Categorize the user's query to select appropriate responses."""
    text = text.lower()
    
    if any(word in text for word in ["task", "todo", "schedule", "deadline", "complete"]):
        return "task_management"
    elif any(word in text for word in ["productive", "efficient", "focus", "concentrate"]):
        return "productivity"
    elif any(word in text for word in ["motivate", "motivation", "inspire", "encourage"]):
        return "motivation"
    elif any(word in text for word in ["stress", "overwhelm", "anxiety", "pressure"]):
        return "stress_management"
    return "default"

def generate_response(request: MentorRequest) -> str:
    """Generate a response based on the user's query and context."""
    normalized_text = request.text.lower().strip()
    
    # Check for specific Q&A matches
    if normalized_text in SPECIFIC_QA_RESPONSES:
        base_response = SPECIFIC_QA_RESPONSES[normalized_text]
        
        # Handle dynamic responses for questions requiring task lists
        if request.tasks is not None and len(request.tasks) > 0:
            task_list_string = "\n" + "\n".join([f"- {task}" for task in request.tasks])
            
            if normalized_text == "what's on my to-do list today?":
                return base_response.replace("[List today's tasks].", task_list_string + ".")
            elif normalized_text == "what are my pending tasks?":
                 return base_response.replace("[List of incomplete tasks].", task_list_string + ".")
            elif normalized_text == "do i have any tasks due tomorrow?":
                 return base_response.replace("[List of tomorrow's tasks].", task_list_string + ".")
            elif normalized_text == "what tasks are due this week?":
                 return base_response.replace("[Weekly tasks list].", task_list_string + ".")
            elif normalized_text == "show me my completed tasks.":
                 return base_response.replace("[List of completed tasks].", task_list_string + ".")
            elif normalized_text == "what's overdue?":
                 return base_response.replace("[List of overdue tasks].", task_list_string + ".")
            elif normalized_text == "how many tasks do i have today?":
                task_count = len(request.tasks) # Already handled count, but keep here for completeness
                return base_response.replace("[number]", str(task_count))
            elif normalized_text == "what's my highest priority task?" and len(request.tasks) == 1:
                 return base_response.replace("[Task name].", request.tasks[0] + ".")
            elif normalized_text == "can you sort my tasks by priority?":
                 return base_response.replace("[Sorted task list].", task_list_string + ".")
            elif normalized_text == "what are my personal tasks?":
                 return base_response.replace("[List of personal tasks].", task_list_string + ".")
            elif normalized_text == "what tasks are due today?":
                 return base_response.replace("[List today's tasks].", task_list_string + ".")
            elif normalized_text == "what tasks are due this weekend?":
                 return base_response.replace("[List of weekend tasks].", task_list_string + ".")
            elif normalized_text == "what are my upcoming tasks?":
                 return base_response.replace("[List of tasks with future due dates].", task_list_string + ".")
            elif normalized_text == "do i have any tasks for next week?":
                 return base_response.replace("[List].", task_list_string + ".") # Assuming [List] is used for next week
            elif normalized_text == "show me tasks for monday.":
                 return base_response.replace("[List].", task_list_string + ".") # Assuming [List] is used for Monday
            elif normalized_text == "what tasks are overdue?": # Already handled above, but keep here for clarity
                 return base_response.replace("[List].", task_list_string + ".") # Assuming [List] might also be used here
            elif normalized_text == "what's my schedule for today?":
                 return base_response.replace("[Timeline or list of tasks].", task_list_string + ".")
            elif normalized_text == "what's my weekly agenda?":
                 return base_response.replace("[List of tasks with days].", task_list_string + ".")
            elif normalized_text == "what's due in the next 3 days?":
                 return base_response.replace("[List].", task_list_string + ".") # Assuming [List] is used here
            elif normalized_text == "what are my recurring tasks?":
                 return base_response.replace("[List].", task_list_string + ".") # Assuming [List] is used here
            elif normalized_text == "show me all my repeating tasks.":
                 return base_response.replace("[List].", task_list_string + ".") # Assuming [List] is used here
            elif normalized_text == "show me personal tasks.": # Already handled above, but keep here for clarity
                 return base_response.replace("[List].", task_list_string + ".") # Assuming [List] might also be used here
            elif normalized_text == "show me tasks in the shopping list.":
                 return base_response.replace("[List].", task_list_string + ".") # Assuming [List] is used here
            elif normalized_text == "what are the categories i have?":
                 return base_response.replace("[List].", task_list_string + ".") # Assuming [List] is used here for categories
            elif normalized_text == "add a task to the \"weekend\" list.":
                 return base_response.replace("add a task to the Weekend list.", f"Task added to your Weekend list: {request.tasks[0]}") # Assuming the task title is sent back
            elif normalized_text == "show me only high-priority tasks.":
                 return base_response.replace("[List].", task_list_string + ".") # Assuming [List] is used here
             # Add more conditions for other list-based queries as needed
        
        # Provide a default response if no tasks are found for a question that expects a list
        if normalized_text in [
            "what's on my to-do list today?",
            "what are my pending tasks?",
            "do i have any tasks due tomorrow?",
            "what tasks are due this week?",
            "show me my completed tasks.",
            "what's overdue?",
            "how many tasks do i have today?",
            "what's my highest priority task?",
            "can you sort my tasks by priority?",
            "what are my personal tasks?",
            "what tasks are due today?",
            "what tasks are due this weekend?",
            "what are my upcoming tasks?",
            "do i have any tasks for next week?",
            "show me tasks for monday.",
            "what tasks are overdue?",
            "what's my schedule for today?",
            "what's my weekly agenda?",
            "what's due in the next 3 days?",
            "what are my recurring tasks?",
            "show me all my repeating tasks.",
            "show me personal tasks.",
            "show me tasks in the shopping list.",
            "what are the categories i have?",
            "show me only high-priority tasks.",
            # Add more questions that expect a list if added later
        ]:
             return "You have no tasks in this category."

        return base_response
        
    # Fallback to category-based responses if no specific match
    category = categorize_query(request.text)
    responses = PREDEFINED_RESPONSES[category]
    
    # Select a response based on the input text hash
    response_index = hash(request.text) % len(responses)
    base_response = responses[response_index]
    
    # Add task-specific context if available
    if request.tasks:
        task_context = f"\n\nRegarding your tasks: {', '.join(request.tasks)}"
        base_response += task_context
    
    # Add priority-specific advice if provided
    if request.priority:
        priority_advice = f"\n\nSince this is a {request.priority} priority task, make sure to allocate appropriate time and resources."
        base_response += priority_advice
    
    return base_response

def save_chat_message(user_id: str, message: str, response: str, tasks: List[str] = None):
    """Save a chat message to in-memory storage"""
    chat_message = {
            "user_id": user_id,
            "message": message,
            "response": response,
        "timestamp": datetime.utcnow().isoformat(),
            "tasks": tasks or []
        }
    chat_history[user_id].append(chat_message)
    return chat_message

def get_user_chat_history(user_id: str, limit: int = 50, skip: int = 0) -> ChatHistoryResponse:
    """Retrieve chat history for a user from in-memory storage"""
    messages = chat_history[user_id][skip:skip + limit]
    total = len(chat_history[user_id])
    return ChatHistoryResponse(messages=messages, total=total)

def clear_user_chat_history(user_id: str):
    """Clear chat history for a user"""
    chat_history[user_id] = []
    return {"message": "Chat history cleared successfully"}

@router.post("/mentor")
async def get_mentor_advice(
    request: MentorRequest,
    current_user=Depends(get_current_user)
):
    """Get advice from the mentor based on the user's query."""
    try:
        response = generate_response(request)
        
        # Save the chat message
        user_id = str(current_user.get("_id"))
        save_chat_message(
            user_id,
            request.text,
            response,
            request.tasks
        )
        
        logger.info(f"Generated response for user {user_id}: {response}")
        
        return {"response": response}
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate response"
        )

@router.get("/history")
async def get_chat_history(
    current_user=Depends(get_current_user),
    limit: int = 50,
    skip: int = 0
):
    """Get chat history for the current user"""
    try:
        user_id = str(current_user.get("_id"))
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="User ID not found in token"
            )
        
        history = get_user_chat_history(user_id, limit, skip)
        return history.dict()
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve chat history"
        )

@router.delete("/history")
async def delete_chat_history(current_user=Depends(get_current_user)):
    """Clear chat history for the current user"""
    try:
        user_id = str(current_user.get("_id"))
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="User ID not found in token"
            )
        
        result = clear_user_chat_history(user_id)
        return result
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to clear chat history"
        )

@router.get("/health")
async def health_check():
    """Check the health of the mentor service."""
    return {
        "status": "healthy",
        "service": "mentor",
        "timestamp": datetime.utcnow().isoformat()
    } 