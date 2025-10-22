import twilio from 'twilio'

let client: ReturnType<typeof twilio> | null = null

export function getTwilio() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    if (!accountSid || !authToken) throw new Error('Twilio credentials not set')
    client = twilio(accountSid, authToken)
  }
  return client!
}

export function getVerifyServiceSid() {
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID
  if (!sid) throw new Error('TWILIO_VERIFY_SERVICE_SID not set')
  return sid
}


