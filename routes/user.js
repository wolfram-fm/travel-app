/**
 * A plugin that provide encapsulated routes
 * @param {FastifyInstance} fastify encapsulated fastify instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function userRoutes(fastify, options) {
  const database = await fastify.pg.connect();

  fastify.get("/user/:id", async (request, reply) => {
    try {
      const { rows } = await database.query("SELECT * FROM users WHERE id=$1", [
        request.params.id,
      ]);

      return rows[0] || {};
    } catch (e) {
      console.log(e);
      return {};
    }
  });
}

module.exports = userRoutes;
