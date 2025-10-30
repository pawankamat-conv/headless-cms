import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

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

const DATA_FILE = path.join(process.cwd(), 'data', 'submissions.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read existing submissions
async function readSubmissions(): Promise<FormSubmission[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Write submissions to file
async function writeSubmissions(submissions: FormSubmission[]) {
  await ensureDataDirectory();
  await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, email, company, size, phone, page_url } = body;
    
    if (!name || !email || !company || !size || !phone) {
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

    // Read existing submissions and add new one
    const submissions = await readSubmissions();
    submissions.unshift(newSubmission); // Add to beginning for latest first

    // Keep only last 1000 submissions to prevent file from growing too large
    if (submissions.length > 1000) {
      submissions.splice(1000);
    }

    // Write back to file
    await writeSubmissions(submissions);

    return NextResponse.json({ 
      success: true, 
      message: 'Form submission received and stored',
      id: newSubmission.id 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const submissions = await readSubmissions();
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error reading submissions:', error);
    return NextResponse.json(
      { error: 'Failed to read submissions' },
      { status: 500 }
    );
  }
}