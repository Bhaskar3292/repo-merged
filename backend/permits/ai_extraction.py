"""
AI-powered document extraction for permits using OpenAI API
"""
import base64
import json
import logging
import re
from io import BytesIO
from PIL import Image
import PyPDF2
import openai
from django.conf import settings

logger = logging.getLogger(__name__)


class PermitDataExtractor:
    """
    Handles AI-powered data extraction from permit documents using OpenAI API
    Supports both PDF text extraction and image analysis with robust JSON parsing
    """

    EXTRACTION_PROMPT = """You are an expert data extraction system for official documents.
Analyze the provided document and extract the following fields into a JSON object.

REQUIRED FIELDS:
- license_type: Document type/title (e.g., "Operating Permit", "Business License")
- license_no: Primary identifier/number
- issue_date: Issue date in YYYY-MM-DD format (use null if not found)
- expiry_date: Expiration date in YYYY-MM-DD format (REQUIRED)
- issued_by: Issuing authority/department

CRITICAL FORMATTING RULES:
- Return ONLY a valid JSON object
- No additional text, explanations, or formatting
- No markdown code blocks
- Use null for missing optional fields
- Ensure expiry_date is always provided

EXAMPLE RESPONSE (ONLY JSON):
{"license_type": "Air Pollution License", "license_no": "APL16-000083", "issue_date": "2021-10-01", "expiry_date": "2021-10-31", "issued_by": "CITY OF PHILADELPHIA DEPARTMENT OF PUBLIC HEALTH"}"""

    def __init__(self, api_key=None):
        """
        Initialize the extractor with OpenAI API key

        Args:
            api_key: OpenAI API key. If not provided, uses settings.OPENAI_API_KEY
        """
        self.api_key = api_key or getattr(settings, 'OPENAI_API_KEY', None)
        if not self.api_key:
            raise ValueError("OpenAI API key not configured. Set OPENAI_API_KEY in settings.")

        self.client = openai.OpenAI(api_key=self.api_key)

    def file_to_base64_image(self, uploaded_file):
        """
        Convert uploaded file to base64 encoded image string or extract text from PDF

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
                pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))

                text_content = ""
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    text = page.extract_text()
                    if text:
                        text_content += f"--- Page {page_num} ---\n{text}\n\n"

                logger.info(f"Successfully extracted text from PDF with {len(pdf_reader.pages)} pages")

                return {
                    "type": "pdf_text",
                    "text": text_content,
                    "page_count": len(pdf_reader.pages)
                }

            elif file_extension in ['jpg', 'jpeg', 'png']:
                logger.info(f"Processing image file: {uploaded_file.name}")

                image = Image.open(uploaded_file)

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
                raise ValueError(f"Unsupported file type: {file_extension}. Supported types: PDF, JPG, JPEG, PNG")

        except Exception as e:
            logger.error(f"Error converting file to base64: {str(e)}")
            raise

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
            extracted_data['issue_date'] = None

        type_pattern = r'"license_type":\s*"([^"]*)"'
        type_match = re.search(type_pattern, content, re.IGNORECASE)
        if type_match:
            extracted_data['license_type'] = type_match.group(1)

        issued_by_pattern = r'"issued_by":\s*"([^"]*)"'
        issued_match = re.search(issued_by_pattern, content, re.IGNORECASE)
        if issued_match:
            extracted_data['issued_by'] = issued_match.group(1)

        default_fields = {
            'license_type': 'Unknown Permit',
            'license_no': extracted_data.get('license_no', 'Unknown'),
            'issue_date': extracted_data.get('issue_date'),
            'expiry_date': extracted_data.get('expiry_date'),
            'issued_by': 'Unknown Authority'
        }

        default_fields.update(extracted_data)
        return default_fields

    def validate_and_parse_json(self, content):
        """
        Validate and parse JSON with fallback options

        Args:
            content: Cleaned JSON string

        Returns:
            dict: Parsed and validated data
        """
        try:
            extracted_data = json.loads(content)
            logger.info("Successfully parsed JSON on first attempt")

        except json.JSONDecodeError as e:
            logger.warning(f"First JSON parse failed: {str(e)}. Attempting fixes...")

            json_match = re.search(r'\{[^{}]*"[^"]*"[^{}]*\}', content)
            if json_match:
                try:
                    extracted_data = json.loads(json_match.group())
                    logger.info("Successfully extracted JSON using regex")
                except json.JSONDecodeError:
                    logger.warning("Regex extraction failed, using manual extraction")
                    extracted_data = self.extract_fields_manually(content)
            else:
                logger.warning("No JSON pattern found, using manual extraction")
                extracted_data = self.extract_fields_manually(content)

        return self.ensure_required_fields(extracted_data)

    def ensure_required_fields(self, extracted_data):
        """
        Ensure all required fields are present with proper defaults

        Args:
            extracted_data: Dictionary of extracted data

        Returns:
            dict: Validated data with all required fields
        """
        required_fields = {
            'license_type': 'Unknown Permit',
            'license_no': 'Unknown',
            'issue_date': None,
            'expiry_date': None,
            'issued_by': 'Unknown Authority'
        }

        for field, default in required_fields.items():
            if field not in extracted_data or extracted_data[field] is None or extracted_data[field] == '':
                extracted_data[field] = default
                logger.warning(f"Set default value for missing field: {field}")

        if not extracted_data['expiry_date'] or extracted_data['expiry_date'] == 'Unknown':
            raise ValueError("Expiry date is required but could not be extracted from the document")

        return extracted_data

    def extract_data_with_ai(self, input_data):
        """Constructs a prompt and calls the AI vision model to extract data."""
        prompt = """
            You are an expert data extraction system for official documents. 
        Analyze the provided image of a permit or license and extract the following fields. 
        Respond ONLY with a single, clean JSON object.
        The document may contain text formatted like a table with quotes and commas. You must parse this information correctly.

        1.  **license_type**: Identify the main title or type of the document. The document might be titled "Air Pollution License" or similar.
        2.  **license_no**: Find the primary identifier. Look for a label like "License#" or "Permit No.". The value might be inside quoted text, like `"APL16-000083\\n"`. Extract the clean number.
        3.  **issue_date**: Find the date of issue. This might be labeled as "Issue Date" or **"Invoice Date"**. Format it as YYYY-MM-DD. If not available, return null.
        4.  **expiry_date**: Find the expiration date. This is mandatory. Look for "Expiration Date" or "Valid Until". Format it as YYYY-MM-DD.
        5.  **issued_by**: Identify the issuing authority, which is usually at the top of the document (e.g., "CITY OF PHILADELPHIA DEPARTMENT OF PUBLIC HEALTH").

        Example JSON Response:
        {
          "license_type": "Air Pollution License",
          "license_no": "APL16-000083",
          "issue_date": "2021-10-01",
          "expiry_date": "2021-10-31",
          "issued_by": "CITY OF PHILADELPHIA DEPARTMENT OF PUBLIC HEALTH"
        }
        """

        try:
            logger.info("Calling OpenAI API for data extraction")

            enhanced_prompt = self.EXTRACTION_PROMPT 

            if isinstance(input_data, dict) and input_data.get("type") == "pdf_text":
                text_content = input_data.get("text", "")
                text_prompt = enhanced_prompt + "\n\nDOCUMENT TEXT:\n" + text_content[:4000]

                response = self.client.chat.completions.create(
                    model="gpt-4.1",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a JSON data extraction system. Return ONLY valid JSON, no other text."
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

            else:
                base64_image = input_data

                response = self.client.chat.completions.create(
                    model="gpt-4-vision-preview",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a JSON data extraction system. Return ONLY valid JSON, no other text."
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": enhanced_prompt
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

            content = response.choices[0].message.content.strip()
            logger.info(f"Raw AI response: {content[:200]}...")

            cleaned_content = self.clean_json_response(content)
            logger.info(f"Cleaned response: {cleaned_content[:200]}...")

            extracted_data = self.validate_and_parse_json(cleaned_content)

            logger.info(f"Successfully extracted data: {extracted_data}")
            return extracted_data

        except Exception as e:
            logger.error(f"Error in AI extraction: {str(e)}", exc_info=True)
            raise ValueError(f"AI extraction failed: {str(e)}")

    def extract_from_file(self, uploaded_file):
        """
        Complete extraction pipeline: convert file to image/text and extract data

        Args:
            uploaded_file: Django UploadedFile object

        Returns:
            dict: Extracted permit data
        """
        input_data = self.file_to_base64_image(uploaded_file)

        extracted_data = self.extract_data_with_ai(input_data)

        return extracted_data
