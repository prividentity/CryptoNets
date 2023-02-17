
# CryptoNets AgeEstimate Google cloud function

The estimate_age method accepts a frontal base64 facial image and apiKey, checks the image to determine if a valid facial biometric that conforms to the specified restriction(s) are present in the image, and returns the age estimate [0-100] plus bounding box, or useful error code(s).


Head tilt (left to right): -22.5 to 22.5 degrees \
Uncontrolled pose, but not full profile\
Recommended minimum face: 224 x 224 pixels, smaller facial images may reduce accuracy but will not result in false positives \
Face cropping: It is best to provide the original image to isValid without preprocessing. If using a cropped image as input, use as much padding around the head as possible, perhaps using an ISO 19794-5/INCITS 385-2004 (S2019) Face Portrait compliant image or similar.


## Deployment

### Prerequisites

Install google cloud sdk cli if it is not present in the system and integrate with the google acccount

For detailed instructions, please clink on this link [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

### Step 1: Clone the project

```bash

git clone git@github.com:prividentity/CryptoNets.git
cd age_google_cloud_function

```

### Step 2: Deploy the function

To deploy this project in google cloud function run

```bash
gcloud functions deploy <function_name> \
--region=us-central1 \
--runtime=python310 \
--entry-point=estimate_age \
--trigger-http
```

This will deploy the function in the google cloud and will give an API Endpoint URL for triggering the function

## API Reference

#### Get AGE

```http
  POST <API_URL>
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `api_key` | `string` | **Required**. Your API key |
| `image_b64`| `string` | **Required**. Base_64 facial image |





```javascript
Payload :  { "api_key" : <API_KEY>,  "image_b64" :  <BASE64_Image>}

Response :  {
  "status " : 0 or -1, //0 for success and -1 for failure  
  "message” : “OK” or error message,
  "faces":  list of face json
 }

```
```
Sample Response : 
{  
  "status ": 0, 
  "message ": "Ok",
  "faces": 
  [
    {
      "return_code": 0,
     "message": "ValidBiometric",
     "age": 9.578746795654297,
     "BBox_top_left": "Point(298.0,465.0)",
     "BBox_bottom_right": "Point(554.0,739.0)"
    },
    {
      "return_code": 0,
      "message": "ValidBiometric",
      "age": 11.385629653930664,
      "BBox_top_left": "Point(699.0,334.0)",
      "BBox_bottom_right": "Point(949.0,590.0)"
    }
  ]
}

```



## Documentation

To know more about the response and error code, below documentation gives a detailed interpretation of the response object

[Face json documentation](https://docs.private.id/cryptonets-python-sdk/ResultObjects/FaceObjectResult.html#cryptonets_python_sdk.helper.result_objects.faceObjectResult.FaceObjectResult)

