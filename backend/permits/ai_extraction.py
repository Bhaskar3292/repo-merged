"""
AI-powered document extraction for permits using OpenAI API
"""
import base64
import json
import logging
from io import BytesIO
from PIL import Image
import PyPDF2  # Added PyPDF2 import
import openai
from django.conf import settings

logger = logging.getLogger(__name__)


class PermitDataExtractor:
    """
    Handles AI-powered data extraction from permit documents using OpenAI API
    Supports both PDF text extraction and image analysis
    """

    EXTRACTION_PROMPT = """You are an expert data extraction system for official documents.
Analyze the provided image of a permit or license and extract the following fields.
Respond ONLY with a single, clean JSON object.

1.  **license_type**: Identify the main title or type of the document (e.g., "Operating Permit", "Tobacco License").
2.  **license_no**: Find the primary identifier, labeled as "License #", "Permit No.", etc.
3.  **issue_date**: Find the date of issue. Format it as YYYY-MM-DD. If not available, return null.
4.  **expiry_date**: Find the expiration date. Format it as YYYY-MM-DD. This is a mandatory field.
5.  **issued_by**: Identify the issuing authority or department.

Example JSON Response:
{
  "license_type": "Air Pollution License",
  "license_no": "APL16-000083",
  "issue_date": "2021-10-01",
  "expiry_date": "2021-10-31",
  "issued_by": "CITY OF PHILADELPHIA DEPARTMENT OF PUBLIC HEALTH"
}"""

    def __init__(self, api_key=None):
        """
        Initialize the extractor with OpenAI API key

        Args:
            api_key: OpenAI API key. If not provided, uses settings.OPENAI_API_KEY
        """
        self.api_key = api_key or getattr(settings, 'OPENAI_API_KEY', None)
        if not self.api_key:
            raise ValueError("OpenAI API key not configured. Set OPENAI_API_KEY in settings.")

        openai.api_key = self.api_key

    def file_to_base64_image(self, uploaded_file):
        """
        Convert uploaded file to base64 encoded image string or extract text from PDF
        
        For PDF files: Extract text using PyPDF2 and return as text data
        For image files: Convert to base64 as before

        Args:
            uploaded_file: Django UploadedFile object

        Returns:
            str or dict: Base64 encoded image string for images, or text dictionary for PDFs
        """
        try:
            file_extension = uploaded_file.name.lower().split('.')[-1]

            if file_extension == 'pdf':
                logger.info(f"Processing PDF file: {uploaded_file.name}")

                # Read PDF and extract text using PyPDF2
                pdf_bytes = uploaded_file.read()
                pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
                
                # Extract text from all pages
                text_content = ""
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    text = page.extract_text()
                    if text:
                        text_content += f"--- Page {page_num} ---\n{text}\n\n"
                
                logger.info(f"Successfully extracted text from PDF with {len(pdf_reader.pages)} pages")
                
                # Return as dictionary to indicate text mode
                return {
                    "type": "pdf_text",
                    "text": text_content,
                    "page_count": len(pdf_reader.pages)
                }

            elif file_extension in ['jpg', 'jpeg', 'png']:
                logger.info(f"Processing image file: {uploaded_file.name}")

                # Keep existing image processing logic
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
            logger.error(f"Error converting file: {str(e)}")
            raise

    def extract_data_with_ai(self, input_data):
        """
        Extract permit data from base64 image or PDF text using OpenAI
        
        Args:
            input_data: Can be base64 image string or dictionary with text data

        Returns:
            dict: Extracted permit data
        """
        try:
            logger.info("Calling OpenAI API for data extraction")
            
            # Determine if input is image (base64) or PDF text
            if isinstance(input_data, dict) and input_data.get("type") == "pdf_text":
                # Use text-based extraction for PDFs
                text_content = input_data.get("text", "")
                
                # Modify prompt for text extraction
                text_prompt = self.EXTRACTION_PROMPT + "\n\nExtract information from the following document text:\n" + text_content[:4000]  # Limit text length
                
                response = openai.ChatCompletion.create(
                    model="gpt-4",  # Use regular GPT-4 for text
                    messages=[
                        {
                            "role": "user", 
                            "content": text_prompt
                        }
                    ],
                    max_tokens=500,
                    temperature=0.0
                )
                
            else:
                # Use vision API for images (existing logic)
                base64_image = input_data
                
                response = openai.ChatCompletion.create(
                    model="gpt-4-vision-preview",
                    messages=[
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

            content = response.choices[0].message.content.strip()
            logger.info(f"Received response from OpenAI: {content}")

            # Clean JSON response
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()

            extracted_data = json.loads(content)

            # Ensure required fields
            required_fields = ['license_type', 'license_no', 'expiry_date', 'issued_by']
            for field in required_fields:
                if field not in extracted_data:
                    logger.warning(f"Missing required field: {field}")
                    extracted_data[field] = None

            if 'issue_date' not in extracted_data:
                extracted_data['issue_date'] = None

            logger.info(f"Successfully extracted data: {extracted_data}")
            return extracted_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from AI response: {str(e)}")
            raise ValueError(f"Invalid JSON response from AI: {str(e)}")
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            raise

    def extract_from_file(self, uploaded_file):
        """
        Complete extraction pipeline supporting both PDFs and images
        
        Args:
            uploaded_file: Django UploadedFile object

        Returns:
            dict: Extracted permit data
        """
        processed_data = self.file_to_base64_image(uploaded_file)
        extracted_data = self.extract_data_with_ai(processed_data)
        return extracted_data