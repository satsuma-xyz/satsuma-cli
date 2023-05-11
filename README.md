# 🍊Satsuma CLI
Satsuma's CLI for managing custom graphql queries.

## Getting started
This CLI can be run entirely though npx. The get started, head to the folder where your subgraph lives and run:

```bash
npx @satsuma/cli init
```

This will initialize a `.satsuma.json`, and a folder called `custom-queries/` in your project root. 
The `.satsuma.json` file stores non-sensitive metadata about your subgraph, 
and the `custom-queries/` folder is where you can configure custom GraphQL.

## Writing custom queries
After running init, you'll see that you now have three new files.

### typeDefs.ts
This file should export `typeDefs`, a string containing your custom GraphQL type definitions. This will be merged with 
your subgraph's schema.

### resolvers.ts
This file should export `resolvers`, an object containing your custom GraphQL resolvers for any added fields in typeDefs.

### helpers.ts (optional)
This file should export `helpers`, an object containing any helper functions you want to use in your resolvers. 
This will be passed to your resolvers via the graphql context. 

_Note: You should not import any modules in this file, nor should you import helpers directly into resolvers. It will 
not work due to the sandbox environment in which your code is executed_

### Context
All resolvers are passed a `context` object as the third argument. This context object contains the following properties:
- `db`: An object containing knex instances for each of your subgraph's databases.
  - `db.entities`: The database containing your subgraph's entities.
- `helpers`: An object containing any helper functions you've defined in `helpers.ts`.

### Resolvers & Helpers runtime
Resolvers and helpers are run in a node sandbox. This means that we've limited the modules you can use, as well as the 
limits on the amount of memory and time your code can consume.
- Max Memory: 1gb
- Max Runtime: 25 seconds
- Allowed Modules: 
  - `lodash` (available as `_`)
  - `date-fns` (available as `dateFns`)
  - `uuid` (available as `uuid`)
  - `moment`
  - `rxjs`
  - `ramda` (available as `R`)
  - `validator` (https://www.npmjs.com/package/validator)
  - `console` (in local env, this will redirect to your console)


## Types
For those who want to work with typescript, you can run the following to generate `schema.graphql` and `schema.ts` files.

```bash
npx @satsuma/cli codegen -k {your deploy key} --subgraphName {your subgraph name} --subgraphVersion {your subgraph version}
``` 

These files will be generated in the `custom-queries/` folder. The `schema.ts` file will contain typescript types that you can import and use
in your custom resolvers & helpers.

_Note: You should not manually edit `types.ts`._

## Running Locally
When you're ready to test your changes locally, you can run the following command to deploy your custom queries to a local graph node.

```bash
npx @satsuma/cli local -k {your deploy key} --subgraphName {your subgraph name} --subgraphVersion {your subgraph version}
```

This will spin up a server on `http://localhost:4000`. If you visit that URL, you'll be greeted with Apollo Studio's GraphQL playground.

## Deploying
When you're ready to deploy your custom queries to Satsuma, you can run the following command:

```bash
npx @satsuma/cli deploy -k {your deploy key} --subgraphName {your subgraph name} --subgraphVersion {your subgraph version}
```


