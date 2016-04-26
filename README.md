JAY-NEDB
===================

Nedb wrapper for Single Page App relying on [Jay](https://github.com/jayJs/jay).  

**Instant Nedb back-end**  
Creates response from Nedb database for frontend requests for most common CORS functionality:
GET, POST, PUT, DELETE, also a custom query request.

**INSTALLATION**  
(Assuming you have npm installed)  
```
npm install jay-nedb  
```  
Create folder "public/uploads".  

**USAGE**  
Jay front end component calls "/api/j" for GET and POST (JSONP) calls.  
Jay-nedb helps to respond to these calls. This is an example of receiving and replying with an Express server.

```
var J = require('jay-nedb');

app.get('/api/j', function(req, res){
  J.get(req, res, config, function(data){
    res.jsonp(data);
  });
});
```  

**API**  
NB You should authenticate necessary request with PassportJs or your favorite authentication mechanism.  

**get**  
Retrieves data from Parse.com and returns as object.  
```
J.get(req, res, config, function(data){
  res.jsonp(data);
});
```
**post**  
Parses your formdata and saves it to Parse.com.
If files are added, they are separately uploaded to Parse and added to the object.  
Returns ObjectId.  
```
app.post('/api/j', function(req, res){
  J.post(req, res, config, function(data){
    res.jsonp(data);
  })
});
```

**put**  
Updates the post.  
Returns ObjectId.  
```
app.put('/api/j', function(req, res){
  J.put(req, res, config, function(data){
    res.jsonp(data);
  })
});
```

**delete**  
Deletes the post.  
Returns ObjectId.  
```
app.delete('/api/j', function(req, res){
  J.delete(req, res, config, function(data){
    res.jsonp(data);
  })
});
```

**query**  
Query for data.  
Front end comes with this: query(table, limit, key, value, order).  
```
app.get('/api/j/query', function(req, res){
  J.query(req, res, config, function(data){
    res.jsonp(data);
  });
});
```

**advanced functionality with Parse.com**  
Check out [Node-Jay](https://github.com/jayJs/node-jay) for advanced possibilities with Parse.com.  
Notice: Parse.com is being sunsetted.      

**Licence**  

The MIT License (MIT)  

Copyright (c) 2016 Martin Sookael  

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:  

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.  

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  
