import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; role: string };
    user: { userId: string; role: string };
  }
}

const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const app = Fastify({
  logger: process.env.NODE_ENV !== 'test',
});

// Documentation
await app.register(swagger, {
  openapi: {
    info: { title: 'KP Pakse Platform API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
});
await app.register(swaggerUi, { routePrefix: '/api/docs' });

// Middleware
await app.register(cors, { origin: true, credentials: true });
await app.register(sensible);
await app.register(jwt, { secret: JWT_SECRET });

// Auth decorator
app.decorate('authenticate', async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ success: false, error: 'Unauthorized' });
  }
});

// Health check
app.get('/api/health', async () => ({
  success: true,
  data: { status: 'ok', version: '1.0.0', time: new Date().toISOString() },
}));

// Public auth routes
app.post(
  '/api/auth/login',
  {
    schema: {
      description: 'Authenticate user and return JWT',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['login', 'password'],
        properties: {
          login: { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
  },
  async (request, reply) => {
    // TODO: wire to UserService + bcrypt
    const { login, password } = request.body as { login: string; password: string };
    if (login === 'admin' && password === 'admin123') {
      const token = await reply.jwtSign({ userId: 'admin', role: 'owner' });
      return { success: true, data: { token, user: { id: 'admin', name: 'Admin', role: 'owner' } } };
    }
    return reply.code(401).send({ success: false, error: 'Invalid credentials' });
  }
);

// Protected example route
app.get(
  '/api/me',
  { onRequest: [app.authenticate as any] },
  async (request) => ({
    success: true,
    data: request.user,
  })
);

// Global error handler
app.setErrorHandler((error: FastifyError, request, reply) => {
  app.log.error(error);
  reply.status(error.statusCode || 500).send({
    success: false,
    error: error.message || 'Internal Server Error',
  });
});

// Start
app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
