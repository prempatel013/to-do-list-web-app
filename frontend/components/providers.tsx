'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth/auth-context';
import { TaskProvider } from '@/lib/tasks/task-context';
import { ProjectProvider } from '@/lib/projects/project-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <ProjectProvider>
          <TaskProvider>
            {children}
          </TaskProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}