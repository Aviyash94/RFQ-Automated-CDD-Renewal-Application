import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Customer } from '../../database/entities/customer.entity';
import { ImportBatch } from '../../database/entities/import-batch.entity';
import { ImportBatchStatus } from '../../common/enums';
import { paginate } from '../../common/dto/pagination.dto';
import { applySort } from '../../common/dto/sorting.dto';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
} from './dto/customer.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';

const CUSTOMER_SORT_COLUMNS: Record<string, string> = {
  name: 'customer.name',
  email: 'customer.email',
  customerType: 'customer.customerType',
  riskRating: 'customer.riskRating',
  cddExpiryDate: 'customer.cddExpiryDate',
  createdAt: 'customer.createdAt',
};

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(ImportBatch) private importBatchRepo: Repository<ImportBatch>,
    @InjectQueue('customer-import') private importQueue: Queue,
  ) {}

  async findAll(query: CustomerQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.customerRepo.createQueryBuilder('customer');

    if (query.customerType) {
      qb.andWhere('customer.customerType = :customerType', {
        customerType: query.customerType,
      });
    }
    if (query.riskRating) {
      qb.andWhere('customer.riskRating = :riskRating', {
        riskRating: query.riskRating,
      });
    }
    if (query.search) {
      qb.andWhere(
        '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.externalRef ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    applySort(
      qb,
      query.sortBy,
      query.sortOrder,
      CUSTOMER_SORT_COLUMNS,
      'customer.createdAt',
    );
    qb.skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: { cddRequests: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const customer = this.customerRepo.create({
      ...dto,
      cddExpiryDate: dto.cddExpiryDate ? new Date(dto.cddExpiryDate) : null,
    });
    return this.customerRepo.save(customer);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    Object.assign(customer, {
      ...dto,
      cddExpiryDate: dto.cddExpiryDate
        ? new Date(dto.cddExpiryDate)
        : customer.cddExpiryDate,
    });
    return this.customerRepo.save(customer);
  }

  async remove(id: string) {
    const customer = await this.findOne(id);
    await this.customerRepo.remove(customer);
    return { message: 'Customer deleted successfully' };
  }

  async importCustomers(file: Express.Multer.File, user: AuthUser) {
    if (!file) throw new BadRequestException('File is required');

    const batch = await this.importBatchRepo.save({
      fileName: file.originalname,
      status: ImportBatchStatus.PENDING,
      createdById: user.id,
    });

    await this.importQueue.add('process-import', {
      batchId: batch.id,
      filePath: file.path,
      fileName: file.originalname,
    });

    return {
      message: 'Import queued for processing',
      batchId: batch.id,
    };
  }
}
