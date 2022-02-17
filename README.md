# Graph Database

This project is for designing a database + business logic system similar to GraphQL, but fully compatible with JavaScript.

## Example

See [example.js](./src/example.js)

## Docs

### Schema definition

```js
const testSchema = {
  User: {
    name: String,
    age: Number,
    // Define schema and resolver at once.
    // Array schema can be defined as array
    transactions: ["Transaction", (obj, collection) => collection.filter((item) => item.user == obj.name)],
    address: String,
  },

  Transaction: {
    // And object schema can be defined as object.
    user: { User: (obj, collection) => collection.filter((item) => item.name === obj.user)[0] },
    price: Number,
  },

  // Root entrypoint.
  Query: { users: ["User", (_, collection) => collection] },
  // Mutation is not implemented yet.
  Mutation: {},
};
```

### Query

```js
// For query without condition, use true-constant function.
const all = () => true;

/**
 * Get all users
 *  with their name and transaction
 *    whose price is higher than 20
 *    with the user of the transaction
 *      whose address ends with 'where'
 */
const testQuery = {
  // Root item of query must be either Query or Mutation.
  Query: {
    users: {
      name: all,
      transactions: {
        // Currently condition is implement as a function.
        // However, I am planning to replace it to JSON-serializable form,
        // like conditional operation in mongoose
        price: (price) => price > 20,
        user: {
          name: all,
          address: (address) => address.endsWith("where"),
        },
      },
    },
  },
};
```

Below is the result of the query above.

```js
{
  Query: {
    users: [
      { name: "a", transactions: [] },
      {
        name: "b",
        transactions: [
          { price: 21, user: undefined },
          { price: 22, user: undefined },
        ],
      },
      {
        name: "c",
        transactions: [{ price: 30, user: { name: "c", address: "somewhere" } }],
      },
    ];
  }
}
```
