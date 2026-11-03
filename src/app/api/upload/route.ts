import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { withAuth } from '@/lib/api-auth';


const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'File type not allowed' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${folder}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const dir = path.join(UPLOAD_DIR, folder);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, fileName), buffer);

    const url = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      success: true,
      data: { url, fileName, originalName: file.name, size: file.size, type: file.type },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
})

export const DELETE = withAuth(async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, message: 'URL is required' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
})
