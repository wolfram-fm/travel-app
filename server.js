const fastify = require("fastify")({ logger: true });

fastify.register(require("@fastify/jwt"), {
  secret: "0af59902-0fa2-4334-9bc8-2ff233648f66",
});

fastify.register(require("@fastify/postgres"), {
  // connectionString: process.env.DB_CONNECTION_STRING,
  connectionString:
    "postgres://travel_app_user:QIhjIxKWdyQXQRGpobD2nzliFAvgcbp3@dpg-catmmg10gd0dl92l858g-a.ohio-postgres.render.com/travel_app?ssl=true",
});

fastify.register(require("./routes/event"));
fastify.register(require("./routes/trip"));
fastify.register(require("./routes/user"));

fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
