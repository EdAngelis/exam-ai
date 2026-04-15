import { NextResponse } from 'next/server';

const proxy = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const { method } = req;
  const path = searchParams.get('path');
  const query = searchParams.toString().split(/&(.+)/)[1] || '';
  let body = null;

  if (method !== 'GET' && method !== 'HEAD' && method !== 'DELETE') {
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
    }
  }

  try {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY || ''
    });

    const url = `${process.env.API_URL}/${path}?${query}`;

    const response = await fetch(url, {
      method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return NextResponse.json(data); 
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };
