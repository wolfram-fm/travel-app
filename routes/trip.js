/**
 * A plugin that provide encapsulated routes
 * @param {FastifyInstance} fastify encapsulated fastify instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function tripRoutes(fastify, options) {
  const database = await fastify.pg.connect();

  fastify.get("/trip/:id", async (request, reply) => {
    try {
      const { rows } = await database.query("SELECT * FROM trips WHERE id=$1", [
        request.params.id,
      ]);

      return rows[0] || {};
    } catch (e) {
      console.log(e);
      return {};
    }
  });

  const createTripSchema = {
    body: {
      type: "object",
      required: ["owner", "adventure"],
      properties: {
        owner: { type: "number" },
        adventure: { type: "string" },
      },
    },
  };

  fastify.post("/trip", { createTripSchema }, async (request, reply) => {
    return fastify.pg.transact(async (database) => {
      // will resolve to an id, or reject with an error
      const id = await database.query(
        "INSERT INTO trips(owner, adventure) VALUES($1, $2) RETURNING id",
        [request.body.owner, request.body.adventure]
      );

      // potentially do something with id
      return id;
    });
  });
}

module.exports = tripRoutes;
