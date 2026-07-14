import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, whatsapp } = body;

    if (!name || !email || !whatsapp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a unique ID for the lead
    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save lead to Firestore (only if db is configured)
    if (db) {
      await setDoc(doc(db, 'leads', leadId), {
        name,
        email,
        whatsapp,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json(
      { success: true, leadId },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving lead:', error);
    return NextResponse.json(
      { error: 'Failed to save lead data' },
      { status: 500 }
    );
  }
}
