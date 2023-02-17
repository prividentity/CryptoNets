import base64
import json
import re
import traceback
from io import BytesIO

import functions_framework
import numpy as np
import requests
from PIL import Image
from cryptonets_python_sdk.settings.configuration import ConfigObject, PARAMETERS
from cryptonets_python_sdk.settings.cacheType import CacheType
from cryptonets_python_sdk.factor import FaceFactor
from cryptonets_python_sdk.settings.loggingLevel import LoggingLevel


@functions_framework.http
def estimate_age(request):
    # Set CORS headers for the preflight request
    if request.method == 'OPTIONS':
        # Allows GET requests from any origin with the Content-Type
        # header and caches preflight response for an 3600s
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }

        return ('', 204, headers)

    # Set CORS headers for the main request
    headers = {
        'Access-Control-Allow-Origin': '*'
    }
    try:
        if request.get_json(silent=True):
            request_json = request.get_json(silent=True)
        elif request.data:
            request_json = json.loads(request.data)
        else:
            return (json.dumps({
                "status ": -1,
                "message ": "Invalid Payload"}), 500, headers)
    except Exception as e:
        print('Error:{} '.format(e))
        return (json.dumps({
            "status ": -1,
            "message ": "Something went wrong while parsing the payload"}), 500, headers)
    if not request_json.get('api_key', None):
        print("Invalid Payload: api_key not found")

        return (json.dumps({
            "status ": -1,
            "message ": "Invalid Payload: api_key not found"}), 500, headers)

    if not request_json.get('image_b64', None):
        print("Invalid Payload: image_b64 not found")
        return (json.dumps({
            "status ": -1,
            "message ": "Invalid Payload: image_b64 not found"}), 500, headers)

    print('api_key:{} \n \n image_b64 : {}!'.format(request_json['api_key'], request_json['image_b64']))

    try:
        image_data_b64 = re.sub('^data:image/.+;base64,', '', request_json.get('image_b64', None))
        image_data = np.array(Image.open(BytesIO(base64.b64decode(image_data_b64))).convert('RGB'))
    except Exception as e:
        print('Error:{} '.format(e))
        return (json.dumps({
            "status ": -1,
            "message ": "Invalid Image : Something went wrong while reading the image"}), 500, headers)
    try:
        server_url = "https://api.cryptonets.ai/node/"
        api_key = request_json.get('api_key', None)
        response = requests.request("POST", server_url + "api-key/checkApiKeyValid",
                                    headers={'Content-Type': 'application/json'},
                                    data=json.dumps({"api_key": api_key
                                                     }))
        if response.json().get('status', -1) != 0:
            return (json.dumps({"status ": -1,
                                "message ": "Invalid Apikey",
                                "faces": []}), 200, headers)
        
        config_object = ConfigObject(config_param={
                      PARAMETERS.ESTIMATE_AGE_RESERVATION_CALLS: 1
                      })
        
        face_factor = FaceFactor(server_url=server_url, api_key=api_key,logging_level=LoggingLevel.off, config=config_object, cache_type=CacheType.OFF)
        age_handle = face_factor.estimate_age(image_data=image_data)
        response = []

        for index, face in enumerate(age_handle.face_objects):
            face = {"return_code": face.return_code, "message": face.message, "age": face.age,
                    "BBox_top_left": face.bounding_box.top_left_coordinate.__str__(),
                    "BBox_bottom_right": face.bounding_box.bottom_right_coordinate.__str__()}
            response.append(face)

        if not len(response):
            return (json.dumps({"status ": -1,
                                "message ": "Invalid Apikey or no face found",
                                "faces": response}), 200, headers)
        else:
            return (json.dumps({"status ": 0,
                                "message ": "Ok",
                                "faces": response}), 200, headers)
    except Exception as e:
        print('Error:{} '.format(e))
        print(traceback.format_exc())
        return (json.dumps({
            "status ": -1,
            "message ": "Something went wrong"}), 500, headers)
