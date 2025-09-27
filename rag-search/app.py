import os
import json
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from google import genai
from serpapi import GoogleSearch
from flask_cors import CORS
load_dotenv()
app = Flask(__name__)
CORS(app)

API_KEY=os.getenv('GOOGLE_API_KEY')
ASI_KEY=os.getenv('AGENTVERSE_API_KEY')
SERP_API=os.getenv('GOOGLE_SERP_API')

response_format = {
    "type": "json_schema",
    "json_schema": {
        "name": "data_extraction_summary",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "cleaned": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "A simplified, clean version of the source URL"},
                        "metadata": {"type": "string", "description": "Cleaned and summarized metadata from the source"},
                        "timestamp": {"type": ["number", "null"], "description": "UNIX timestamp of the content, or null if not available"},
                        "getGeolocation": {
                            "type": "object",
                            "properties": {
                                "ok": {"type": "boolean", "description": "True if geolocation data was successfully found"},
                                "latitude": {"type": "number", "description": "The latitude coordinate"},
                                "longitude": {"type": "number", "description": "The longitude coordinate"}
                            },
                            "required": ["ok", "latitude", "longitude"]
                        }
                    },
                    "required": ["url", "metadata", "timestamp", "getGeolocation"]
                },
                "context": {
                    "type": "string",
                    "description": "A detailed summary of the content for contextual understanding"
                }
            },
            "required": ["cleaned", "context"]
        }
    }
}


## METHODS
def filter_products(products, top_k=5):
    """
    Filter product data to keep only selected fields and return top_k products.

    Args:
        products (list): List of product dictionaries
        top_k (int): Number of top products to keep based on "position"

    Returns:
        tuple: (filtered_list, filtered_dict)
            - filtered_list: list of product dicts with required fields
            - filtered_dict: dict with "position" as key and product dict as value
    """
    
    # Sort by position and take top_k
    products_sorted = sorted(products, key=lambda x: x["position"])[:top_k]
    
    # Select only required fields
    required_fields = ["position", "title", "link_clean", "rating", "reviews", "price"]
    
    filtered_list = []
    filtered_dict = {}
    
    for p in products_sorted:
        filtered = {field: p.get(field) for field in required_fields}
        filtered_list.append(filtered)
        filtered_dict[str(p["position"])] = filtered
    
    return filtered_list, filtered_dict


def get_products_details(query, num_products=10):

    params = {
        "api_key": SERP_API,
        "engine": "amazon",
        "k": query,
        "language": "amazon.in|en_IN",
        "amazon_domain": "amazon.in",
        "shipping_location": "IN",
        "s": "exact-aware-popularity-rank"
    }

    search = GoogleSearch(params)
    results = search.get_dict()
    products = results['organic_results']

    filtered_list, filtered_dict = filter_products(products, top_k=num_products)
    return products, filtered_list, filtered_dict
    print(f"---- SEARCH RESULTS -----\n{results}")
    return [
        {
            "position": i + 1,
            "title": f"Sample Product {i + 1}",
            "link_clean": f"https://www.example.com/product/{i + 1}",
            "rating": round(3.0 + i * 0.1, 1),
            "reviews": 100 + i * 10,
            "price": f"${10 + i * 5}.00"
        }
        for i in range(num_products)
    ]

def get_google_embeddings(data):
    """Clean and summarize the data using Gemini"""
    client = genai.Client(api_key=API_KEY)
    prompt = """
    Analyze this JSON data and do the following:
    1. Create a cleaned version with sensitive/redundant data removed
       - Keep the same structure (url, metadata, timestamp, getGeolocation)
       - Remove query parameters and tracking IDs from URLs
       - Keep only essential product information
       
    2. Write a brief but detailed summary describing what this data represents
       - Include product type, category, and key features, or video type for youtube
       - This can have data from any category so give accordingly
       - Inference from the website url in very short
       - Make it descriptive for meaningful embeddings
    
    Format your response strictly as valid JSON like this:
    {
        "cleaned": {
            "url": "simplified-url",
            "metadata": "cleaned-metadata",
            "timestamp": null,
            "getGeolocation": null
        },
        "context": "your detailed summary here"
    }

    Input Data: """ + str(data)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        result = eval(response.text)  # Convert the JSON-formatted string to dict
        return result["cleaned"], result["context"]
    except Exception as e:
        print(f"Error in get_google_embeddings: {str(e)}")
        return None, str(e)
    except Exception as e:
        return None, str(e)

def chat_asi(text: str):
    """
    Uses ASI Chat Completions to process text.

    Analyze this JSON data and do the following:
    1. Create a cleaned version with sensitive/redundant data removed
       - Keep the same structure (url, metadata, timestamp, getGeolocation)
       - Remove query parameters and tracking IDs from URLs
       - Keep only essential product information
       
    2. Write a brief but detailed summary describing what this data represents
       - Include product type, category, and key features
       - Make it descriptive for meaningful embeddings
    
    Format your response strictly as valid JSON like this:
    {
        "cleaned": {
            "url": "simplified-url",
            "metadata": "cleaned-metadata",
            "timestamp": null,
            "getGeolocation": null
        },
        "context": "your detailed summary here"
    }

    Input Data: 
    """
    url = "https://api.asi1.ai/v1/chat/completions"

    headers = {
    "Authorization": f"Bearer {os.getenv('ASI_ONE_API_KEY')}",
    "Content-Type": "application/json"
    }
    messages = [{"role": "user", "content": "Hello! How can you help me today?"}]
    body = {
    "model": "asi1-mini",
    "messages": messages
    }

def chat(message: str, system_prompt: str, model_name: str, response_format: dict = { "type":"json_schema","json_schema":{"message":""}}) -> str:

    # Validate input parameters
    if not message or not isinstance(message, str):
        raise ValueError("Message must be a non-empty string")
    if not system_prompt or not isinstance(system_prompt, str):
        raise ValueError("System prompt must be a non-empty string")
    if not model_name or not isinstance(model_name, str):
        raise ValueError("Model name must be a non-empty string")
    if not ASI_KEY:
        raise ValueError("ASI_KEY environment variable is not set")

    url = "https://api.asi1.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {ASI_KEY}",
        "Content-Type": "application/json"
    }

    body = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ],
        "response_format": response_format
    }

    try:
        response = requests.post(url, headers=headers, json=body, timeout=30)  # Add timeout
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
        
        response_data = response.json()
        
        # Validate response structure
        if "choices" not in response_data or not response_data["choices"]:
            raise KeyError("No choices in response")
        if "message" not in response_data["choices"][0]:
            raise KeyError("No message in first choice")
        if "content" not in response_data["choices"][0]["message"]:
            raise KeyError("No content in message")

        print(f"RESPONSE DATA: \n {response_data}")
        return response_data["choices"][0]["message"]["content"]

    except requests.exceptions.Timeout:
        raise requests.exceptions.RequestException("Request timed out after 30 seconds")
    except requests.exceptions.RequestException as e:
        raise requests.exceptions.RequestException(f"API request failed: {str(e)}")
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(f"Invalid JSON response from API: {str(e)}", e.doc, e.pos)
    except (KeyError, IndexError) as e:
        raise KeyError(f"Unexpected response structure: {str(e)}")
    except Exception as e:
        raise Exception(f"Unexpected error in chat function: {str(e)}")

def make_embeddings(text):
    """Generate embeddings for a single text string"""
    try:
        client = genai.Client(api_key=API_KEY)
        result = client.models.embed_content(
            model="gemini-embedding-001",
            contents=[text]  # API expects a list
        )
        return result.embeddings[0].values if result.embeddings else []
    except Exception as e:
        print(f"Error in make_embeddings: {str(e)}")
        return []

def hello():
    system_prompt="you are an helphul assistant"
    message="hello"
    url = "https://api.asi1.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {ASI_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": 'asi1-mini',
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]
    }
    response = requests.post(url, headers=headers, json=body)
    return response.json()

## FLASK ROUTES
@app.route('/')
def home():
    return jsonify({"message": "Welcome to the RAG server!"})

@app.route('/hi')
def hi():
    res = hello()
    print(f"Response: \n\n {res}")
    return res

@app.route('/clean', methods=['POST'])
def clean():
    try:
        # Get input data from request
        print("Hi")
        input_data = request.get_json()
        if not input_data:
            return jsonify({
                "error": "No input data provided",
                "status": "error"
            }), 400

        # Validate input data structure
        required_fields = ["url", "metadata"]
        missing_fields = [field for field in required_fields if field not in input_data]
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "status": "error"
            }), 400

        system = """You are a formatting agent and cleaning agents removes any unwanted details/token from the given Url data/
data but keeps the structure intact. VERY IMPORTANT!!! Return ONLY valid JSON matching the provided schema.
Analyze this JSON data and do the following:
1. Create a cleaned version with sensitive/redundant data removed
    - Keep the same structure (url, metadata, timestamp, getGeolocation)
    - Remove query parameters and tracking IDs from URLs
    - Keep only essential product information
    
2. Write a brief but detailed summary describing what this data represents
    - Include product type, category, and key features
    - Make it descriptive for meaningful embeddings

Format your response strictly as valid JSON like this:
{
    "cleaned": {
        "url": "simplified-url",
        "metadata": "cleaned-metadata",
        "timestamp": number,
        "getGeolocation": {
            "ok": true,
            "latitude": 28.6542 (do not change it),
            "longitude":77.2373 (do not change it)
        } or null if not available.
    },
    "context": "your detailed summary here"
}

You are a JSON-only generator.  
Always return **valid, strict JSON** with double quotes for keys and string values.  

DO NOT USE singles quotes of double doute in the context or cleaned sections.
DO NOT add ```json ``` like this. Preserve the timestamp number also
        """

        # Format and send message to chat
        print("Hi")
        message = "format this data: " + json.dumps(input_data)
        print(f"PROMPT:{message}")
        response = chat(message, system, 'asi1-mini', response_format)
        print('mew')
        print(type(response))
        try:
            print(f"RESPONSE: \n {response}")
            cleaned_data = json.loads(response)
            print(f"CLEANED DATA : \n {cleaned_data}")
        except json.JSONDecodeError as e:
            return jsonify({
                "error": "Invalid JSON response from model",
                "details": f"{str(e)} \n \n Response was: {response}",
                "status": "error"
            }), 500
        
        embedding_vector = make_embeddings(cleaned_data['context'])
        print(embedding_vector)
        
        final_response = {
            "cleaned": cleaned_data['cleaned'],
            "context": cleaned_data['context'],
            "embedding": embedding_vector
        }
        # return jsonify(final_response),200
        # Validate response is valid JSON
        
        print(f"FINAL : \n {final_response}")
        # Validate response structure
        if not isinstance(cleaned_data, dict) or "cleaned" not in cleaned_data or "context" not in cleaned_data:
            return jsonify({
                "error": "Invalid response structure from model",
                "status": "error"
            }), 500

        return jsonify({
            "data": final_response,
            "status": "success"
        }), 200

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "API request failed",
            "details": str(e),
            "status": "error"
        }), 503
    
    except Exception as e:
        print(f"Unexpected error in /clean endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e),
            "status": "error"
        }), 500

@app.route('/embedding', methods=['POST'])
def embedding():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "error": "No data provided"
            }), 400

        text = data.get("text", "")
        embedding_vector = make_embeddings(text)
        if not embedding_vector:
            return jsonify({
                "error": "Failed to generate embeddings"
            }), 500

        return jsonify({
            "embedding": embedding_vector
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/search_test', methods=['POST'])
def search_test():
    data = [
    {
        "position": 1,
        "asin": "B0DXF6NJ36",
        "title": "Fighter Jet Combat Simulator: Jet Force Elite",
        "link": "https://www.amazon.com.au/Jet-Force-Elite-Combat-Simulator/dp/B0DXF6NJ36/ref=sr_1_1?dib=eyJ2IjoiMSJ9.l1FyuUKzq-862K5K3IH5OADJdyDN3m7hvVQib9vsIjLlXoCkcjxV57Sx4kD_fLBz-mGvDEArkT03k5qv9g-VUgAzL8zqLNsTfeUQhEAs_UbR3j7gWuSvf4wq4pGBWsoGiA5v7iINGmqWvckgbgf6hAzQ47a-jEsPU27aGOT48VJIkk46xys-_KPWAEey1yM2qrdkbBGc4wtWkRgPuagPyQhFMQ-rExZidg8v78_aDHhiKPYllksFwrLeXsDnkBqg6j5Sl7AQ3MVAJJLSVTweNKlzq2f53Vj_E2JcJHDCSBI.Cy2SonE38q1hYL-knq-EKm6GR2cSVPhljxRBqfXVZpY&dib_tag=se&keywords=jet+air+plane&qid=1759006852&sr=8-1",
        "link_clean": "https://www.amazon.com.au/Jet-Force-Elite-Combat-Simulator/dp/B0DXF6NJ36/",
        "thumbnail": "https://m.media-amazon.com/images/I/81sc66B98TL._AC_UL320_.png",
        "rating": 3.9,
        "reviews": 198,
        "price": "$0.00",
        "extracted_price": 0,
        "offers":
        [
            "Get",
            "$5.00",
            "off",
            "$100.00",
            "with Visa."
        ]
        ,
        "delivery":
        [
            "Available for download now"
        ]
    }
    ,
    {
        "position": 2,
        "asin": "B0CSL76DCC",
        "options": "See options",
        "options_link": "https://www.amazon.com.au/Amagogo-High-Speed-Remote-Control-Beginners/dp/B0CSL76DCC/ref=sr_1_2_so_NON_RIDING_TOY_VEHICLE?dib=eyJ2IjoiMSJ9.l1FyuUKzq-862K5K3IH5OADJdyDN3m7hvVQib9vsIjLlXoCkcjxV57Sx4kD_fLBz-mGvDEArkT03k5qv9g-VUgAzL8zqLNsTfeUQhEAs_UbR3j7gWuSvf4wq4pGBWsoGiA5v7iINGmqWvckgbgf6hAzQ47a-jEsPU27aGOT48VJIkk46xys-_KPWAEey1yM2qrdkbBGc4wtWkRgPuagPyQhFMQ-rExZidg8v78_aDHhiKPYllksFwrLeXsDnkBqg6j5Sl7AQ3MVAJJLSVTweNKlzq2f53Vj_E2JcJHDCSBI.Cy2SonE38q1hYL-knq-EKm6GR2cSVPhljxRBqfXVZpY&dib_tag=se&keywords=jet+air+plane&qid=1759006852&sr=8-2",
        "title": "Amagogo High-Speed 2CH Remote Control RC Plane for Beginners - Blue, 25x21cm (b320-red)",
        "link": "https://www.amazon.com.au/Amagogo-High-Speed-Remote-Control-Beginners/dp/B0CSL76DCC/ref=sr_1_2?dib=eyJ2IjoiMSJ9.l1FyuUKzq-862K5K3IH5OADJdyDN3m7hvVQib9vsIjLlXoCkcjxV57Sx4kD_fLBz-mGvDEArkT03k5qv9g-VUgAzL8zqLNsTfeUQhEAs_UbR3j7gWuSvf4wq4pGBWsoGiA5v7iINGmqWvckgbgf6hAzQ47a-jEsPU27aGOT48VJIkk46xys-_KPWAEey1yM2qrdkbBGc4wtWkRgPuagPyQhFMQ-rExZidg8v78_aDHhiKPYllksFwrLeXsDnkBqg6j5Sl7AQ3MVAJJLSVTweNKlzq2f53Vj_E2JcJHDCSBI.Cy2SonE38q1hYL-knq-EKm6GR2cSVPhljxRBqfXVZpY&dib_tag=se&keywords=jet+air+plane&qid=1759006852&sr=8-2",
        "link_clean": "https://www.amazon.com.au/Amagogo-High-Speed-Remote-Control-Beginners/dp/B0CSL76DCC/",
        "thumbnail": "https://m.media-amazon.com/images/I/51XN1rMVOAL._AC_UL320_.jpg",
        "rating": 2.8,
        "reviews": 2,
        "more_buying_choices": "$30.09 (1 new offer)",
        "more_buying_choices_link": "https://www.amazon.com.au/gp/offer-listing/B0CSL76DCC/ref=sr_1_2_olp?keywords=jet+air+plane&dib_tag=se&dib=eyJ2IjoiMSJ9.l1FyuUKzq-862K5K3IH5OADJdyDN3m7hvVQib9vsIjLlXoCkcjxV57Sx4kD_fLBz-mGvDEArkT03k5qv9g-VUgAzL8zqLNsTfeUQhEAs_UbR3j7gWuSvf4wq4pGBWsoGiA5v7iINGmqWvckgbgf6hAzQ47a-jEsPU27aGOT48VJIkk46xys-_KPWAEey1yM2qrdkbBGc4wtWkRgPuagPyQhFMQ-rExZidg8v78_aDHhiKPYllksFwrLeXsDnkBqg6j5Sl7AQ3MVAJJLSVTweNKlzq2f53Vj_E2JcJHDCSBI.Cy2SonE38q1hYL-knq-EKm6GR2cSVPhljxRBqfXVZpY&qid=1759006852&sr=8-2",
        "age_rating": "3 years and up"
    }
    ,
    {
        "position": 3,
        "asin": "B0F48P7XQY",
        "options": "See options",
        "options_link": "https://www.amazon.com.au/Fighter-Power-Coloring-Adults-Teens/dp/B0F48P7XQY/ref=sr_1_3_so_ABIS_BOOK?dib=eyJ2IjoiMSJ9.l1FyuUKzq-862K5K3IH5OADJdyDN3m7hvVQib9vsIjLlXoCkcjxV57Sx4kD_fLBz-mGvDEArkT03k5qv9g-VUgAzL8zqLNsTfeUQhEAs_UbR3j7gWuSvf4wq4pGBWsoGiA5v7iINGmqWvckgbgf6hAzQ47a-jEsPU27aGOT48VJIkk46xys-_KPWAEey1yM2qrdkbBGc4wtWkRgPuagPyQhFMQ-rExZidg8v78_aDHhiKPYllksFwrLeXsDnkBqg6j5Sl7AQ3MVAJJLSVTweNKlzq2f53Vj_E2JcJHDCSBI.Cy2SonE38q1hYL-knq-EKm6GR2cSVPhljxRBqfXVZpY&dib_tag=se&keywords=jet+air+plane&qid=1759006852&sr=8-3",
        "title": "Fighter Jet Power Coloring Book for Adults and Teens: Fighter Aircrafts Coloring pages features 50+ detailed designs of high-speed jets and warplanes, ... and teens looking for relaxing creative fun.",
        "link": "https://www.amazon.com.au/Fighter-Power-Coloring-Adults-Teens/dp/B0F48P7XQY/ref=sr_1_3?dib=eyJ2IjoiMSJ9.l1FyuUKzq-862K5K3IH5OADJdyDN3m7hvVQib9vsIjLlXoCkcjxV57Sx4kD_fLBz-mGvDEArkT03k5qv9g-VUgAzL8zqLNsTfeUQhEAs_UbR3j7gWuSvf4wq4pGBWsoGiA5v7iINGmqWvckgbgf6hAzQ47a-jEsPU27aGOT48VJIkk46xys-_KPWAEey1yM2qrdkbBGc4wtWkRgPuagPyQhFMQ-rExZidg8v78_aDHhiKPYllksFwrLeXsDnkBqg6j5Sl7AQ3MVAJJLSVTweNKlzq2f53Vj_E2JcJHDCSBI.Cy2SonE38q1hYL-knq-EKm6GR2cSVPhljxRBqfXVZpY&dib_tag=se&keywords=jet+air+plane&qid=1759006852&sr=8-3",
        "link_clean": "https://www.amazon.com.au/Fighter-Power-Coloring-Adults-Teens/dp/B0F48P7XQY/",
        "thumbnail": "https://m.media-amazon.com/images/I/71u5iHO+XrL._AC_UL320_.jpg",
        "more_buying_choices": "$35.35 (1 new offer)",
        "more_buying_choices_link": "https://www.amazon.com.au/gp/offer-listing/B0F48P7XQY/ref=sr_1_3_olp?keywords=jet+air+plane&dib_tag=se&dib=eyJ2IjoiMSJ9.l1FyuUKzq-862K5K3IH5OADJdyDN3m7hvVQib9vsIjLlXoCkcjxV57Sx4kD_fLBz-mGvDEArkT03k5qv9g-VUgAzL8zqLNsTfeUQhEAs_UbR3j7gWuSvf4wq4pGBWsoGiA5v7iINGmqWvckgbgf6hAzQ47a-jEsPU27aGOT48VJIkk46xys-_KPWAEey1yM2qrdkbBGc4wtWkRgPuagPyQhFMQ-rExZidg8v78_aDHhiKPYllksFwrLeXsDnkBqg6j5Sl7AQ3MVAJJLSVTweNKlzq2f53Vj_E2JcJHDCSBI.Cy2SonE38q1hYL-knq-EKm6GR2cSVPhljxRBqfXVZpY&qid=1759006852&sr=8-3"
    }
    ,
    {
        "position": 4,
        "asin": "B00TEFXRW0",
        "title": "Spitfire Ace 1941-45: The Flying Career of Squadron Leader Tony Gaze DFC** RAF, an Australian who flew fighters with RAF fighter squadrons 1941-45. First Australian jet fighter pilot.",
        "link": "https://www.amazon.com.au/Spitfire-Ace-1941-45-Australian-squadrons-ebook/dp/B00TEFXRW0/ref=sr_1_4?dib=eyJ2IjoiMSJ9.l1FyuUKzq-862K5K3IH5OADJdyDN3m7hvVQib9vsIjLlXoCkcjxV57Sx4kD_fLBz-mGvDEArkT03k5qv9g-VUgAzL8zqLNsTfeUQhEAs_UbR3j7gWuSvf4wq4pGBWsoGiA5v7iINGmqWvckgbgf6hAzQ47a-jEsPU27aGOT48VJIkk46xys-_KPWAEey1yM2qrdkbBGc4wtWkRgPuagPyQhFMQ-rExZidg8v78_aDHhiKPYllksFwrLeXsDnkBqg6j5Sl7AQ3MVAJJLSVTweNKlzq2f53Vj_E2JcJHDCSBI.Cy2SonE38q1hYL-knq-EKm6GR2cSVPhljxRBqfXVZpY&dib_tag=se&keywords=jet+air+plane&qid=1759006852&sr=8-4",
        "link_clean": "https://www.amazon.com.au/Spitfire-Ace-1941-45-Australian-squadrons-ebook/dp/B00TEFXRW0/",
        "thumbnail": "https://m.media-amazon.com/images/I/81MozfvQdML._AC_UL320_.jpg",
        "rating": 4.2,
        "reviews": 22,
        "price": "$0.00",
        "extracted_price": 0,
        "offers":
        [
            "Get",
            "$5.00",
            "off",
            "$100.00",
            "with Visa.",
            "Free with Kindle Unlimited membership",
            "Or $3.93 to buy"
        ]
    }]
    return jsonify(data)

@app.route('/search', methods=['POST'])
def search():
    '''
    {
        search: "search term",
        context: [top K context chunk string]
    }
    '''
    # Make the Prompt for LLM with context
    context_entries = request.get_json().get("context", [])
    system="""
You are a search agent that finds the Best Product based on User Context, Search Term and List of Product and descriptions.
Given a search term and its corresponding product details and a list of context entries, identify and return the top K most relevant entries.

User will provide the data in the following format
[Context Text Chunk 1]
[Context Text Chunk 2]
...
[Context Text Chunk K]

[Search Query Statement]

[Product Details from Amazon 1]
[Product Details from Amazon 2]
...
[Product Details from Amazon N]

Return the top M most relevant context entries (use what products they like, what website they visit and what videos they have watched) that best match the search query and product details as per the response structure. Along with an AI message on why this is the best match from the past contexts. If the search query is very very wierd and not matching any of the context or product details, return Search didn't exactly match the queries here are similar products.

Example:
"Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube."
"Rozi Decoration Balloon Arch Garland Kit For Birthday/Anniverary/Bride to Be Decoration - Kit of 78 Pieces (Black, White Gold) : Amazon.in: Toys & Games"

Give me the top 3 products that best match [search query] and product details as per the response structure. Along with an AI message on why this is the best match from the past contexts. If the search query is very very wierd and not matching any of the context or product details, return Search didn't exactly match the queries here are similar products. this comes with the key "ai_message".DO NOT Mention Product IDS in the AI Message.

{}

response: will in json with the "position" of the most relevant products.

["1","5","7"] with the key as "index"(for this asumming that 5th 7th product were also there)
ai_messsage: You seem be intrested in this and this field [infer this from the context]. (write summary reasons for selections if there is anything unique which u can observe with respect to the context )
You are a JSON-only generator.  
Always return **valid, strict JSON** with double quotes for keys and string values.  


DO NOT USE singles quotes of double doute in the context or cleaned sections.
DO NOT add ```json ``` like this
""".format({
    "position": 1,
    "title": "Fighter Jet Combat Simulator: Jet Force Elite",
    "link_clean": "https://www.amazon.com.au/Jet-Force-Elite-Combat-Simulator/dp/B0DXF6NJ36/",
    "rating": 3.9,
    "reviews": 198,
    "price": "$0.00",
})

    query = request.get_json().get("search", "")
    num_best =10
    print("Running product search")
    product_details, filtered_list, filtered_dict = get_products_details(query, num_products=48)

    prompt="""
Here are the context vectors:
{}

Give me the top {} entries (Yes strictly give me this many indexes if u have more records than this) that best match [search query] and product details as per the response structure. Along with an AI message on why this is the best match from the past contexts. If the search query is very very wierd and not matching any of the context or product details, return Search didn't exactly match the queries here are similar products.

Here is the required product details:
{}
""".format(context_entries, num_best, filtered_list)
    
    search_response_template={
  "type": "json_schema",
  "json_schema": {
    "name": "number_list_with_message",
    "strict": "true",
    "schema": {
      "type": "object",
      "properties": {
        "index": {
          "type": "array",
          "items": {
            "type": "number",
            "description": "A numeric element of the array"
          },
          "description": "A list of numbers"
        },
        "ai_message": {
          "type": "string",
          "description": "A message from the AI describing or explaining the choice of products"
        }
      },
      "required": ["numbers", "ai_message"]
    }
  }
}

    response = chat(prompt, system, 'asi1-mini', search_response_template)
    try:
        res_dict = json.loads(response)
        index = res_dict['index']
        filtered = []
        for i in index:
            for item in product_details:
                print(f"item : {item['position']}")
                if int(item['position']) == int(i):
                    filtered.append(item) 
        return jsonify({
            "products": filtered,
            "ai_message": res_dict['ai_message']
        }), 200
    except json.JSONDecodeError as e:
        return jsonify({
            "error": "Invalid JSON response from model",
            "details": str(e),
            "response": response
        }), 500


if __name__ == '__main__':
    app.run(debug=True, port=9000)

