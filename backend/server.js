const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolver");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();

app.use(express.json());
app.use(cookieParser());


const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const authHeader = req.headers.authorization || "";
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "YOUR_SECRET_KEY");
        return { userId: decoded.userId };
      } catch (err) {
        console.warn("Invalid token:", err.message);
        return {};
      }
    }
    return {};
  },
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });
  
  mongoose
  .connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));
  
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}${server.graphqlPath}`);
  });
}


startServer();

const path = require("path");

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});