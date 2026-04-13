import { HttpException } from '@nestjs/common';
import { DiningSessionService } from './dining_session.service';
import { DiningSessionAccountStatusEnum } from './entities/dining_session.entity';
import { PaymentStatusEnum } from '../payment/entities/payment.entity';
import { TableStatusEnum } from '../table/entities/table.entity';

type MockRepo = {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  count: jest.Mock;
  update: jest.Mock;
};

function createMockRepo(): MockRepo {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };
}

describe('DiningSessionService', () => {
  const tableService = {
    findActiveTableByQrValue: jest.fn(),
  };
  const auditLogService = {
    record: jest.fn(),
  };

  let diningSessionRepository: MockRepo;
  let tableRepository: MockRepo;
  let orderRepository: MockRepo;
  let paymentRepository: MockRepo;
  let serviceRequestRepository: MockRepo;
  let service: DiningSessionService;

  beforeEach(() => {
    diningSessionRepository = createMockRepo();
    tableRepository = createMockRepo();
    orderRepository = createMockRepo();
    paymentRepository = createMockRepo();
    serviceRequestRepository = createMockRepo();
    tableService.findActiveTableByQrValue.mockReset();
    auditLogService.record.mockReset();

    service = new DiningSessionService(
      diningSessionRepository as any,
      tableRepository as any,
      orderRepository as any,
      paymentRepository as any,
      serviceRequestRepository as any,
      tableService as any,
      auditLogService as any,
    );
  });

  it('falls back to active table session when existingSessionToken is stale', async () => {
    const table = {
      id: 'table-1',
      number: 1,
      name: 'Mesa 1',
      serviceStatus: TableStatusEnum.OCCUPIED,
      restaurant: { id: 'rest-1' },
    };
    const activeSession = {
      id: 'session-1',
      sessionToken: 'active-token',
      active: true,
      table,
      restaurant: table.restaurant,
      orders: [],
      payments: [],
      accountStatus: DiningSessionAccountStatusEnum.OPEN,
      createdAt: new Date(),
      startedAt: new Date(),
    };

    tableService.findActiveTableByQrValue.mockResolvedValue(table);
    diningSessionRepository.findOne.mockResolvedValueOnce(null);
    diningSessionRepository.find.mockResolvedValueOnce([activeSession]);

    const response = await service.start({
      qrCode: 'table:rest-1:1:mesa-1:token',
      existingSessionToken: 'old-token',
    });

    expect(response.message).toBe('Sesion activa reutilizada exitosamente');
    expect(response.data.sessionToken).toBe('active-token');
  });

  it('auto closes session when total account is fully paid', async () => {
    const table = {
      id: 'table-1',
      serviceStatus: TableStatusEnum.WITH_ORDER,
      activeOrders: 0,
    };
    const session = {
      id: 'session-1',
      sessionToken: 'session-token',
      active: true,
      accountStatus: DiningSessionAccountStatusEnum.OPEN,
      table,
      orders: [{ total: 10000 }],
      payments: [
        {
          amount: 10000,
          tipAmount: 0,
          receivedAmount: 10000,
          changeAmount: 0,
          state: true,
          paymentStatus: PaymentStatusEnum.PAID,
        },
      ],
      modifiedBy: 'system01',
      closedAt: null,
    };

    diningSessionRepository.findOne.mockResolvedValueOnce(session);
    diningSessionRepository.save.mockImplementation(async (entity) => entity);
    serviceRequestRepository.update.mockResolvedValue({});
    tableRepository.findOne.mockResolvedValueOnce(table);
    orderRepository.count.mockResolvedValueOnce(0);
    diningSessionRepository.find.mockResolvedValueOnce([]);

    const result = await service.syncSessionFinancialState('session-1', 'admin');

    expect(result?.active).toBe(false);
    expect(result?.accountStatus).toBe(DiningSessionAccountStatusEnum.CLOSED);
    expect(serviceRequestRepository.update).toHaveBeenCalled();
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'dining-session.auto-closed',
      }),
    );
  });

  it('returns a friendly public message for closed session tokens', async () => {
    diningSessionRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.findActiveByToken('closed-token')).rejects.toBeInstanceOf(
      HttpException,
    );
  });
});
