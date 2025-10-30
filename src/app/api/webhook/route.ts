import { NextRequest, NextResponse } from 'next/server';

interface FormSubmission {
  id: string;
  name: string;
  email: string;
  company: string;
  size: string;
  phone: string;
  page_url: string;
  timestamp: string;
}

// In-memory storage (will reset on deployment, but works for serverless)
let submissions: FormSubmission[] = [];

export async function POST(request: NextRequest) {
  try {
    console.log('Webhook received POST request');
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate required fields
    const { name, email, company, size, phone, page_url } = body;
    
    if (!name || !email || !company || !size || !phone) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new submission
    const newSubmission: FormSubmission = {
      id: Date.now().toString(),
      name: String(name),
      email: String(email),
      company: String(company),
      size: String(size),
      phone: String(phone),
      page_url: String(page_url || 'Unknown'),
      timestamp: new Date().toISOString(),
    };

    console.log('New submission created:', newSubmission);

    // Add to beginning for latest first
    submissions.unshift(newSubmission);

    // Keep only last 100 submissions to prevent memory issues
    if (submissions.length > 100) {
      submissions.splice(100);
    }

    console.log('Submission stored successfully, total submissions:', submissions.length);

    return NextResponse.json({ 
      success: true, 
      message: 'Form submission received and stored',
      id: newSubmission.id 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('GET request received, returning', submissions.length, 'submissions');
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error reading submissions:', error);
    return NextResponse.json(
      { error: 'Failed to read submissions' },
      { status: 500 }
    );
  }
}