import { HttpException } from '@nestjs/common';
import { OrderService } from './order.service';
import { DiningSessionAccountStatusEnum } from '../dining_session/entities/dining_session.entity';

function createMockRepo() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    manager: {
      transaction: jest.fn(),
      getRepository: jest.fn(),
    },
  };
}

describe('OrderService', () => {
  it('rejects public order creation when session is already closed', async () => {
    const orderRepository = createMockRepo();
    const orderSequenceRepository = createMockRepo();
    const diningSessionRepository = createMockRepo();
    const cashSessionRepository = createMockRepo();
    const tableRepository = createMockRepo();
    const paymentRepository = createMockRepo();

    diningSessionRepository.findOne.mockResolvedValue({
      id: 'session-1',
      sessionToken: 'session-token',
      active: false,
      accountStatus: DiningSessionAccountStatusEnum.CLOSED,
      state: true,
      restaurant: { id: 'rest-1' },
      table: { id: 'table-1' },
    });

    const service = new OrderService(
      orderRepository as any,
      orderSequenceRepository as any,
      diningSessionRepository as any,
      cashSessionRepository as any,
      tableRepository as any,
      paymentRepository as any,
      { publishInternal: jest.fn(), publishSession: jest.fn() } as any,
      { record: jest.fn() } as any,
    );

    await expect(
      service.createPublicOrder({
        sessionToken: 'session-token',
        items: [{ productId: 'product-1', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
