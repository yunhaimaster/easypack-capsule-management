import { NextResponse } from 'next/server'

interface ErrorPayload {
  code: string
  message: string
  details?: unknown
}

interface SuccessOptions {
  status?: number
  headers?: HeadersInit
}

export function jsonSuccess<T>(data: T, options: SuccessOptions = {}) {
  const { status = 200, headers } = options
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status, headers }
  )
}

export function jsonError(status: number, error: ErrorPayload) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  )
}
