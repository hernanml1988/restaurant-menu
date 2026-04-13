import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { AuditLog } from '../audit_log/entities/audit_log.entity';
import {
  CashSession,
  CashSessionStatusEnum,
} from '../cash_session/entities/cash_session.entity';
import { Category } from '../category/entities/category.entity';
import {
  DiningSession,
  DiningSessionAccountStatusEnum,
} from '../dining_session/entities/dining_session.entity';
import { StatusEnum } from '../enums/status.enum';
import {
  FiscalDocument,
  FiscalDocumentTypeEnum,
} from '../fiscal_document/entities/fiscal_document.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order_item.entity';
import { OrderItemExtraSelection } from '../order/entities/order_item_extra_selection.entity';
import {
  OrderPriorityEnum,
  OrderStationEnum,
  OrderStatusEnum,
} from '../order/entities/order.entity';
import {
  Payment,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from '../payment/entities/payment.entity';
import { Profile } from '../profile/entities/profile.entity';
import { ProfileRole } from '../profile_role/entities/profile_role.entity';
import { Product } from '../product/entities/product.entity';
import {
  ProductExtra,
  ProductExtraTypeEnum,
} from '../product_extra/entities/product_extra.entity';
import { Receipt, ReceiptTypeEnum } from '../receipt/entities/receipt.entity';
import {
  Reservation,
  ReservationStatusEnum,
} from '../reservation/entities/reservation.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Role } from '../role/entities/role.entity';
import {
  ServiceRequest,
  ServiceRequestStatusEnum,
  ServiceRequestTypeEnum,
} from '../service_request/entities/service_request.entity';
import { Table, TableStatusEnum } from '../table/entities/table.entity';
import Utils from '../utils/errorUtils';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProfileRole)
    private readonly profileRoleRepository: Repository<ProfileRole>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductExtra)
    private readonly productExtraRepository: Repository<ProductExtra>,
    @InjectRepository(DiningSession)
    private readonly diningSessionRepository: Repository<DiningSession>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderItemExtraSelection)
    private readonly orderItemExtraSelectionRepository: Repository<OrderItemExtraSelection>,
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(CashSession)
    private readonly cashSessionRepository: Repository<CashSession>,
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    @InjectRepository(FiscalDocument)
    private readonly fiscalDocumentRepository: Repository<FiscalDocument>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  private sanitizeUser(user: User) {
    if (!user) {
      return null;
    }

    const currentProfileRole = user.profile?.profileRoles?.[0] ?? null;
    const fullName = [
      user.profile?.name,
      user.profile?.lastname,
      user.profile?.secondLastname,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      id: user.id,
      username: user.username,
      email: user.username,
      fullName,
      state: user.state,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile
        ? {
            id: user.profile.id,
            name: user.profile.name,
            lastname: user.profile.lastname,
            secondLastname: user.profile.secondLastname,
          }
        : null,
      role: currentProfileRole?.role
        ? {
            id: currentProfileRole.role.id,
            name: currentProfileRole.role.name,
          }
        : null,
      roles:
        user.profile?.profileRoles?.map((profileRole) => profileRole.role?.name) ??
        [],
    };
  }

  private async findRoleOrFail(roleId: string) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async seedAdminData() {
    try {
      const actor = 'seed-admin';
      const counters = {
        roles: 0,
        users: 0,
        tables: 0,
        categories: 0,
        products: 0,
        extras: 0,
        sessions: 0,
        orders: 0,
        orderItems: 0,
        serviceRequests: 0,
        payments: 0,
        cashSessions: 0,
        receipts: 0,
        fiscalDocuments: 0,
        reservations: 0,
        auditLogs: 0,
      };

      const roleSeeds = [
        { name: 'Super-Administrador', description: 'Puede realizar cualquier accion' },
        { name: 'Jefe de Cocina', description: 'Gestiona pedidos y despacho en cocina' },
      ];
      for (const roleSeed of roleSeeds) {
        const existingRole = await this.roleRepository.findOne({
          where: [{ name: roleSeed.name }, { description: roleSeed.description }],
        });
        if (!existingRole) {
          const role = this.roleRepository.create({
            ...roleSeed,
            state: true,
            status: StatusEnum.ACTIVE,
          });
          await this.roleRepository.save(role);
          counters.roles += 1;
        }
      }

      const adminRole = await this.roleRepository.findOne({
        where: { name: 'Super-Administrador' },
      });
      const kitchenRole = await this.roleRepository.findOne({
        where: { name: 'Jefe de Cocina' },
      });

      const userSeeds = [
        {
          username: 'admin@mesamagica.cl',
          password: 'Admin123!',
          name: 'Paula',
          lastname: 'Herrera',
          secondLastname: 'Rojas',
          role: adminRole,
        },
        {
          username: 'cocina@mesamagica.cl',
          password: 'Cocina123!',
          name: 'Marco',
          lastname: 'Soto',
          secondLastname: 'Diaz',
          role: kitchenRole,
        },
      ];

      for (const seed of userSeeds) {
        if (!seed.role) {
          continue;
        }

        let user = await this.userRepository.findOne({
          where: { username: seed.username },
        });
        if (!user) {
          user = this.userRepository.create({
            username: seed.username,
            password: seed.password,
            state: true,
            status: StatusEnum.ACTIVE,
          });
          user = await this.userRepository.save(user);
          counters.users += 1;
        }

        let profile = await this.profileRepository.findOne({
          where: { user: { id: user.id } },
        });
        if (!profile) {
          profile = this.profileRepository.create({
            name: seed.name,
            lastname: seed.lastname,
            secondLastname: seed.secondLastname,
            user,
            state: true,
            status: StatusEnum.ACTIVE,
          });
          profile = await this.profileRepository.save(profile);
        }

        const profileRole = await this.profileRoleRepository.findOne({
          where: { profile: { id: profile.id }, role: { id: seed.role.id } },
        });
        if (!profileRole) {
          await this.profileRoleRepository.save(
            this.profileRoleRepository.create({
              profile,
              role: seed.role,
              state: true,
              status: StatusEnum.ACTIVE,
            }),
          );
        }
      }

      let restaurant = await this.restaurantRepository.findOne({
        where: { state: true },
        order: { createdAt: 'ASC' },
      });
      if (!restaurant) {
        restaurant = await this.restaurantRepository.save(
          this.restaurantRepository.create({
            name: 'Mesa Magica Demo',
            tagline: 'Datos de prueba administracion',
            phone: '+56 9 1111 1111',
            email: 'demo@mesamagica.cl',
            address: 'Santiago Centro 123',
            description: 'Restaurante de prueba para todos los modulos.',
            logoDataUrl: null,
          }),
        );
      }

      const tableSeed = { number: 1, name: 'Mesa 1', capacity: 4, zone: 'Salon' };
      let table = await this.tableRepository.findOne({
        where: { restaurant: { id: restaurant.id }, number: tableSeed.number, state: true },
      });
      if (!table) {
        const qrToken = `table:${restaurant.id}:${tableSeed.number}:${this.slugify(tableSeed.name)}:${randomUUID()}`;
        table = await this.tableRepository.save(
          this.tableRepository.create({
            ...tableSeed,
            qrCode: `${(process.env.FRONTEND_PUBLIC_URL || 'http://localhost:8080').replace(/\/+$/, '')}/cliente/bienvenida?qr=${encodeURIComponent(qrToken)}`,
            restaurant,
            serviceStatus: TableStatusEnum.FREE,
            activeOrders: 0,
            state: true,
            status: StatusEnum.ACTIVE,
            createdBy: actor,
            modifiedBy: actor,
          }),
        );
        counters.tables += 1;
      }

      let category = await this.categoryRepository.findOne({
        where: { restaurant: { id: restaurant.id }, name: 'Fondos', state: true },
      });
      if (!category) {
        category = await this.categoryRepository.save(
          this.categoryRepository.create({
            name: 'Fondos',
            emoji: '🍽️',
            count: 0,
            state: true,
            status: StatusEnum.ACTIVE,
            restaurant,
            createdBy: actor,
            modifiedBy: actor,
          }),
        );
        counters.categories += 1;
      }

      let product = await this.productRepository.findOne({
        where: { restaurant: { id: restaurant.id }, name: 'Lomo Saltado', state: true },
      });
      if (!product) {
        product = await this.productRepository.save(
          this.productRepository.create({
            name: 'Lomo Saltado',
            description: 'Carne salteada con papas y arroz.',
            price: 13900,
            available: true,
            popular: true,
            promo: false,
            trackStock: true,
            stockQuantity: 20,
            stockAlertThreshold: 5,
            allergens: [],
            state: true,
            status: StatusEnum.ACTIVE,
            restaurant,
            category,
            createdBy: actor,
            modifiedBy: actor,
          }),
        );
        counters.products += 1;
      }

      const existingExtra = await this.productExtraRepository.findOne({
        where: { product: { id: product.id }, name: 'Aji extra', state: true },
      });
      if (!existingExtra) {
        await this.productExtraRepository.save(
          this.productExtraRepository.create({
            name: 'Aji extra',
            price: 300,
            type: ProductExtraTypeEnum.ADD,
            options: [],
            product,
            state: true,
            status: StatusEnum.ACTIVE,
            createdBy: actor,
            modifiedBy: actor,
          }),
        );
        counters.extras += 1;
      }

      category.count = await this.productRepository.count({
        where: { category: { id: category.id }, state: true },
      });
      await this.categoryRepository.save(category);

      let openSession = await this.diningSessionRepository.findOne({
        where: { sessionToken: 'demo-session-open' },
      });
      if (!openSession) {
        openSession = await this.diningSessionRepository.save(
          this.diningSessionRepository.create({
            sessionToken: 'demo-session-open',
            active: true,
            accountStatus: DiningSessionAccountStatusEnum.PAYMENT_PENDING,
            restaurant,
            table,
            state: true,
            status: StatusEnum.ACTIVE,
            createdBy: actor,
            modifiedBy: actor,
          }),
        );
        counters.sessions += 1;
      }

      const existingOrder = await this.orderRepository.findOne({
        where: { diningSession: { id: openSession.id }, observations: '[SEED_DEMO]', state: true },
      });
      let order = existingOrder;
      if (!order) {
        const maxOrderRaw = await this.orderRepository
          .createQueryBuilder('order')
          .select('COALESCE(MAX(order.number), 0)', 'max')
          .getRawOne<{ max: string }>();
        order = await this.orderRepository.save(
          this.orderRepository.create({
            number: Number(maxOrderRaw?.max ?? 0) + 1,
            orderStatus: OrderStatusEnum.PREPARING,
            priority: OrderPriorityEnum.NORMAL,
            station: OrderStationEnum.COCINA,
            observations: '[SEED_DEMO]',
            total: 13900,
            subtotalBeforeDiscount: 13900,
            discountAmount: 0,
            discountType: null,
            discountValue: 0,
            discountReason: null,
            restaurant,
            table,
            diningSession: openSession,
            state: true,
            status: StatusEnum.ACTIVE,
            createdBy: actor,
            modifiedBy: actor,
          }),
        );
        counters.orders += 1;
      }

      const existingOrderItem = await this.orderItemRepository.findOne({
        where: { order: { id: order.id }, product: { id: product.id }, state: true },
      });
      if (!existingOrderItem) {
        await this.orderItemRepository.save(
          this.orderItemRepository.create({
            productName: product.name,
            quantity: 1,
            unitPrice: product.price,
            subtotal: product.price,
            order,
            product,
            state: true,
            status: StatusEnum.ACTIVE,
            createdBy: actor,
            modifiedBy: actor,
          }),
        );
        counters.orderItems += 1;
      }

      const existingRequest = await this.serviceRequestRepository.findOne({
        where: {
          diningSession: { id: openSession.id },
          type: ServiceRequestTypeEnum.WAITER,
          requestStatus: ServiceRequestStatusEnum.PENDING,
          state: true,
        },
      });
      if (!existingRequest) {
        await this.serviceRequestRepository.save(
          this.serviceRequestRepository.create({
            type: ServiceRequestTypeEnum.WAITER,
            requestStatus: ServiceRequestStatusEnum.PENDING,
            notes: 'Solicitud de prueba desde admin',
            restaurant,
            table,
            diningSession: openSession,
            state: true,
            status: StatusEnum.ACTIVE,
            createdBy: actor,
            modifiedBy: actor,
          }),
        );
        counters.serviceRequests += 1;
      }

      const existingPayment = await this.paymentRepository.findOne({
        where: {
          diningSession: { id: openSession.id },
          paymentStatus: PaymentStatusEnum.PAID,
          state: true,
        },
      });
      let payment = existingPayment;
      if (!payment) {
        payment = await this.paymentRepository.save(
          this.paymentRepository.create({
            method: PaymentMethodEnum.CARD,
            paymentStatus: PaymentStatusEnum.PAID,
            amount: 7000,
            tipAmount: 700,
            receivedAmount: 7700,
            changeAmount: 0,
            payerName: 'Cliente Demo',
            reference: 'TRX-DEMO-001',
            notes: 'Pago parcial semilla',
            restaurant,
            table,
            diningSession: openSession,
            state: true,
            status: StatusEnum.ACTIVE,
            createdBy: actor,
            modifiedBy: actor,
          }),
        );
        counters.payments += 1;
      }

      const existingCashSession = await this.cashSessionRepository.findOne({
        where: {
          restaurant: { id: restaurant.id },
          sessionStatus: CashSessionStatusEnum.OPEN,
          state: true,
        },
      });
      if (!existingCashSession) {
        await this.cashSessionRepository.save(
          this.cashSessionRepository.create({
            sessionStatus: CashSessionStatusEnum.OPEN,
            openingAmount: 150000,
            expectedAmount: 150000,
            notes: 'Caja abierta para datos de prueba',
            openedBy: actor,
            createdBy: actor,
            modifiedBy: actor,
            restaurant,
            state: true,
            status: StatusEnum.ACTIVE,
          }),
        );
        counters.cashSessions += 1;
      }

      const existingReceipt = await this.receiptRepository.findOne({
        where: { payment: { id: payment.id } },
      });
      let receipt = existingReceipt;
      if (!receipt) {
        receipt = await this.receiptRepository.save(
          this.receiptRepository.create({
            code: `RCPT-SEED-${payment.id.slice(0, 8).toUpperCase()}`,
            type: ReceiptTypeEnum.PAYMENT,
            totalAmount: Number(payment.amount) + Number(payment.tipAmount ?? 0),
            snapshot: { paymentId: payment.id, sessionToken: openSession.sessionToken },
            printableHtml: '<html><body><h1>Comprobante de prueba</h1></body></html>',
            issuedBy: actor,
            restaurant,
            table,
            diningSession: openSession,
            payment,
          }),
        );
        counters.receipts += 1;
      }

      const existingFiscalDocument = await this.fiscalDocumentRepository.findOne({
        where: { receipt: { id: receipt.id } },
      });
      if (!existingFiscalDocument) {
        await this.fiscalDocumentRepository.save(
          this.fiscalDocumentRepository.create({
            folio: `FISC-SEED-${receipt.id.slice(0, 8).toUpperCase()}`,
            documentType: FiscalDocumentTypeEnum.RECEIPT,
            totalAmount: receipt.totalAmount,
            payloadSnapshot: { receiptCode: receipt.code },
            issuedBy: actor,
            restaurant,
            diningSession: openSession,
            payment,
            receipt,
          }),
        );
        counters.fiscalDocuments += 1;
      }

      const existingReservation = await this.reservationRepository.findOne({
        where: {
          restaurant: { id: restaurant.id },
          guestName: 'Reserva Demo',
          state: true,
        },
      });
      if (!existingReservation) {
        await this.reservationRepository.save(
          this.reservationRepository.create({
            guestName: 'Reserva Demo',
            guestPhone: '+56 9 9999 0000',
            guestEmail: 'reserva.demo@mail.com',
            partySize: 4,
            reservationAt: new Date(Date.now() + 1000 * 60 * 60 * 4),
            reservationStatus: ReservationStatusEnum.BOOKED,
            notes: 'Reserva creada por seed administrativo',
            restaurant,
            table,
            state: true,
            status: StatusEnum.ACTIVE,
            createdBy: actor,
            modifiedBy: actor,
          }),
        );
        counters.reservations += 1;
      }

      const existingAudit = await this.auditLogRepository.findOne({
        where: { actor, action: 'admin.seed.executed' },
      });
      if (!existingAudit) {
        await this.auditLogRepository.save(
          this.auditLogRepository.create({
            actor,
            action: 'admin.seed.executed',
            entityType: 'system',
            entityId: null,
            metadata: {
              restaurantId: restaurant.id,
            },
          }),
        );
        counters.auditLogs += 1;
      }

      table.activeOrders = await this.orderRepository.count({
        where: {
          table: { id: table.id },
          state: true,
          diningSession: { active: true, state: true },
        },
      });
      table.serviceStatus =
        table.activeOrders > 0 ? TableStatusEnum.WITH_ORDER : TableStatusEnum.FREE;
      await this.tableRepository.save(table);

      return {
        message: 'Datos de prueba cargados exitosamente',
        data: {
          counters,
          credentials: {
            admin: 'admin@mesamagica.cl / Admin123!',
            kitchen: 'cocina@mesamagica.cl / Cocina123!',
          },
          sessionToken: openSession.sessionToken,
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async initService() {
    try {
      const data = {
        user: {
          username: 'hmiranda@thimkti.cl',
          password: 'thinkti080',
        },
        profile: {
          name: 'admin',
          lastname: 'admi',
          secondLastname: 'admin',
        },
        role: {
          name: 'Super-Administrador',
          description: 'Puede realizar cualquier accion',
        },
      };

      const user = new User();
      user.username = data.user.username;
      user.password = data.user.password;

      const newUser = await this.userRepository.save(user);

      const profile = new Profile();
      profile.name = data.profile.name;
      profile.lastname = data.profile.lastname;
      profile.secondLastname = data.profile.secondLastname;
      profile.user = newUser;

      const newProfile = await this.profileRepository.save(profile);

      const role = new Role();
      role.name = data.role.name;
      role.description = data.role.description;

      const newRole = await this.roleRepository.save(role);

      const profileRole = new ProfileRole();
      profileRole.role = newRole;
      profileRole.profile = newProfile;

      await this.profileRoleRepository.save(profileRole);

      return {
        message: 'Carga inicial realizada exitosamente',
        user: newUser,
        profile: newProfile,
        role: newRole,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async create(createUserDto: CreateUserDto) {
    return this.createInternal(createUserDto);
  }

  async createPublic(createUserDto: CreateUserDto) {
    return this.createInternal(createUserDto);
  }

  private async createInternal(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { username: createUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }

      const role = createUserDto.roleId
        ? await this.findRoleOrFail(createUserDto.roleId)
        : null;

      const user = new User();
      user.username = createUserDto.username;
      user.password = createUserDto.password;
      user.state = createUserDto.state ?? true;

      const newUser = await this.userRepository.save(user);

      const profile = new Profile();
      profile.name = createUserDto.name;
      profile.lastname = createUserDto.lastname;
      profile.secondLastname = createUserDto.secondLastname ?? '';
      profile.user = newUser;

      const newProfile = await this.profileRepository.save(profile);

      if (role) {
        const profileRole = new ProfileRole();
        profileRole.profile = newProfile;
        profileRole.role = role;

        await this.profileRoleRepository.save(profileRole);
      }

      const createdUser = await this.userRepository.findOne({
        where: { id: newUser.id },
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
      });

      return {
        message: 'Usuario creado exitosamente',
        data: this.sanitizeUser(createdUser),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findAll() {
    try {
      const users = await this.userRepository.find({
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        message: 'Usuarios obtenidos exitosamente',
        data: users.map((user) => this.sanitizeUser(user)),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        message: 'Usuario obtenido exitosamente',
        data: this.sanitizeUser(user),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (updateUserDto.username && updateUserDto.username !== user.username) {
        const existingUser = await this.userRepository.findOne({
          where: { username: updateUserDto.username },
        });

        if (existingUser && existingUser.id !== user.id) {
          throw new ConflictException('Username already exists');
        }

        user.username = updateUserDto.username;
      }

      if (updateUserDto.password) {
        user.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      if (typeof updateUserDto.state === 'boolean') {
        user.state = updateUserDto.state;
      }

      await this.userRepository.save(user);

      if (user.profile) {
        user.profile.name = updateUserDto.name ?? user.profile.name;
        user.profile.lastname = updateUserDto.lastname ?? user.profile.lastname;
        user.profile.secondLastname =
          updateUserDto.secondLastname ?? user.profile.secondLastname;

        await this.profileRepository.save(user.profile);
      }

      if (updateUserDto.roleId) {
        const role = await this.findRoleOrFail(updateUserDto.roleId);
        const currentProfileRole = user.profile?.profileRoles?.[0] ?? null;

        if (currentProfileRole) {
          currentProfileRole.role = role;
          await this.profileRoleRepository.save(currentProfileRole);
        } else if (user.profile) {
          const profileRole = new ProfileRole();
          profileRole.profile = user.profile;
          profileRole.role = role;
          await this.profileRoleRepository.save(profileRole);
        }
      }

      const updatedUser = await this.userRepository.findOne({
        where: { id: user.id },
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
      });

      return {
        message: 'Usuario actualizado exitosamente',
        data: this.sanitizeUser(updatedUser),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async remove(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.state = false;
      user.status = StatusEnum.INACTIVE;

      const removedUser = await this.userRepository.save(user);

      return {
        message: 'Usuario desactivado exitosamente',
        data: this.sanitizeUser(removedUser),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { username: email },
      relations: {
        profile: {
          profileRoles: {
            role: true,
          },
        },
      },
    });
  }
}
