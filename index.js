// Source of graph database

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

const testQuery = {
  Query: {
    users: {
      name: () => true,
      transactions: {
        price: (price) => price === 20,
        user: {
          name: () => true,
          address: () => true,
        },
      },
    },
  },
};

class GraphDatabase {
  constructor(schema, database = {}) {
    this.schema = schema;
    this.database = database;
  }

  fetch(query, obj = null, type = null) {
    if (type === null) {
      // It is root query. Therefore type is considered as key.
      return Object.fromEntries(
        Object.entries(query).map(([type, subquery]) => {
          if (type !== "Query" && type !== "Mutation")
            throw new Error(
              "Attributes of root element must be either `Query` or `Mutation`. `" + type + "` detected."
            );
          const subQueryType = this.schema[type];
          return [type, this.fetch(subquery, null, subQueryType)];
        })
      );
    }

    // It is not a root query.
    const returnEntries = [];
    const sourceEntries = Object.entries(query);
    for (let i = 0; i < sourceEntries.length; i++) {
      const [key, subquery] = sourceEntries[i];

      const schema = type[key];
      const schemaType = typeof schema;
      const subQueryType = typeof subquery;

      if (schemaType === "function" && subQueryType !== "function")
        throw new Error("Schema is scalar / subquery is not filter");
      if (schemaType !== "function" && subQueryType === "function")
        throw new Error("Schema is not scalar / subquery is filter");

      if (schemaType === "function") {
        // Given schema is scalar
        const scalar = schema(obj[key]);
        const condition = subquery(scalar);
        if (!condition) return undefined;
        returnEntries.push([key, scalar]);
      } else if (Array.isArray(schema)) {
        // Schema is array of something
        const [schemaTypeStr, selector] = schema;
        const type = this.schema[schemaTypeStr];
        const selectedCollection = selector(obj, this.database[schemaTypeStr]);
        const returnValue = selectedCollection
          .map((obj) => this.fetch(subquery, obj, type))
          .filter((x) => x !== undefined);
        returnEntries.push([key, returnValue]);
      } else {
        // Schema is object
        const [schemaTypeStr, selector] = Object.entries(schema)[0];
        const type = this.schema[schemaTypeStr];
        const selectedItem = selector(obj, this.database[schemaTypeStr]);
        const returnValue = this.fetch(subquery, selectedItem, type);
        returnEntries.push([key, returnValue]);
      }
    }
    return Object.fromEntries(returnEntries);
  }
}

const myDB = new GraphDatabase(testSchema, testDB);

const result = myDB.fetch(testQuery);

console.dir(result, { depth: null });
