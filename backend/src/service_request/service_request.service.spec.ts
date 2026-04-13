import { HttpException } from '@nestjs/common';
import { ServiceRequestService } from './service_request.service';
import { DiningSessionAccountStatusEnum } from '../dining_session/entities/dining_session.entity';
import { ServiceRequestTypeEnum } from './entities/service_request.entity';

function createMockRepo() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
}

describe('ServiceRequestService', () => {
  it('rejects public service request when session is already paid', async () => {
    const serviceRequestRepository = createMockRepo();
    const diningSessionRepository = createMockRepo();
    const tableRepository = createMockRepo();

    diningSessionRepository.findOne.mockResolvedValue({
      id: 'session-1',
      sessionToken: 'session-token',
      active: true,
      accountStatus: DiningSessionAccountStatusEnum.PAID,
      state: true,
      restaurant: { id: 'rest-1' },
      table: { id: 'table-1' },
    });

    const service = new ServiceRequestService(
      serviceRequestRepository as any,
      diningSessionRepository as any,
      tableRepository as any,
      { getCurrentRestaurantEntity: jest.fn() } as any,
      { publishInternal: jest.fn() } as any,
    );

    await expect(
      service.createPublic({
        sessionToken: 'session-token',
        type: ServiceRequestTypeEnum.WAITER,
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
