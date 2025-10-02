// User registration API endpoint for vanilla login
// Handles user signup with email and password validation

import { NextRequest, NextResponse } from 'next/server'
import { createUserWithPassword, getUserByEmail } from '@/app/_lib/kysely/repositories/user-repo'
import { validatePasswordStrength } from '@/app/_lib/auth/password-utils'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { email, password, name } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user with hashed password
    const newUser = await createUserWithPassword(email, password, name)

    // Return success response (without sensitive data)
    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          accessLevel: newUser.accessLevel,
          createdAt: newUser.createdAt
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    )
  }
}
