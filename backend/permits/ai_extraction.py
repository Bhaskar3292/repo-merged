"""
AI-powered document extraction for permits using OpenAI Vision API
"""
import base64
import json
import logging
from io import BytesIO
from PIL import Image
from pdf2image import convert_from_bytes
import openai
from django.conf import settings

logger = logging.getLogger(__name__)


class PermitDataExtractor:
    """
    Handles AI-powered data extraction from permit documents using OpenAI Vision API
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
        Convert uploaded file to base64 encoded image string

        Handles both images and PDFs. For PDFs, converts the first page to JPEG.

        Args:
            uploaded_file: Django UploadedFile object

        Returns:
            str: Base64 encoded image string

        Raises:
            ValueError: If file type is not supported
            Exception: If file processing fails
        """
        try:
            file_extension = uploaded_file.name.lower().split('.')[-1]

            if file_extension == 'pdf':
                logger.info(f"Processing PDF file: {uploaded_file.name}")

                pdf_bytes = uploaded_file.read()

                images = convert_from_bytes(
                    pdf_bytes,
                    first_page=1,
                    last_page=1,
                    fmt='jpeg',
                    dpi=200
                )

                if not images:
                    raise ValueError("Failed to convert PDF to image")

                first_page = images[0]

                buffer = BytesIO()
                first_page.save(buffer, format='JPEG', quality=85)
                buffer.seek(0)

                base64_image = base64.b64encode(buffer.read()).decode('utf-8')

                logger.info(f"Successfully converted PDF to base64 image")
                return base64_image

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

    def extract_data_with_ai(self, base64_image):
        """
        Extract permit data from base64 image using OpenAI Vision API

        Args:
            base64_image: Base64 encoded image string

        Returns:
            dict: Extracted permit data with keys:
                - license_type (str)
                - license_no (str)
                - issue_date (str or None)
                - expiry_date (str)
                - issued_by (str)

        Raises:
            Exception: If API call fails or response is invalid
        """
        try:
            logger.info("Calling OpenAI Vision API for data extraction")

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

            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()

            extracted_data = json.loads(content)

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
        Complete extraction pipeline: convert file to image and extract data

        Args:
            uploaded_file: Django UploadedFile object

        Returns:
            dict: Extracted permit data

        Raises:
            Exception: If any step fails
        """
        base64_image = self.file_to_base64_image(uploaded_file)

        extracted_data = self.extract_data_with_ai(base64_image)

        return extracted_data
