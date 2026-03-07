import { NextRequest, NextResponse } from 'next/server'

// Server-side Firebase Admin is not available without firebase-admin SDK.
// Instead, we create a lightweight approach: the admin user calls this API,
// which uses the Firebase client SDK's createUserWithEmailAndPassword.
// Since this runs on the server (API route), we need a different approach.
// We'll use the REST API for Firebase Auth.

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, role, teamId, teamName } = await req.json()

    if (!email || !password || !displayName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Create Firebase Auth user via REST API
    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    )
    const authData = await authRes.json()

    if (authData.error) {
      const msg = authData.error.message || 'Auth creation failed'
      const friendly: Record<string, string> = {
        'EMAIL_EXISTS': 'This email is already registered',
        'INVALID_EMAIL': 'Invalid email address',
        'WEAK_PASSWORD': 'Password is too weak (min 6 characters)',
      }
      return NextResponse.json({ error: friendly[msg] || msg }, { status: 400 })
    }

    const uid = authData.localId

    // 2. Create Firestore user profile via REST API
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?documentId=${uid}`

    const firestoreRes = await fetch(firestoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.idToken}`,
      },
      body: JSON.stringify({
        fields: {
          displayName: { stringValue: displayName },
          email: { stringValue: email },
          role: { stringValue: role || 'team_owner' },
          teamId: { stringValue: teamId || '' },
          teamName: { stringValue: teamName || '' },
        },
      }),
    })

    if (!firestoreRes.ok) {
      // Auth user created but Firestore failed — still return success with warning
      return NextResponse.json({
        success: true,
        uid,
        warning: 'Auth account created but profile save failed. Please update manually.',
      })
    }

    return NextResponse.json({ success: true, uid })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
