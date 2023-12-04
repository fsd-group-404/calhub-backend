const express = require("express");
const { createClient } = require("@supabase/supabase-js");
var cors = require("cors");
const port = 3000;
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const supabase = createClient(
  "https://pcigndwhwjwwwjjpkbpp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaWduZHdod2p3d3dqanBrYnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA2NDY1MDgsImV4cCI6MjAxNjIyMjUwOH0.KN06Ol7xSqTj1ImnmEQ5Vcoww4Tu_2_1zHStznTTnWk"
);

app.get("/", (req, res) => {
  res.send("Hello World");
});

// GET request to retrieve a user's data from Supabase via ID
app.get("/users/:id", async (req, res) => {
  // get the user id from route
  const id = req.params.id;
  const { data, error } = await supabase.from("users").select().eq("id", id);
  res.send(data);
});

// POST request to add a new user to Supabase
app.post("/users", async (req, res) => {
  const data = req.body;
  console.log("User data receieved");
  console.log(data);
  const { error } = await supabase
    .from("users")
    .insert({
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: data.primaryEmailAddress.emailAddress,
      imageUrl: data.imageUrl,
    });
  if (error) {
    console.log("User not created")
    console.log(error)
    res.send({ message: error });
  } else {
    res.send({ message: "User created successfully" });
  }
});

// GET request to retrieve all groups from supabase
app.get("/groups", async (req, res) => {
  const { data, error } = await supabase.from("groups").select();
  res.send(data);
});
// GET request to retrieve all groups a user is in from supabase
app.get("/groups/curr", async (req, res) => {
  try {
      const userID = req.query.userID;

      // Fetch all groupIDs where the userID is present
      const { data: userGroups, error: userGroupsError } = await supabase
          .from('user-groups')
          .select('groupID')
          .eq('userID', userID);

      if (userGroupsError) {
          throw userGroupsError;
      }

      // Extract groupIDs
      const groupIDs = userGroups.map(ug => ug.groupID);

      // Fetch group information from the groups table
      const { data: groups, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIDs);

      if (groupsError) {
          throw groupsError;
      }

      res.send(groups);
  } catch (error) {
      console.error(error);
      res.status(500).send({ message: "An error occurred" });
  }
});

// GET request to retrieve all groups in which a user is NOT in from supabase
app.get("/groups/new", async (req, res) => {
  try {
    const userID = req.query.userID;

    // Fetch all unique groupIDs
    const { data: allGroups, error: allGroupsError } = await supabase
      .from('user-groups')
      .select('groupID', { count: 'exact' });

    if (allGroupsError) {
      throw allGroupsError;
    }

    let groupsNotIn = [];

    // For each group, check if the user is a part of it
    for (let group of allGroups) {
      const { data: userInGroup, error: userInGroupError } = await supabase
        .from('user-groups')
        .select('*')
        .eq('groupID', group.groupID)
        .eq('userID', userID);

      if (userInGroupError) {
        throw userInGroupError;
      }

      // If user is not in the group, add it to the list
      if (userInGroup.length === 0) {
        groupsNotIn.push(group.groupID);
      }
    }

    // Fetch group details for the groups the user is not in
    const { data: finalGroups, error: finalGroupsError } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupsNotIn);

    if (finalGroupsError) {
      throw finalGroupsError;
    }

    res.send(finalGroups);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "An error occurred" });
  }
});

// GET request to retrieve all members from a group
app.get("/groups/:groupID/members", async (req, res) => {
    const groupID = req.params.groupID;
    console.log(groupID)
    const { data, error } = await supabase
        .from('user-groups')
        .select('userID, users(*)')
        .eq('groupID', groupID);

    if (error) {
      console.log(error)
      return res.status(500).send({ message: error });
    }
    console.log(data)
    res.send(data);
});

// POST request to create a group as the owner
app.post("/groups", async (req, res) => {
  const body = req.body;
  const userID = body.userID;

  // Create group in groups table
  const { data, error } = await supabase
    .from("groups")
    .insert({ name: body.name, description: body.description, size: body.size })
    .select();

  if (error) {
    console.error(error);
    return res.status(500).send({ message: error });
  }

  const groupID = data[0].id;
  console.log("Group created successfully");

  // Create user-group relationship
  const { error: error2 } = await supabase
    .from("user-groups")
    .insert({ userID: userID, groupID: groupID, role: "owner" });

  if (error2) {
    console.error(error2);
    return res.status(500).send({ message: error2});
  }

  console.log("User-group relationship created successfully");
  res.send({ message: "Success!" });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

// POST request to add a user to a group as a member
app.post("/groups/:groupID/members", async (req, res) => {
  const groupID = req.params.groupID;
  const body = req.body;
  const userID = body.userID;

  // Create user-group relationship
  const { error } = await supabase
    .from("user-groups")
    .insert({ userID: userID, groupID: groupID, role: "member" });

  if (error) {
    console.error(error);
    return res.status(500).send({ message: error });
  }
  console.log("User-group relationship created successfully");
  res.send({ message: "Success!" });
});