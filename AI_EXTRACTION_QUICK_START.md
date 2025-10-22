# AI Extraction - Quick Start

## 🚀 5-Minute Setup

### 1. Install Dependencies

```bash
cd backend
pip install openai pillow PyPDF2 pdf2image
```

### 2. Install poppler-utils

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**macOS:**
```bash
brew install poppler
```

**Windows:** Download from [poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases/)

### 3. Add OpenAI API Key

```python
# backend/facility_management/settings.py

OPENAI_API_KEY = 'sk-your-openai-api-key-here'
```

### 4. Test It

```bash
python manage.py shell
```

```python
from permits.ai_extraction import PermitDataExtractor
extractor = PermitDataExtractor()
print("✅ AI Extractor ready!")
```

---

## 📤 API Usage

### Upload Permit with AI Extraction

```bash
curl -X POST http://localhost:8000/api/permits/upload/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@permit.pdf" \
  -F "facility=1"
```

### Response

```json
{
  "id": 1,
  "name": "Operating Permit",
  "number": "OP-2024-001",
  "issue_date": "2024-01-01",
  "expiry_date": "2025-01-01",
  "issued_by": "State Department",
  "status": "active"
}
```

---

## ✨ What It Extracts

- ✅ **License Type** - Type of permit/license
- ✅ **License Number** - Unique identifier
- ✅ **Issue Date** - When issued (optional)
- ✅ **Expiry Date** - When expires (required)
- ✅ **Issued By** - Issuing authority

---

## 🎯 Supported Formats

- **PDF** - First page converted to image
- **JPG/JPEG** - Direct processing
- **PNG** - Converted to RGB JPEG

**Max Size:** 10MB
**DPI:** 200 (for PDFs)

---

## 💡 Quick Tips

1. **Clear Documents:** Use high-quality scans (200-300 DPI)
2. **Standard Formats:** Standard permit layouts work best
3. **English Text:** Optimized for English language
4. **Right-Side Up:** Orient documents correctly
5. **Cost:** ~$0.01-0.02 per document

---

## 🐛 Common Issues

### "OpenAI API key not configured"
```python
# Add to settings.py
OPENAI_API_KEY = 'sk-...'
```

### "poppler not found"
```bash
# Install poppler-utils (see step 2 above)
```

### "Failed to extract expiry date"
- Check document quality
- Ensure expiry date is visible
- Try different page/scan

---

## 📖 Full Documentation

See `AI_EXTRACTION_SETUP.md` for:
- Detailed setup instructions
- Architecture explanation
- Security best practices
- Cost optimization
- Advanced usage
- Troubleshooting guide

---

## 🔗 Useful Links

- [OpenAI Platform](https://platform.openai.com/)
- [API Documentation](https://platform.openai.com/docs/api-reference)
- [Vision API Guide](https://platform.openai.com/docs/guides/vision)

---

## ✅ Checklist

- [ ] Dependencies installed (`pip install ...`)
- [ ] poppler-utils installed
- [ ] OpenAI API key added to settings
- [ ] Test extraction works
- [ ] Try upload via API
- [ ] Check permit created in database

**You're ready to extract permit data with AI!** 🎉
