const express = require('express');
const { createClient } = require('@supabase/supabase-js');
var cors = require('cors');
const e = require('express');
const port = 3000;

const app = express();

app.use(cors());
app.use(express.json())

const supabase = createClient('https://pcigndwhwjwwwjjpkbpp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaWduZHdod2p3d3dqanBrYnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA2NDY1MDgsImV4cCI6MjAxNjIyMjUwOH0.KN06Ol7xSqTj1ImnmEQ5Vcoww4Tu_2_1zHStznTTnWk');

app.get('/', (req, res) => {
  res.send('Hello World');
});

// GET request to retrieve user information from Supabase via ID
app.get('/user/:id', async (req, res) => {
    // get the user id from route
    const id = req.params.id;
    const {data, error} = await supabase
        .from('users')
        .select()
        .eq('id', id)
    res.send(data);

});

// POST request to add a new user to Supabase
app.post('/user', async (req, res) => {
    data = req.body
    const { error } = await supabase
      .from('users')
      .insert({ id: data.id, firstName: data.firstName, lastName: data.lastName, emailAddress: data.primaryEmailAddress.emailAddress, imageUrl: data.imageUrl,})
      if (error) {
        res.send({ message: error });
      } else {
        res.send({ message: "User created successfully" });
      }

});     

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});