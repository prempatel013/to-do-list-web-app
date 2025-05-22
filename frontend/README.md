# TaskSphere - Smart Task Management

TaskSphere is a modern task management application that combines intuitive design with AI assistance to help you organize tasks, boost productivity, and achieve your goals effortlessly.

## Features

- 🔐 **Secure Authentication**
  - User registration and login system
  - Protected routes for authenticated users
  - Secure token-based authentication using HTTP-only cookies

- 📝 **Smart Task Management**
  - Create, organize, and prioritize tasks
  - Set due dates and reminders
  - Track task progress and completion
  - Group tasks into projects

- 🤖 **AI Assistant**
  - Get personalized task suggestions
  - AI-powered task organization
  - Smart task prioritization
  - Natural language task creation

- 📊 **Project Organization**
  - Create and manage multiple projects
  - Custom project views and organization
  - Visual project progress tracking
  - Flexible task categorization

- 🎯 **Productivity Features**
  - Task status tracking
  - Due date management
  - Progress visualization
  - Customizable workflows

## Tech Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Authentication**: Custom JWT-based auth system
- **State Management**: React Context API
- **Icons**: Lucide Icons
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tasksphere.git
   cd tasksphere
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing the Application

For testing purposes, you can use these mock credentials:

- **User 1**
  - Email: john@example.com
  - Password: any password (for demo purposes)

- **User 2**
  - Email: jane@example.com
  - Password: any password (for demo purposes)

Or create a new account through the signup page.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── ai/                # AI chat interface
│   ├── dashboard/         # Main dashboard
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── tasks/            # Task management
│   └── projects/         # Project management
├── components/            # Reusable UI components
├── lib/                   # Core functionality
│   ├── auth/             # Authentication logic
│   ├── tasks/            # Task management logic
│   ├── projects/         # Project management logic
│   └── ai/               # AI integration
└── public/               # Static assets
```

## Authentication Flow

1. Users can access the landing page without authentication
2. Protected routes (`/dashboard`, `/tasks`, `/ai`, `/projects`, `/settings`) require authentication
3. Unauthenticated users are redirected to the login page
4. After successful login, users are redirected to their intended destination
5. Authentication state is maintained using secure HTTP-only cookies

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```env
NEXT_PUBLIC_API_URL=your_api_url_here
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/) 