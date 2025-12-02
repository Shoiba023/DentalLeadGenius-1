# DentalLeadGenius External Import API

This document describes how to integrate with the DentalLeadGenius lead import API, designed for syncing leads from external tools like DentalMapsHelper.

## Authentication

All external API endpoints require Bearer token authentication.

**Header:** `Authorization: Bearer <IMPORT_API_KEY>`

The API key must be configured in the server's environment variables as `IMPORT_API_KEY`.

### Error Responses

| Status | Message | Description |
|--------|---------|-------------|
| 401 | Missing or invalid Authorization header | No Bearer token provided |
| 403 | Invalid API key | Incorrect API key |
| 500 | API key not configured on server | Server misconfiguration |

## Endpoints

### 1. Single Lead Import

**Endpoint:** `POST /api/external/leads/import`

Import a single lead with automatic deduplication.

#### Request Body

```json
{
  "name": "Smile Dental Clinic",
  "email": "info@smiledental.com",
  "phone": "555-123-4567",
  "address": "123 Main Street, Suite 100",
  "city": "Los Angeles",
  "state": "CA",
  "country": "USA",
  "googleMapsUrl": "https://maps.google.com/place?id=abc123",
  "websiteUrl": "https://smiledental.com",
  "notes": "Found via Google Maps search",
  "source": "maps-helper",
  "marketingOptIn": false,
  "tags": ["maps-helper", "california"],
  "status": "new"
}
```

#### Field Specifications

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | 255 | Business/clinic name |
| email | string | No | 255 | Valid email format |
| phone | string | No | 50 | Phone number |
| address | string | No | 500 | Full street address |
| city | string | No | 100 | City name |
| state | string | No | 100 | State/province |
| country | string | No | 100 | Country (default: "USA") |
| googleMapsUrl | string | No | 2000 | Must be valid URL. Primary dedupe key |
| websiteUrl | string | No | 2000 | Must be valid URL |
| notes | string | No | 5000 | Additional notes |
| source | string | No | 50 | Import source (default: "maps-helper") |
| marketingOptIn | boolean | No | - | Email/SMS consent (default: false) |
| tags | string[] | No | 20 items | Tags for segmentation |
| status | enum | No | - | Lead status (default: "new") |
| clinicId | uuid | No | - | Associate with specific clinic |

**Valid status values:** `new`, `contacted`, `replied`, `demo_booked`, `won`, `lost`

#### Success Response

```json
{
  "success": true,
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "existing": false
}
```

The `existing` field indicates whether the lead was found via deduplication and merged (true) or newly created (false).

#### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

### 2. Bulk Lead Import

**Endpoint:** `POST /api/external/leads/bulk-import`

Import multiple leads in a single request. Each lead is processed individually - one bad lead won't fail the entire batch.

#### Request Body

```json
{
  "leads": [
    {
      "name": "Clinic A",
      "email": "clinic-a@example.com",
      "city": "Miami",
      "googleMapsUrl": "https://maps.google.com/place?id=abc"
    },
    {
      "name": "Clinic B",
      "phone": "555-987-6543",
      "city": "Chicago",
      "googleMapsUrl": "https://maps.google.com/place?id=def"
    }
  ]
}
```

#### Success Response

```json
{
  "success": true,
  "totalProcessed": 2,
  "created": 1,
  "existing": 1,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "success": true,
      "leadId": "550e8400-e29b-41d4-a716-446655440000",
      "existing": false
    },
    {
      "index": 1,
      "success": true,
      "leadId": "660e8400-e29b-41d4-a716-446655440001",
      "existing": true
    }
  ]
}
```

#### Partial Failure Response

```json
{
  "success": false,
  "totalProcessed": 3,
  "created": 1,
  "existing": 1,
  "failed": 1,
  "results": [
    { "index": 0, "success": true, "leadId": "...", "existing": false },
    { "index": 1, "success": true, "leadId": "...", "existing": true },
    { "index": 2, "success": false, "error": "name: Name is required" }
  ]
}
```

---

## Deduplication Strategy

The API implements automatic deduplication to prevent duplicate leads:

### Primary Deduplication: Google Maps URL

When `googleMapsUrl` is provided, the system checks for an existing lead with the same URL. This is the most reliable dedupe method for map-sourced leads.

### Secondary Deduplication: Email + City + Country

When `googleMapsUrl` is not available, the system falls back to matching on the combination of `email` + `city` + `country`.

### Merge Behavior

When a duplicate is detected:
1. The existing lead is preserved
2. Missing fields are filled in from the new data (e.g., if existing lead has no phone but new data has one)
3. Notes are appended (not replaced)
4. `lastImportedAt` timestamp is updated
5. Response includes `existing: true`

---

## Campaign Readiness

Imported leads are stored with campaign-ready fields:

| Field | Purpose |
|-------|---------|
| `source` | Filter leads by import source (e.g., `maps-helper`) |
| `marketingOptIn` | Respect email/SMS consent (default: `false`) |
| `tags` | Segment leads for targeted campaigns |
| `lastImportedAt` | Track sync status with external tools |

### Important: Marketing Consent

By default, `marketingOptIn` is set to `false`. Only send marketing emails to leads where explicit consent has been obtained.

---

## Example: DentalMapsHelper Integration

### cURL Example - Single Lead

```bash
curl -X POST "https://your-app.replit.app/api/external/leads/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_IMPORT_API_KEY" \
  -d '{
    "name": "Sunshine Dental",
    "email": "info@sunshinedental.com",
    "phone": "555-123-4567",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "googleMapsUrl": "https://maps.google.com/place?id=ChIJ...",
    "source": "maps-helper",
    "tags": ["maps-helper", "los-angeles"]
  }'
```

### cURL Example - Bulk Import

```bash
curl -X POST "https://your-app.replit.app/api/external/leads/bulk-import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_IMPORT_API_KEY" \
  -d '{
    "leads": [
      {
        "name": "Clinic One",
        "city": "Miami",
        "googleMapsUrl": "https://maps.google.com/place?id=abc123"
      },
      {
        "name": "Clinic Two",
        "city": "Chicago",
        "googleMapsUrl": "https://maps.google.com/place?id=def456"
      }
    ]
  }'
```

### JavaScript/Node.js Example

```javascript
const importLeads = async (leads) => {
  const response = await fetch('https://your-app.replit.app/api/external/leads/bulk-import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.IMPORT_API_KEY}`
    },
    body: JSON.stringify({ leads })
  });
  
  const result = await response.json();
  
  console.log(`Imported: ${result.created} new, ${result.existing} existing, ${result.failed} failed`);
  
  return result;
};
```

---

## Rate Limiting & Best Practices

1. **Batch Size:** Keep bulk imports under 100 leads per request
2. **Retry Logic:** Implement exponential backoff for failed requests
3. **Idempotency:** The API is idempotent - re-importing the same lead won't create duplicates
4. **Error Handling:** Always check individual results in bulk imports

---

## Admin Statistics (Internal Only)

For authenticated admin users, import statistics are available:

**Endpoint:** `GET /api/admin/leads/import-stats`

**Authentication:** Session-based (internal use only)

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalLeads": 1500,
    "totalMapsHelperLeads": 1200,
    "lastImportedAt": "2025-01-15T10:30:00Z",
    "importedTodayCount": 45
  }
}
```

---

## Testing (Development Only)

In non-production environments, a test endpoint is available:

**Endpoint:** `POST /api/test/import-verification`

This creates a test lead marked "DO NOT EMAIL" to verify the import pipeline works correctly.
