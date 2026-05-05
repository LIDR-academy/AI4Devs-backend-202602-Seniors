import request from 'supertest';
import { app } from '../index';
import { Position } from '../domain/models/Position';

jest.mock('../domain/models/Position');

const mockFindAll = Position.findAll as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /positions', () => {
    it('returns 200 with an array of positions', async () => {
        mockFindAll.mockResolvedValue([
            { id: 1, title: 'Senior Developer', status: 'Open' },
            { id: 2, title: 'Product Manager', status: 'Draft' },
        ]);

        const response = await request(app).get('/positions');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            { id: 1, title: 'Senior Developer', status: 'Open' },
            { id: 2, title: 'Product Manager', status: 'Draft' },
        ]);
    });

    it('returns 200 with an empty array when no positions exist', async () => {
        mockFindAll.mockResolvedValue([]);

        const response = await request(app).get('/positions');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it('returns 500 on internal error', async () => {
        mockFindAll.mockRejectedValue(new Error('Database connection failed'));

        const response = await request(app).get('/positions');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal server error' });
    });
});
