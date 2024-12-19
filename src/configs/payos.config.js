import PayOS from '@payos/node'
import dotenv from 'dotenv'
dotenv.config()
export const payOS = new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY)
