const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb+srv://zpdoss:the23rdTeam@cop4331.kbakb.mongodb.net/?retryWrites=true&w=majority&appName=COP4331'
const client = new MongoClient(url);
client.connect();

app.post('/api/addcard', async (req, res, next) =>
{
  // incoming: userId, color
  // outgoing: error
  const { userId, card } = req.body;
  const newCard = {Card:card,UserID:userId};
  var error='';

  try
  {
    const db = client.db('COP4331LargeProject');
    const result = db.collection('Cards').insertOne(newCard);
  }
  catch(e)
  {
    error = e.toString();
  }

  var ret = {error:error};
  res.status(200).json(ret);
});

app.post('/api/register', async (req, res, next) =>
  {
      // incoming: firstName, lastName, email, login, password
      // outgoing: error
      const { firstName, lastName, email, login, password } = req.body;
      const newUser = {FirstName:firstName,LastName:lastName,Email:email,Login:login,Password:password};
      var error='';
  
      //connect to server
      const db = client.db('COP4331LargeProject');
  
      //check for duplicate login or email
      const duplicate = await db.collection('Users').findOne({
        $or: [{ Login: login }, { Email: email }]
      })
  
      //build error message
      if(duplicate!=null){
        let err = "User Already Exists. Match found in field: "//use let so it can be appended
          if (duplicate.Login===login)
          {
            err+="Login\n";
    
          }
          if (duplicate.Email===email)
          {
            err+="Email\n";
          }
          return res.status(400).json({error: err});
              
      }
    
      //add user
      try
      {
        const result = await db.collection('Users').insertOne(newUser);
      }
      catch(e)
      {
        error = e.toString();
      }
    
      var ret = {error:error};
      res.status(200).json(ret);
});

app.post('/api/login', async (req, res, next) =>
{
  // incoming: login, password
  // outgoing: id, firstName, lastName, error
  var error = '';

  const { login, password } = req.body;

  const db = client.db('COP4331LargeProject');
  const results = await db.collection('Users').find({
    Login:login,Password:password}).toArray();

  var id = -1;
  var fn = '';
  var ln = '';

  if( results.length > 0 )
  {
    id = results[0].UserId;
    fn = results[0].FirstName;
    ln = results[0].LastName;
  }

  var ret = { id:id, firstName:fn, lastName:ln, error:error};
  res.status(200).json(ret);
});

app.post('/api/searchcards', async (req, res, next) =>
{
  // incoming: userId, search
  // outgoing: results[], error
  var error = '';

  const { userId, search } = req.body;
  var _search = search.toLowerCase().trim();
  const db = client.db('COP4331LargeProject');
  const results = await db.collection('Cards').find(
    {"Card":{$regex:_search+'.*', $options:'i'}}).toArray();

  var _ret = [];
  for( var i=0; i<results.length; i++ )
  {
    _ret.push(results[i].Card);
  }

  var ret = {results:_ret, error:error};
  res.status(200).json(ret);
});

app.use((req, res, next) =>
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS'
  );
  next();
});

app.listen(5000); // start Node + Express server on port 5000
