import { NextRequest, NextResponse } from 'next/server';
import { addItem, getItems, updateItem, deleteItem, adjustStock } from '@/services/inventory-service';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;

    const items = await getItems({ search, category });
    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'adjustStock') {
      const { id, quantity, type } = body;
      if (!id || quantity === undefined || !type) {
        return NextResponse.json({ success: false, message: 'id, quantity, and type are required' }, { status: 400 });
      }
      const ok = await adjustStock(id, quantity, type);
      if (!ok) {
        return NextResponse.json({ success: false, message: 'Failed to adjust stock' }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (!body.itemName) {
      return NextResponse.json({ success: false, message: 'Item name is required' }, { status: 400 });
    }

    const item = await addItem(body);
    if (!item) {
      return NextResponse.json({ success: false, message: 'Failed to add item' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const PUT = withAuth(async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const ok = await updateItem(id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Item not found or update failed' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id, ...updates } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const DELETE = withAuth(async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const ok = await deleteItem(id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Item not found or delete failed' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
