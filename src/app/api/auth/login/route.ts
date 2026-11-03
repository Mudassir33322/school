import { NextResponse } from 'next/server';
import { loginUser } from '@/services/auth-service';
import { createSession } from '@/middleware/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const user = await loginUser(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, role: user.role, name: user.name },
    });

    await createSession(response, { id: user.id, role: user.role, name: user.name });
    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
