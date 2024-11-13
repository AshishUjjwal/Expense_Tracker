import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import GridBackground from "./components/ui/GridBackground.jsx";
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, ApolloLink } from "@apollo/client";

// const client = new ApolloClient({
//   // TODO => Update the uri on production
//   uri:
//     import.meta.env.VITE_NODE_ENV === "development"
//       ? "http://localhost:4000/graphql"
//       : "/graphql", // the URL of our GraphQL server.
//   cache: new InMemoryCache(), // Apollo Client uses to cache query results after fetching them.
//   credentials: "include", // This tells Apollo Client to send cookies along with every request to the server.
// });

const httpLink = new HttpLink({ uri: 'http://localhost:4000/graphql', credentials: 'include' });

const authLink = new ApolloLink((operation, forward) => {
  operation.setContext({
    headers: {
      'content-type': 'application/json', // Ensure content-type is set to JSON
    },
  });
  return forward(operation);
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <GridBackground>
        <ApolloProvider client={client}>
          <App />
        </ApolloProvider>
      </GridBackground>
    </BrowserRouter>
  </React.StrictMode>
);
