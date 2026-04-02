/**
 * IntentFlow Backend Unit Tests Setup
 */

const request = require('supertest');
const app = require('../app');

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('checks');
    });

    it('should include database check', async () => {
      const res = await request(app).get('/health');
      
      expect(res.body.checks).toHaveProperty('database');
      expect(['healthy', 'unhealthy']).toContain(res.body.checks.database.status);
    });

    it('should include memory check', async () => {
      const res = await request(app).get('/health');
      
      expect(res.body.checks).toHaveProperty('memory');
      expect(res.body.checks.memory).toHaveProperty('heapUsed');
      expect(res.body.checks.memory).toHaveProperty('heapTotal');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const res = await request(app).get('/health/ready');
      
      expect([200, 503]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('status');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const res = await request(app).get('/health/live');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'alive');
      expect(res.body).toHaveProperty('timestamp');
    });
  });
});

describe('Error Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    
    expect([401, 404]).toContain(res.statusCode);
  });

  it('should handle malformed JSON', async () => {
    const res = await request(app)
      .post('/api/nlp/extract')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');
    
    expect([400, 401, 500]).toContain(res.statusCode);
  });
});

describe('Security Headers', () => {
  it('should have security headers from helmet', async () => {
    const res = await request(app).get('/health');
    
    expect(res.headers).toHaveProperty('x-content-type-options');
    expect(res.headers).toHaveProperty('x-frame-options');
    expect(res.headers).toHaveProperty('x-xss-protection');
  });

  it('should have request ID in headers', async () => {
    const res = await request(app).get('/health');
    
    expect(res.headers).toHaveProperty('x-request-id');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should have CORS headers', async () => {
    const res = await request(app).get('/health');
    
    expect(res.headers).toHaveProperty('access-control-allow-origin');
  });
});

describe('Rate Limiting', () => {
  it('should limit requests', async () => {
    const requests = Array(105).fill(null);
    
    for (let i = 0; i < requests.length; i++) {
      const res = await request(app).get('/health');
      if (i >= 100) {
        expect(res.statusCode).toBe(429);
        break;
      }
    }
  }, 30000);
});