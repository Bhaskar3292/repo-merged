"""
AI-powered document extraction for permits using OpenAI API
Enhanced with OCR fallback, date heuristics, and graceful degradation
"""
import base64
import json
import logging
import re
from datetime import datetime, timedelta
from io import BytesIO
from PIL import Image
import PyPDF2
from openai import OpenAI
import pdf2image
from django.conf import settings

logger = logging.getLogger(__name__)


class PermitDataExtractor:
    """
    Handles AI-powered data extraction from permit documents using OpenAI API
    Features:
    - PDF text extraction with OCR fallback
    - Image analysis with GPT-4o Vision
    - Date inference from text patterns
    - Policy-based expiry calculation
    - Graceful degradation (never fails on missing expiry)
    """

    EXTRACTION_PROMPT = """You are an expert data extraction system for official documents.
Analyze the provided document (text or image) and extract the following fields into a JSON object.

FIELDS TO EXTRACT:
- license_type: Document type/title (e.g., "Operating Permit", "Business License", "Fire Safety Permit")
- license_no: Primary identifier/number (look for "License #", "Permit No.", "ID", etc.)
- issue_date: Issue/Issuance date in YYYY-MM-DD format (labels: "Issued", "Issue Date", "Date Issued", "Effective")
- expiry_date: Expiration date in YYYY-MM-DD format (labels: "Expiry", "Expiration", "Expires", "Valid Until", "Valid Through", "Valid Thru", "Through", "Not After", "Expiration Date")
- issued_by: Issuing authority/department/agency

DATE EXTRACTION RULES:
- Look for BOTH US format (MM/DD/YYYY) and international (DD/MM/YYYY, YYYY-MM-DD)
- Look near keywords: "expiry", "expiration", "expires", "valid until", "through", "not after"
- Normalize ALL dates to YYYY-MM-DD format
- If only issue_date found, set expiry_date to null (we will infer it)
- If both dates present, extract both
- Use null for any field not found

CRITICAL FORMATTING RULES:
- Return ONLY a valid JSON object
- No additional text, explanations, or markdown
- All fields are nullable (use null, not empty string)

EXAMPLE OUTPUT:
{"license_type": "Air Pollution License", "license_no": "APL16-000083", "issue_date": "2021-10-01", "expiry_date": "2021-10-31", "issued_by": "CITY OF PHILADELPHIA DEPARTMENT OF PUBLIC HEALTH"}"""

    PERMIT_POLICY = {
        'TOBACCO': 365,
        'MV REPAIR': 365,
        'MOTOR VEHICLE': 365,
        'FIRE SAFETY': 1095,
        'FIRE SAFETY PERMIT': 1095,
        'OPERATING PERMIT': 365,
        'BUSINESS LICENSE': 365,
        'AIR POLLUTION': 365,
        'ENVIRONMENTAL': 1095,
    }

    def __init__(self, api_key=None):
        """
        Initialize the extractor with OpenAI API key

        Args:
            api_key: OpenAI API key. If not provided, uses settings.OPENAI_API_KEY
        """
        self.api_key = api_key or getattr(settings, 'OPENAI_API_KEY', None)
        if not self.api_key:
            raise ValueError("OpenAI API key not configured. Set OPENAI_API_KEY in settings.")

        self.client = OpenAI(api_key=self.api_key)
        self.model = getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini')

    def file_to_base64_image(self, uploaded_file):
        """
        Convert uploaded file to base64 encoded image string or extract text from PDF
        Includes OCR fallback for scanned PDFs

        Args:
            uploaded_file: Django UploadedFile object

        Returns:
            str or dict: Base64 encoded image string for images, or text dictionary for PDFs
        """
        try:
            file_extension = uploaded_file.name.lower().split('.')[-1]

            if file_extension == 'pdf':
                logger.info(f"Processing PDF file: {uploaded_file.name}")

                pdf_bytes = uploaded_file.read()
                uploaded_file.seek(0)

                pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))

                text_content = ""
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    text = page.extract_text()
                    if text:
                        text_content += f"--- Page {page_num} ---\n{text}\n\n"

                quality = "text"

                if len(text_content.strip()) < 100:
                    logger.warning("PDF has minimal text, attempting OCR fallback")
                    try:
                        from pdf2image import convert_from_bytes
                        import pytesseract
                        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
                        poppler_path = r'C:\Program Files\poppler-25.07.0\Library\bin'
                        images = convert_from_bytes(
                            pdf_bytes,
                            first_page=1,
                            last_page=min(3, len(pdf_reader.pages)),
                            dpi=300,
                            poppler_path=poppler_path
                        )

                        ocr_text = ""
                        for page_num, img in enumerate(images, 1):
                            ocr_text += f"--- Page {page_num} (OCR) ---\n"
                            ocr_text += pytesseract.image_to_string(img)
                            ocr_text += "\n\n"

                        if len(ocr_text.strip()) > len(text_content.strip()):
                            text_content = ocr_text
                            quality = "ocr"
                            logger.info(f"OCR extracted {len(ocr_text)} characters")

                    except ImportError:
                        logger.warning("OCR libraries not available (pdf2image, pytesseract)")
                    except Exception as e:
                        logger.warning(f"OCR fallback failed: {str(e)}")

                if len(text_content) > 15000:
                    text_content = text_content[:15000] + "\n\n(truncated for length)"

                logger.info(f"Successfully extracted text from PDF ({quality}): {len(text_content)} chars")

                return {
                    "type": "pdf_text",
                    "text": text_content,
                    "page_count": len(pdf_reader.pages),
                    "quality": quality
                }

            elif file_extension in ['jpg', 'jpeg', 'png']:
                logger.info(f"Processing image file: {uploaded_file.name}")

                image = Image.open(uploaded_file)
                uploaded_file.seek(0)

                if image.mode == 'RGBA':
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[3])
                    image = background
                elif image.mode != 'RGB':
                    image = image.convert('RGB')

                buffer = BytesIO()
                image.save(buffer, format='JPEG', quality=85)
                buffer.seek(0)

                base64_image = base64.b64encode(buffer.read()).decode('utf-8')

                logger.info(f"Successfully converted image to base64")
                return base64_image

            else:
                raise ValueError(f"Unsupported file type: {file_extension}. Supported: PDF, JPG, JPEG, PNG")

        except Exception as e:
            logger.error(f"Error converting file: {str(e)}")
            raise

    def infer_dates_from_text(self, text):
        """
        Extract dates from text using regex patterns and heuristics

        Args:
            text: Extracted text content

        Returns:
            dict: Dictionary with issue_date and/or expiry_date if found
        """
        dates = {}

        expiry_keywords = r'(?:expir(?:y|ation|es)|valid\s+(?:until|thru|through)|through|not\s+after)'
        issue_keywords = r'(?:issue(?:d)?|effective|date\s+issued)'

        date_patterns = [
            r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',
            r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})',
            r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})',
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})',
        ]

        lines = text.split('\n')

        for i, line in enumerate(lines):
            line_lower = line.lower()

            if re.search(expiry_keywords, line_lower, re.IGNORECASE):
                context = ' '.join(lines[max(0, i-1):min(len(lines), i+2)])

                for pattern in date_patterns:
                    matches = re.findall(pattern, context, re.IGNORECASE)
                    if matches:
                        try:
                            normalized = self._normalize_date(matches[-1])
                            if normalized:
                                dates['expiry_date'] = normalized
                                logger.info(f"Found expiry date via heuristic: {normalized} from '{context[:80]}'")
                                break
                        except:
                            pass

            if re.search(issue_keywords, line_lower, re.IGNORECASE):
                context = ' '.join(lines[max(0, i-1):min(len(lines), i+2)])

                for pattern in date_patterns:
                    matches = re.findall(pattern, context, re.IGNORECASE)
                    if matches:
                        try:
                            normalized = self._normalize_date(matches[0])
                            if normalized:
                                dates['issue_date'] = normalized
                                logger.info(f"Found issue date via heuristic: {normalized}")
                                break
                        except:
                            pass

        return dates

    def _normalize_date(self, date_tuple):
        """
        Normalize date tuple to YYYY-MM-DD format

        Args:
            date_tuple: Tuple of date components from regex

        Returns:
            str: Date in YYYY-MM-DD format or None
        """
        months = {
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
        }

        try:
            if len(date_tuple) == 3:
                if date_tuple[0].isdigit() and date_tuple[1].isdigit() and date_tuple[2].isdigit():
                    p1, p2, p3 = int(date_tuple[0]), int(date_tuple[1]), int(date_tuple[2])

                    if p1 > 1900:
                        year, month, day = p1, p2, p3
                    elif p3 > 1900:
                        if p1 > 12:
                            day, month, year = p1, p2, p3
                        else:
                            month, day, year = p1, p2, p3
                    else:
                        return None

                    if 1 <= month <= 12 and 1 <= day <= 31:
                        return f"{year:04d}-{month:02d}-{day:02d}"

                elif isinstance(date_tuple[0], str) and date_tuple[0][:3].lower() in months:
                    month = months[date_tuple[0][:3].lower()]
                    day = int(date_tuple[1].replace(',', ''))
                    year = int(date_tuple[2])
                    return f"{year:04d}-{month:02d}-{day:02d}"

                elif isinstance(date_tuple[1], str) and date_tuple[1][:3].lower() in months:
                    day = int(date_tuple[0])
                    month = months[date_tuple[1][:3].lower()]
                    year = int(date_tuple[2])
                    return f"{year:04d}-{month:02d}-{day:02d}"

        except (ValueError, IndexError):
            pass

        return None

    def apply_policy_fallback(self, extracted_data):
        """
        Apply policy-based expiry calculation if only issue_date is present

        Args:
            extracted_data: Dictionary with extracted fields

        Returns:
            dict: Updated dictionary with computed expiry_date if applicable
        """
        if extracted_data.get('expiry_date'):
            return extracted_data

        if not extracted_data.get('issue_date'):
            return extracted_data

        license_type = (extracted_data.get('license_type') or '').upper()

        for policy_key, days in self.PERMIT_POLICY.items():
            if policy_key in license_type:
                try:
                    issue_date = datetime.strptime(extracted_data['issue_date'], '%Y-%m-%d')
                    expiry_date = issue_date + timedelta(days=days)
                    extracted_data['expiry_date'] = expiry_date.strftime('%Y-%m-%d')
                    extracted_data['inference_notes'] = f"Expiry computed via policy: {policy_key} ({days} days)"
                    logger.info(f"Applied policy fallback: {policy_key} -> {extracted_data['expiry_date']}")
                    return extracted_data
                except (ValueError, TypeError):
                    pass

        return extracted_data

    def clean_json_response(self, content):
        """
        Clean and extract JSON from AI response

        Args:
            content: Raw response string from AI

        Returns:
            str: Cleaned JSON string
        """
        try:
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()

            start_idx = content.find('{')
            if start_idx != -1:
                content = content[start_idx:]

            end_idx = content.rfind('}')
            if end_idx != -1:
                content = content[:end_idx + 1]

            content = content.replace(',}', '}').replace(', ]', ']')

            return content.strip()

        except Exception as e:
            logger.warning(f"Error cleaning JSON response: {str(e)}")
            return content

    def extract_fields_manually(self, content):
        """
        Manual field extraction as last resort when JSON parsing fails

        Args:
            content: Raw response string from AI

        Returns:
            dict: Extracted data with default values
        """
        logger.warning("Using manual field extraction fallback")

        extracted_data = {}

        license_patterns = [
            r'"license_no":\s*"([^"]*)"',
            r'"license_no":\s*([^,}\s]*)',
            r'license.*?[#:]?\s*([A-Za-z0-9\-_]+)',
        ]

        for pattern in license_patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                extracted_data['license_no'] = match.group(1).strip('"')
                break

        date_pattern = r'\b(\d{4}-\d{2}-\d{2})\b'
        dates = re.findall(date_pattern, content)
        if len(dates) >= 2:
            extracted_data['issue_date'] = dates[0]
            extracted_data['expiry_date'] = dates[1]
        elif len(dates) == 1:
            extracted_data['expiry_date'] = dates[0]

        type_pattern = r'"license_type":\s*"([^"]*)"'
        type_match = re.search(type_pattern, content, re.IGNORECASE)
        if type_match:
            extracted_data['license_type'] = type_match.group(1)

        issued_by_pattern = r'"issued_by":\s*"([^"]*)"'
        issued_match = re.search(issued_by_pattern, content, re.IGNORECASE)
        if issued_match:
            extracted_data['issued_by'] = issued_match.group(1)

        return extracted_data

    def validate_and_parse_json(self, content):
        """
        Validate and parse JSON with fallback options

        Args:
            content: Cleaned JSON string

        Returns:
            dict: Parsed data (may be partial)
        """
        try:
            extracted_data = json.loads(content)
            logger.info("Successfully parsed JSON on first attempt")
            return extracted_data

        except json.JSONDecodeError as e:
            logger.warning(f"First JSON parse failed: {str(e)}. Attempting fixes...")

            json_match = re.search(r'\{[^{}]*"[^"]*"[^{}]*\}', content)
            if json_match:
                try:
                    extracted_data = json.loads(json_match.group())
                    logger.info("Successfully extracted JSON using regex")
                    return extracted_data
                except json.JSONDecodeError:
                    pass

            logger.warning("All JSON parsing failed, using manual extraction")
            return self.extract_fields_manually(content)

    def extract_data_with_ai(self, input_data, raw_text=None):
        """
        Extract permit data from base64 image or PDF text using OpenAI

        Args:
            input_data: Either base64 string (for images) or dict with PDF text
            raw_text: Optional raw text for heuristic fallback

        Returns:
            dict: Extracted permit data with needs_review flag
        """
        try:
            logger.info(f"Calling OpenAI API ({self.model}) for data extraction")

            if isinstance(input_data, dict) and input_data.get("type") == "pdf_text":
                text_content = input_data.get("text", "")
                text_prompt = self.EXTRACTION_PROMPT + "\n\nDOCUMENT TEXT:\n" + text_content

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a JSON data extraction system. Return ONLY valid JSON."
                        },
                        {
                            "role": "user",
                            "content": text_prompt
                        }
                    ],
                    max_tokens=500,
                    temperature=0.0,
                    response_format={"type": "json_object"}
                )

                extraction_path = f"pdf_text ({input_data.get('quality', 'text')})"
                raw_text = text_content

            else:
                base64_image = input_data

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a JSON data extraction system. Return ONLY valid JSON."
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": self.EXTRACTION_PROMPT
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}",
                                        "detail": "high"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=500,
                    temperature=0.0
                )

                extraction_path = "image"

            content = response.choices[0].message.content.strip()
            logger.info(f"Raw AI response: {content[:120]}...")

            cleaned_content = self.clean_json_response(content)
            extracted_data = self.validate_and_parse_json(cleaned_content)

            logger.info(f"AI extracted via {extraction_path}: {extracted_data}")

            if raw_text and (not extracted_data.get('expiry_date') or not extracted_data.get('issue_date')):
                logger.info("Running heuristic date extraction on text")
                heuristic_dates = self.infer_dates_from_text(raw_text)

                if not extracted_data.get('expiry_date') and heuristic_dates.get('expiry_date'):
                    extracted_data['expiry_date'] = heuristic_dates['expiry_date']
                    extraction_path += " + heuristic"

                if not extracted_data.get('issue_date') and heuristic_dates.get('issue_date'):
                    extracted_data['issue_date'] = heuristic_dates['issue_date']

            extracted_data = self.apply_policy_fallback(extracted_data)

            extracted_data['needs_review'] = not bool(extracted_data.get('expiry_date'))

            if extracted_data['needs_review']:
                if 'inference_notes' not in extracted_data:
                    extracted_data['inference_notes'] = "Expiry date not found; please enter manually"
                logger.warning(f"Extraction needs review: {extracted_data['inference_notes']}")
            else:
                if 'inference_notes' not in extracted_data:
                    extracted_data['inference_notes'] = f"Extracted via {extraction_path}"

            logger.info(f"Final extraction result: {extracted_data}")
            return extracted_data

        except Exception as e:
            logger.error(f"Error in AI extraction: {str(e)}", exc_info=True)
            return {
                'license_type': None,
                'license_no': None,
                'issue_date': None,
                'expiry_date': None,
                'issued_by': None,
                'needs_review': True,
                'inference_notes': f"Extraction failed: {str(e)}"
            }

    def extract_from_file(self, uploaded_file):
        """
        Complete extraction pipeline: convert file to image/text and extract data

        Args:
            uploaded_file: Django UploadedFile object

        Returns:
            dict: Extracted permit data with needs_review flag
        """
        input_data = self.file_to_base64_image(uploaded_file)

        raw_text = None
        if isinstance(input_data, dict) and input_data.get('type') == 'pdf_text':
            raw_text = input_data.get('text')

        extracted_data = self.extract_data_with_ai(input_data, raw_text=raw_text)

        return extracted_data
