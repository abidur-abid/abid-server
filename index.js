
/*======================================================================
                            this for accessing .env file
=======================================================================*/
require('dotenv').config();

/*======================================================================
                             basic set up
=======================================================================*/
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;


/*======================================================================
             this code is for json web token
=======================================================================*/
const jwt = require('jsonwebtoken');

/*======================================================================
             This is for stripe payment method
=======================================================================*/
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)

/*======================================================================
             middleware
=======================================================================*/
app.use(cors());
app.use(express.json());

//This middleware for verify user by token
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


/*======================================================================
             mongodb connection code from here
=======================================================================*/
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@cluster0.dhitodw.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

/*======================================================================
             here are all dataCollection of database
=======================================================================*/
    // const usersCollection = client.db("portfolio").collection("users");
    const usersCollection = client.db("portfolio").collection("users");
    const projectsCollection = client.db("portfolio").collection("projects");
    const blogsCollection = client.db("portfolio").collection("blogs");

    app.get('/', async(req, res) => {
        const info = 'Server is running';
        res.send(info)
    })

/*======================================================================
             Necessary Function for the users
=======================================================================*/
//To generate for token for the all users
app.post('/jwt', (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.USER_TOKEN, { expiresIn: '12h' })

  res.send({ token })
})

    //Function for the verify admin
    // Warning: use verifyJWT before using verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }



/*======================================================================
             Users related CRUD operation
=======================================================================*/
    // users related apis
    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // security layer: verifyJWT
    // email same
    // check admin
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })


/*======================================================================
             blogs related CRUD operation
=======================================================================*/

    //get api
    app.get('/blogs', async(req,res) => {
        const result = await blogsCollection.find().toArray();
        res.send(result)
    })

    //post api
    app.post('/blogs', async(req,res) => {
        const blog = req.body;
        const result = await blogsCollection.insertOne(blog);
        res.send(result)
    })

    //put api
    //put is used basically for the update previous data
    app.put('/put-route', async(req,res) => {
      const id = req.params.id;
      const user = req.body;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updateInfo = {
          $set: {
              name: user.name,
              description: user.description
          }
      };
      const result = await usersCollection.updateOne(filter,updateInfo,options);
      res.send(result);
  })

  //delete api
  app.delete('/delete-route', async(req,res) => {
      const id = req.params.id;
      //for the ObjectId you have to import ObjectId from mongodb (const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');)
      const filter = {_id: new ObjectId(id)};
      const result = await usersCollection.deleteOne(filter);
      res.send(result)
  })
/*======================================================================
             projects related CRUD operation
=======================================================================*/

    //get api
    app.get('/projects', async(req,res) => {
        const result = await projectsCollection.find().toArray();
        res.send(result)
    })

    //post api
    app.post('/projects', async(req,res) => {
        const project = req.body;
        const result = await projectsCollection.insertOne(project);
        res.send(result)
    })

    //put api
    //put is used basically for the update previous data
    app.put('/put-route', async(req,res) => {
        const id = req.params.id;
        const user = req.body;
        const filter = {_id: new ObjectId(id)};
        const options = {upsert: true};
        const updateInfo = {
            $set: {
                name: user.name,
                description: user.description
            }
        };
        const result = await usersCollection.updateOne(filter,updateInfo,options);
        res.send(result);
    })

    //delete api
    app.delete('/delete-route', async(req,res) => {
        const id = req.params.id;
        //for the ObjectId you have to import ObjectId from mongodb (const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');)
        const filter = {_id: new ObjectId(id)};
        const result = await usersCollection.deleteOne(filter);
        res.send(result)
    })

 /*======================================================================
             Payment related functionality
=======================================================================*/
    // create payment intent
    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

        // payment related api
        app.post('/payments', verifyJWT, async (req, res) => {
          const payment = req.body;
          const insertResult = await paymentCollection.insertOne(payment);
    
          const query = { _id: { $in: payment.cartItems.map(id => new ObjectId(id)) } }
          const deleteResult = await cartCollection.deleteMany(query)
    
          res.send({ insertResult, deleteResult });
        })
  /*=====================================================================
             total data collection for the admin dashboard route
=======================================================================*/
    app.get('/admin-stats', async(req,res) => {
        const users = await usersCollection.estimatedDocumentCount();
        const products = await menuCollection.estimatedDocumentCount();
        const orders = await cartCollection.estimatedDocumentCount();
        const payments = await paymentCollection.find().toArray();
        const revenue = payments.reduce((sum, payment) => sum + payment.price,0);
        res.send({revenue,users, products,users})
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


//server console
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})