
# Share-A-Meal API 

[![Deploy to Heroku](https://github.com/chevyriet/programmeren-4-shareameal/actions/workflows/main.yml/badge.svg)](https://github.com/chevyriet/programmeren-4-shareameal/actions/workflows)
![GitHub repo size](https://img.shields.io/github/repo-size/chevyriet/programmeren-4-shareameal?label=Total%20Size)
![Github Language](https://img.shields.io/github/languages/top/chevyriet/programmeren-4-shareameal?color=informational)
![Github Issues](https://img.shields.io/github/issues/chevyriet/programmeren-4-shareameal?label=Issues&color=informational)
![Github Tests](https://img.shields.io/badge/Tests-100%25%20passed%2C%200%25%20failed-blue)

An API written primarily in [Node.js](https://nodejs.org/en/), deployed on [Heroku](https://dashboard.heroku.com/)


## Table of Contents

 - [About the API](#about-the-api)
    - [Author Information](#author-information)
    - [Used Frameworks/Libraries](#used-frameworks/libraries)
 - [Installation and Deployment](#installation-and-deployment)
    - [Running Locally](#running-locally)
 - [Functionality](#functionality)
    - [User](#user)
    - [Meal](#meal)
    - [Participate](#participate)


## About the API

The Share-A-Meal API is an API that could support an application by offering functionality like creating, sharing, editing and deleting meals, with users also being able to participate in these meals (and remove themselves) and make use of these [**'CRUD'**](https://nl.wikipedia.org/wiki/CRUD) functionalities.

Not only do the meals use these CRUD functionalities, the users do aswell (The API makes sure they only perform these CRUD functionalities on themselves).

Users are also able to login to their account after registering themselves, which gives them access to a big part of the functionality of the API. This is all made possible by using [jwt](https://jwt.io/introduction), who provide secure **jsonwebtokens**, handling a secure authentication.

#### [The Share-A-Meal API](https://chevy-shareameal-prog4.herokuapp.com/)

### Author Information
This API was made by Chevy Rietveld, 🔗my links: [![Github](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/chevyriet)

### Used Frameworks/Libraries
A list of frameworks/libraries that are used in this API, with a small description.

- [Node.js](https://nodejs.org/en/) *"An asynchronous event-driven JavaScript runtime"*
- [Express](https://expressjs.com/) *"Fast, unopinionated, minimalist web framework for Node.js"*
- [Mocha](https://mochajs.org/) *"A feature-rich JavaScript test framework running on Node.js and in the browser"*
- [Chai](https://www.chaijs.com/) *"A JavaScript BDD / TDD assertion library for node and the browser"*
- [Tracer](https://www.npmjs.com/package/tracer) *"A powerful and customizable logging library for node.js"*
- [Dotenv](https://www.npmjs.com/package/dotenv) *"Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env"*
- [Assert](https://www.npmjs.com/package/assert) *"The assert module from Node.js, for the browser."*
- [Nodemon](https://www.npmjs.com/package/nodemon) *"A tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected."*
- [Mysql2](https://www.npmjs.com/package/mysql2) *"A client for Node.js with focus on performance."*
- [jwt](https://jwt.io/introduction) *"JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object."*

## Installation and Deployment
To install the API: 

1. Download the code by either forking or cloning the [repository](https://github.com/chevyriet/programmeren-4-shareameal), or downloading the zip-file.

2. Install the required NPM packages:
```bash
  npm install
```

#### Running Locally
To run the API locally on your **LocalHost**:

1. Start your **MySql** server on [**XAMPP**](https://www.apachefriends.org/index.html)

2. Run the following command in your cmd while in the project directory:

```bash
  npm start
```


## Functionality
Listed below are the main functionalities the API offers, divided in **user**, **meal**, and **participation**, combined with an overview of their respective endpoints and the required [***json***](https://www.json.org/json-en.html) body that will need to be provided.

Remember adding your own personal URL in front of the endpoints specified in the tables.

Requests for endpoints that **require a user to be logged** in need to provide a valid **JWT / Bearer** Token in their **Authentication Header**, you can find this token at:

The response body after logging in. Copy the token and provide it in requests that need a logged in user.

```json
{
        ...
        "street": "TestStreet 31",
        "city": "TestCity",
        "token": "invalidtokenCI6MTY1NDI1stb5qo0RTR0Vc"
}
```

### User
|Request Type|Endpoints|Description
|---|---|---|
|POST| /api/user | Register a user 
|POST| /api/auth/login | Log an existing user in 
|GET| /api/user/profile | Get personal user profile
|GET| /api/user | Get all users
|GET| /api/user/{id} | Get a single user by ID
|PUT| /api/user/{id} | Update a user
|DELETE| /api/user/{id} | Delete a user

#### Register a user
```json
{
   "firstName": "string",
   "lastName": "string",
   "street": "string",
   "city": "string",
   "emailAdress": "string", //must be a valid email address 
   "password": "string", //Min 8 characters which contains at least one lower- & uppercase letter and one digit
}  
```

#### Login
User that is trying to get logged in must be an existing user.
```json
{
   "emailAdress": "string", //must be a valid email address 
   "password": "string", //Min 8 characters which contains at least one lower- & uppercase letter and one digit
}  
```

#### Request personal user profile
Requested profile must be one of a logged in user. JSON response will contain data of the requested user

```json
No JSON body required; Authorization Header must contain a Bearer Token
```

#### Get all users
This endpoint differentiates from the others as that it has an optional feature to include a search query. A user can search for other users based on **firstName**, and/or **isActive** by using this route: /api/user?{firstName}&{isActive}.

User requesting this endpoint must be logged in. JSON response will contain multiple user objects 
```json
No JSON body required; Authorization Header must contain a Bearer Token
```

#### Get a single user by ID
User requesting this endpoint must be logged in. JSON response will contain the user object of the specified user 
```json
No JSON body required; Authorization Header must contain a Bearer Token and url must contain user ID
```

#### Update a user
User requesting this endpoint must be logged in. Authorization Header must contain a Bearer Token and url must contain user ID
```json
{
   "firstName": "string",
   "lastName": "string",
   "street": "string",
   "city": "string",
   "phoneNumber": "string", //must be a valid dutch phonenumber
   "emailAdress": "string", //must be a valid email address 
   "password": "string", //Min 8 characters which contains at least one lower- & uppercase letter and one digit
} 
```

#### Delete a user
User requesting this endpoint must be logged in and be the owner of the user they are trying to delete.
```json
No JSON body required; Authorization Header must contain a Bearer Token and url must contain user ID
```

### Meal
|Request Type|Endpoints|Description
|---|---|---|
|POST| /api/meal | Register a meal
|GET| /api/meal | Get all meals
|GET| /api/meal/{id} | Get a single meal by ID
|PUT| /api/meal/{id} | Update a meal
|DELETE| /api/meal/{id} | Delete a meal

#### Register a meal
User requesting this endpoint must be logged in. Authorization Header must contain a Bearer Token
```json
{
   "name": "string",
   "description": "string",
   "isActive": "boolean",
   "isVega": "boolean",
   "isVegan": "boolean",
   "isToTakeHome": "boolean",
   "dateTime": "datetime",
   "imageUrl": "string",
   "allergenes": "string array",
   "price":"number"
}
```

#### Get all meals
JSON response will contain multiple meal objects
```json
No JSON body required.
```

#### Get a single meal by ID
JSON response will contain the user object of the specified meal
```json
No JSON body required; url must contain meal ID
```

#### Update a meal
User requesting this endpoint must be logged in. Authorization Header must contain a Bearer Token
```json
{
   "name": "string",
   "description": "string",
   "isActive": "boolean",
   "isVega": "boolean",
   "isVegan": "boolean",
   "isToTakeHome": "boolean",
   "dateTime": "datetime",
   "maxAmountOfParticipants": "number",
   "imageUrl": "string",
   "allergenes": "string array",
   "price":"number"
}
```

#### Delete a meal
User requesting this endpoint must be logged in and be the owner of the meal they are trying to delete.
```json
No JSON body required; Authorization Header must contain a Bearer Token and url must contain meal ID
```

### Participation
|Request Type|Endpoints|Description
|---|---|---|
|GET| /api/meal/{id}/participate | Participate (or remove participation) in a meal

#### Participate
This endpoint differentiates from the others as it provides 2 different services, depending on if the user requesting it is already participated in the provided meal or not.
If the user already is participated in the meal then the endpoint will remove their participation from that meal, if the user is not yet participated in the meal the endpoint will add one.

User requesting this endpoint must be logged in. JSON response will contain information on the status of the participation and the amount of current participants in a meal.
```json
No JSON body required; Authorization Header must contain a Bearer Token and url must contain meal ID
```














