/**
 * A plugin that provide encapsulated routes
 * @param {FastifyInstance} fastify encapsulated fastify instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function pollRoutes(fastify, options) {
  const database = await fastify.pg.connect();

  fastify.get("/poll/:id", async (request, reply) => {
    try {
      const { rows } = await database.query("SELECT * FROM polls WHERE id=$1", [
        request.params.id,
      ]);

      return rows[0] || {};
    } catch (e) {
      console.log(e);
      return {};
    }
  });

  const createPollSchema = {
    body: {
      type: "object",
      required: ["options", "type", "trip_id"],
      properties: {
        trip_id: { type: "number" },
        type: { type: "string" },
        options: { type: "array" },
      },
    },
  };

  fastify.post("/poll", { createPollSchema }, async (request, reply) => {
    return fastify.pg.transact(async (database) => {
      // will resolve to an id, or reject with an error
      const id = await database.query(
        "INSERT INTO polls(trip_id, type, options) VALUES($1, $2, $3) RETURNING id",
        [
          request.body.trip_id,
          request.body.type,
          JSON.stringify(request.body.options),
        ]
      );

      return id;
    });
  });

  const voteSchema = {
    body: {
      type: "object",
      required: ["user_id", "selections"],
      properties: {
        user_id: { type: "number" },
        selections: { type: "array" },
      },
    },
  };

  fastify.patch("/poll/:id", { voteSchema }, async (request, reply) => {
    return fastify.pg.transact(async (database) => {
      // will resolve to an id, or reject with an error
      const count = await database.query(
        `UPDATE polls SET votes = jsonb_set(votes, '{${request.body.user_id}}', $1) WHERE id=$2`,
        [JSON.stringify(request.body.selections), request.params.id]
      );

      // potentially do something with id
      return count;
    });
  });

  fastify.patch("/poll/:id/end", async (request, reply) => {
    const { rows } = await database.query("SELECT * FROM polls WHERE id=$1", [
      request.params.id,
    ]);

    if (rows.length === 0 || rows[0].winner !== null) {
      return;
    }

    const poll = rows[0];

    let winner;
    if (poll.type === "single") {
      let counts = new Map();

      Object.values(poll.votes).forEach((vote) => {
        let record = vote[0];
        if (counts.has(record)) {
          counts.set(record, counts.get(record) + 1);
        } else {
          counts.set(record, 1);
        }
      });

      winner = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }

    return fastify.pg.transact(async (database) => {
      const rows = await database.query(
        "UPDATE polls SET winner=$1 WHERE id=$2",
        [winner, poll.id]
      );

      return rows;
    });
  });
}

module.exports = pollRoutes;
