import { NextRequest } from 'next/server'

export function verifyAuth(req: NextRequest): boolean {
  const token = req.cookies.get('token')?.value
  // Có thể thêm logic decode JWT nếu cần
  return !!token
}