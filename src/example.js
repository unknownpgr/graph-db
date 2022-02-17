const GraphDatabase = require("./index.js");

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

const testDB = {
  User: [
    { name: "a", age: 20, address: "here" },
    { name: "b", age: 30, address: "there" },
    { name: "c", age: 40, address: "somewhere" },
  ],

  Transaction: [
    { user: "a", price: 10 },
    { user: "b", price: 20 },
    { user: "b", price: 21 },
    { user: "b", price: 22 },
    { user: "c", price: 30 },
    { user: "c", price: 15 },
  ],
};

const myDB = new GraphDatabase(testSchema, testDB);

// For query without condition, use true-constant function.

/**
 * Get all users
 *  with their name and transaction
 *    whose price is higher than 20
 *    with the user of the transaction
 *      whose address ends with 'where'
 */
const all = () => true;
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

const result = myDB.fetch(testQuery);
console.dir(result, { depth: null });

/*
// result
{
  Query: {
    users: [
      { name: 'a', transactions: [] },
      {
        name: 'b',
        transactions: [
          { price: 21, user: undefined },
          { price: 22, user: undefined }
        ]
      },
      {
        name: 'c',
        transactions: [ { price: 30, user: { name: 'c', address: 'somewhere' } } ]
      }
    ]
  }
}
*/
