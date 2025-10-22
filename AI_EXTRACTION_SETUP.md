# AI-Powered Permit Data Extraction - Setup Guide

## Overview

This guide explains how to set up and use the AI-powered permit data extraction feature using OpenAI's GPT-4 Vision API.

---

## 📋 Prerequisites

### 1. OpenAI API Key

You need an OpenAI API key with access to GPT-4 Vision:

1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `sk-...`)

### 2. System Dependencies

The PDF processing requires **poppler-utils**:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install poppler-utils
```

**macOS:**
```bash
brew install poppler
```

**Windows:**
1. Download from [poppler-windows releases](https://github.com/oschwartz10612/poppler-windows/releases/)
2. Extract to `C:\Program Files\poppler`
3. Add `C:\Program Files\poppler\Library\bin` to PATH

---

## 🔧 Installation

### Step 1: Install Python Dependencies

```bash
cd backend
pip install openai pillow PyPDF2 pdf2image
```

Or use the provided requirements file:

```bash
pip install -r permits/requirements.txt
```

### Step 2: Configure OpenAI API Key

Add your API key to Django settings:

**Option A: Environment Variable (Recommended)**

```bash
# .env file
OPENAI_API_KEY=sk-your-api-key-here
```

```python
# settings.py
from decouple import config

OPENAI_API_KEY = config('OPENAI_API_KEY')
```

**Option B: Direct in Settings (Not Recommended for Production)**

```python
# settings.py
OPENAI_API_KEY = 'sk-your-api-key-here'  # Don't commit this!
```

### Step 3: Verify Installation

```bash
python manage.py shell
```

```python
from permits.ai_extraction import PermitDataExtractor

# This should not raise an error
extractor = PermitDataExtractor()
print("AI Extractor initialized successfully!")
```

---

## 🚀 Usage

### API Endpoint

**POST** `/api/permits/upload/`

**Content-Type:** `multipart/form-data`

**Request Parameters:**
- `file` (required): PDF, JPG, or PNG file containing permit document
- `facility` (required): Facility ID (integer)

**Response:**
```json
{
  "id": 1,
  "name": "Air Pollution License",
  "number": "APL16-000083",
  "issue_date": "2021-10-01",
  "expiry_date": "2021-10-31",
  "issued_by": "CITY OF PHILADELPHIA DEPARTMENT OF PUBLIC HEALTH",
  "facility": 1,
  "facility_name": "Main Location",
  "status": "expired",
  "document_url": "/media/permits/document.pdf",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Example Usage

#### Using cURL

```bash
curl -X POST http://localhost:8000/api/permits/upload/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/permit.pdf" \
  -F "facility=1"
```

#### Using Python Requests

```python
import requests

url = 'http://localhost:8000/api/permits/upload/'
headers = {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
files = {
    'file': open('permit.pdf', 'rb')
}
data = {
    'facility': 1
}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())
```

#### Using JavaScript/TypeScript (Frontend)

```typescript
import { permitApiService } from './services/permitApi';

const file = new File([...], 'permit.pdf');
const facilityId = 1;

try {
  const permit = await permitApiService.uploadNewPermit(file, facilityId);
  console.log('Permit created:', permit);
} catch (error) {
  console.error('Upload failed:', error);
}
```

---

## 🤖 How AI Extraction Works

### 1. File Processing Pipeline

```
Upload → File Type Detection → Image Conversion → Base64 Encoding → AI Analysis → Data Extraction → Database Save
```

### 2. Supported File Types

- **PDF:** First page is converted to JPEG at 200 DPI
- **JPG/JPEG:** Direct processing
- **PNG:** Converted to RGB JPEG if needed

### 3. Data Extraction

The AI extracts these fields:

| Field | Description | Required | Format |
|-------|-------------|----------|--------|
| `license_type` | Type of permit/license | Yes | String |
| `license_no` | Unique identifier | Yes | String |
| `issue_date` | Date issued | No | YYYY-MM-DD |
| `expiry_date` | Date expires | **Yes** | YYYY-MM-DD |
| `issued_by` | Issuing authority | Yes | String |

### 4. AI Prompt

The system uses a carefully crafted prompt to ensure accurate extraction:

```text
You are an expert data extraction system for official documents.
Analyze the provided image of a permit or license and extract the following fields.
Respond ONLY with a single, clean JSON object.

1. **license_type**: Identify the main title or type of the document
2. **license_no**: Find the primary identifier
3. **issue_date**: Find the date of issue (YYYY-MM-DD)
4. **expiry_date**: Find the expiration date (YYYY-MM-DD) - REQUIRED
5. **issued_by**: Identify the issuing authority

Example JSON Response:
{
  "license_type": "Air Pollution License",
  "license_no": "APL16-000083",
  "issue_date": "2021-10-01",
  "expiry_date": "2021-10-31",
  "issued_by": "CITY OF PHILADELPHIA DEPARTMENT OF PUBLIC HEALTH"
}
```

---

## 📊 Architecture

### Class Structure

```python
# permits/ai_extraction.py

class PermitDataExtractor:
    """Main extraction class"""

    def __init__(self, api_key=None):
        """Initialize with OpenAI API key"""

    def file_to_base64_image(self, uploaded_file):
        """Convert PDF/Image to base64 JPEG"""

    def extract_data_with_ai(self, base64_image):
        """Call OpenAI Vision API and parse response"""

    def extract_from_file(self, uploaded_file):
        """Complete pipeline: file → data"""
```

### View Structure

```python
# permits/views.py

class PermitUploadView(APIView):
    """Handle permit uploads with AI extraction"""

    def post(self, request):
        """
        1. Validate file and facility
        2. Extract data with AI
        3. Create Permit object
        4. Log history
        5. Return serialized permit
        """
```

---

## 🔍 Troubleshooting

### Error: "OpenAI API key not configured"

**Solution:** Add `OPENAI_API_KEY` to your settings or environment variables.

```python
# In settings.py
OPENAI_API_KEY = 'sk-your-key-here'
```

### Error: "poppler-utils not found"

**Solution:** Install poppler-utils for your OS (see Prerequisites section).

### Error: "Invalid JSON response from AI"

**Cause:** AI returned non-JSON text or malformed JSON.

**Solution:** The code automatically strips markdown code blocks. If issue persists:
1. Check if API key has Vision API access
2. Verify image quality (should be clear and readable)
3. Check logs for actual AI response

### Error: "Expiry date is required but could not be extracted"

**Cause:** AI couldn't find expiry date in the document.

**Solutions:**
1. Ensure document has visible expiry date
2. Check image quality (not too blurry)
3. Try uploading a different page or version
4. Manually create permit with `/api/permits/` endpoint

### Low Accuracy / Wrong Data

**Improvements:**
1. **Image Quality:** Use 300 DPI for scanning
2. **Document Clarity:** Ensure text is readable
3. **Format:** Standard permit formats work best
4. **Orientation:** Document should be right-side up
5. **Language:** Currently optimized for English

---

## 💰 Cost Considerations

### OpenAI API Pricing (as of 2024)

GPT-4 Vision pricing:
- **Input:** ~$0.01 per image
- **Tokens:** ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens

**Typical permit extraction:**
- 1 image + prompt ≈ $0.01-0.02 per document

**Monthly estimates:**
- 100 permits/month ≈ $1-2
- 500 permits/month ≈ $5-10
- 1000 permits/month ≈ $10-20

### Optimization Tips

1. **Batch Processing:** Process multiple permits at once if possible
2. **Cache Results:** Don't re-extract same document
3. **Image Optimization:** Use appropriate DPI (200-300)
4. **Monitor Usage:** Set up billing alerts in OpenAI dashboard

---

## 🔒 Security Best Practices

### 1. API Key Protection

```python
# ❌ DON'T: Hardcode in code
OPENAI_API_KEY = 'sk-abc123...'

# ✅ DO: Use environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
```

### 2. File Validation

The system automatically validates:
- File size (10MB max by default)
- File type (PDF, JPG, PNG only)
- File content (checked during processing)

### 3. Data Privacy

- Uploaded documents are sent to OpenAI API
- OpenAI has data retention policies (review OpenAI's terms)
- Consider self-hosted OCR for sensitive documents
- Store documents securely with proper permissions

### 4. Rate Limiting

Implement rate limiting to prevent abuse:

```python
# In settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '100/hour',  # Adjust as needed
    }
}
```

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Start server
python manage.py runserver

# 2. Upload test permit
curl -X POST http://localhost:8000/api/permits/upload/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_permit.pdf" \
  -F "facility=1"

# 3. Check response
# Should return extracted permit data
```

### Unit Testing

```python
# permits/tests.py

from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from .ai_extraction import PermitDataExtractor

class AIExtractionTests(TestCase):

    def test_pdf_to_base64(self):
        """Test PDF conversion"""
        extractor = PermitDataExtractor()

        with open('test_permit.pdf', 'rb') as f:
            uploaded_file = SimpleUploadedFile('test.pdf', f.read())
            base64_str = extractor.file_to_base64_image(uploaded_file)

            self.assertIsInstance(base64_str, str)
            self.assertTrue(len(base64_str) > 0)

    def test_image_to_base64(self):
        """Test image conversion"""
        extractor = PermitDataExtractor()

        with open('test_permit.jpg', 'rb') as f:
            uploaded_file = SimpleUploadedFile('test.jpg', f.read())
            base64_str = extractor.file_to_base64_image(uploaded_file)

            self.assertIsInstance(base64_str, str)
            self.assertTrue(len(base64_str) > 0)
```

---

## 📈 Monitoring & Logging

### Enable Detailed Logging

```python
# settings.py

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'permits_ai.log',
        },
    },
    'loggers': {
        'permits': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### What's Logged

- File upload details (name, size, type)
- AI extraction start/completion
- Extracted data
- Permit creation success
- All errors with stack traces

### Monitor These Metrics

1. **Success Rate:** % of successful extractions
2. **Processing Time:** Average time per document
3. **Error Rate:** % of failed extractions
4. **API Costs:** Monthly OpenAI spend
5. **Data Accuracy:** Manual verification sample rate

---

## 🚀 Advanced Usage

### Custom Prompts

Modify the prompt for specific document types:

```python
# permits/ai_extraction.py

CUSTOM_PROMPT = """Extract data from this SPECIFIC DOCUMENT TYPE..."""

# In extract_data_with_ai method, use custom prompt
```

### Multiple Pages

Extract from all PDF pages:

```python
def file_to_base64_images(self, uploaded_file):
    """Extract all pages from PDF"""
    # Modify to return list of base64 images
    images = convert_from_bytes(pdf_bytes, dpi=200)
    return [self._image_to_base64(img) for img in images]
```

### Batch Processing

Process multiple documents at once:

```python
@api_view(['POST'])
def batch_upload(request):
    """Upload multiple permits"""
    files = request.FILES.getlist('files')
    results = []

    for file in files:
        # Process each file
        result = process_permit(file)
        results.append(result)

    return Response(results)
```

---

## 📚 Additional Resources

### OpenAI Documentation
- [Vision API Guide](https://platform.openai.com/docs/guides/vision)
- [API Reference](https://platform.openai.com/docs/api-reference)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)

### PDF Processing
- [pdf2image Documentation](https://github.com/Belval/pdf2image)
- [Pillow Documentation](https://pillow.readthedocs.io/)

### Django Resources
- [File Uploads](https://docs.djangoproject.com/en/5.0/topics/http/file-uploads/)
- [DRF APIView](https://www.django-rest-framework.org/api-guide/views/)

---

## ✅ Quick Checklist

Before deploying to production:

- [ ] OpenAI API key configured
- [ ] poppler-utils installed
- [ ] Python dependencies installed
- [ ] Test upload works with sample document
- [ ] Logging configured
- [ ] Error handling tested
- [ ] Rate limiting enabled
- [ ] Cost monitoring set up
- [ ] Security review completed
- [ ] Documentation updated

---

## 🎯 Summary

Your AI-powered permit extraction is now ready! The system will:

1. ✅ Accept PDF, JPG, PNG uploads
2. ✅ Convert to optimal format for AI
3. ✅ Extract structured data with GPT-4 Vision
4. ✅ Create permit records automatically
5. ✅ Log complete audit trail
6. ✅ Handle errors gracefully

**API Endpoint:** `POST /api/permits/upload/`

**Next Steps:**
1. Add OpenAI API key to settings
2. Test with sample permits
3. Monitor accuracy and costs
4. Customize prompts if needed
5. Scale as usage grows!
