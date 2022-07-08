/**
 * A plugin that provide encapsulated routes
 * @param {FastifyInstance} fastify encapsulated fastify instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function eventRoutes(fastify, options) {
  const database = await fastify.pg.connect();

  fastify.get("/event/:id", async (request, reply) => {
    try {
      const { rows } = await database.query(
        "SELECT * FROM events WHERE id=$1",
        [request.params.id]
      );

      return rows[0] || {};
    } catch (e) {
      console.log(e);
      return {};
    }
  });

  const createEventSchema = {
    body: {
      type: "object",
      required: ["title", "trip_id"],
      properties: {
        trip_id: { type: "number" },
        title: { type: "string" },
        link: { type: "string" },
        detail: { type: "string" },
      },
    },
  };

  fastify.post("/event", { createEventSchema }, async (request, reply) => {
    return fastify.pg.transact(async (database) => {
      // will resolve to an id, or reject with an error
      const id = await database.query(
        "INSERT INTO events(title, link, detail, trip_id) VALUES($1, $2, $3, $4) RETURNING id",
        [
          request.body.title,
          request.body?.link,
          request.body?.detail,
          request.body.trip_id,
        ]
      );

      // potentially do something with id
      return id;
    });
  });

  const patchEventSchema = {
    body: {
      type: "object",
      properties: {
        title: { type: "string" },
        link: { type: "string", nullable: true },
        detail: { type: "string", nullable: true },
        archived: { type: "boolean" },
      },
    },
  };

  fastify.patch("/event/:id", { patchEventSchema }, async (request, reply) => {
    return fastify.pg.transact(async (database) => {
      let clauses = [];
      let values = [request.params.id];
      ["title", "link", "detail", "archived"].forEach((el, i) => {
        if (request.body?.[el]) {
          clauses.push(`${el} = $${i + 1}`);
          values.push(request.body[el]);
        }
      });
      // will resolve to an id, or reject with an error
      const count = await database.query(
        `UPDATE events SET ${clauses.join()} WHERE id=$1`,
        values
      );

      // potentially do something with id
      return count;
    });
  });

  fastify.delete("/event/:id", async (request, reply) => {
    return fastify.pg.transact(async (database) => {
      // will resolve to an id, or reject with an error
      const rows = await database.query("DELETE FROM events WHERE id=$1", [
        request.params.id,
      ]);

      // potentially do something with id
      return rows;
    });
  });
}

module.exports = eventRoutes;
