import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/invoice-pdf';
import React from 'react';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Await params in Next.js 15
) {
  const { id } = await params;

  // 1. Fetch Data
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      lease: {
        include: {
          tenant: true,
          unit: { include: { property: true } }
        }
      }
    }
  });

  if (!payment) return new NextResponse('Not found', { status: 404 });

  // 2. Generate PDF Stream
  const stream = await renderToStream(
    <InvoicePDF payment={payment} lease={payment.lease} />
  );

  // 3. Return as PDF file
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${payment.id.split('-')[0]}.pdf"`,
    },
  });
}