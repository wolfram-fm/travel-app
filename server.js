require("dotenv").config();
const fastify = require("fastify")({ logger: true });

fastify.register(require("@fastify/jwt"), {
  secret: "0af59902-0fa2-4334-9bc8-2ff233648f66",
});

fastify.register(require("@fastify/postgres"), {
  // connectionString: process.env.DB_CONNECTION_STRING,
  connectionString: process.env.DB_CONNECTION_STRING,
});

fastify.register(require("./routes/event"));
fastify.register(require("./routes/poll"));
fastify.register(require("./routes/trip"));
fastify.register(require("./routes/user"));

fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
