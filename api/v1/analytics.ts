/**
 * Analytics Reports Endpoint
 * Receives encrypted daily reports from Android app.
 * 
 * Format: POST /api/v1/analytics
 * Body: { alg, ivB64, encKeyB64, cipherTextB64 }
 * 
 * Hybrid encryption: AES-256-GCM + RSA-OAEP-SHA256
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDecipheriv, privateDecrypt, constants, randomBytes } from "crypto";

const PRIVATE_KEY_RAW = process.env.ANALYTICS_RSA_PRIVATE_KEY || null;

export const config = {
    api: {
        bodyParser: true,
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method === 'POST') {
        return handlePost(req, res);
    }

    if (req.method === 'GET') {
        return handleGet(req, res);
    }

    res.status(405).json({ error: 'method_not_allowed' });
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
    try {
        const body = req.body as Record<string, string>;
        if (!body || !body.alg || !body.ivB64 || !body.encKeyB64 || !body.cipherTextB64) {
            return res.status(400).json({ error: 'missing_fields' });
        }

        const reportId = randomBytes(8).toString('hex');
        console.log('ANALYTICS_REPORT:', reportId);

        // Prepare key (add PEM headers if missing)
        let pemKey = PRIVATE_KEY_RAW;
        if (pemKey && !pemKey.includes("BEGIN")) {
            pemKey = `-----BEGIN PRIVATE KEY-----\n${pemKey}\n-----END PRIVATE KEY-----`;
        }

        let decrypted: string | null = null;
        if (pemKey) {
            try {
                decrypted = decryptHybrid(pemKey, body.ivB64, body.encKeyB64, body.cipherTextB64);
                console.log('ANALYTICS_DECRYPTED:', decrypted);
            } catch (e: any) {
                console.log('ANALYTICS_DECRYPT_FAILED:', e.message);
            }
        }

        res.status(200).json({
            status: 'accepted',
            report_id: reportId,
            decrypted: decrypted !== null,
        });
    } catch (error: any) {
        res.status(200).json({ status: 'accepted', error: 'logged' });
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
    res.status(200).json({
        service: 'analytics',
        version: '1.0.0',
        key_configured: PRIVATE_KEY_RAW !== null,
        algorithm: 'AES-256-GCM + RSA-OAEP-SHA256',
    });
}

function decryptHybrid(privateKeyPem: string, ivB64: string, encKeyB64: string, cipherTextB64: string): string {
    const iv = Buffer.from(ivB64, 'base64');
    const encKey = Buffer.from(encKeyB64, 'base64');
    const cipherText = Buffer.from(cipherTextB64, 'base64');

    const aesKey = privateDecrypt(
        {
            key: privateKeyPem,
            padding: constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        },
        encKey
    );

    const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
    let decrypted = decipher.update(cipherText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
}
