import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Customer } from '../../database/entities/customer.entity';
import { CddRequest } from '../../database/entities/cdd-request.entity';
import { Document } from '../../database/entities/document.entity';
import { GlobalSearchDto } from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(CddRequest) private cddRepo: Repository<CddRequest>,
    @InjectRepository(Document) private documentRepo: Repository<Document>,
  ) {}

  async globalSearch(dto: GlobalSearchDto) {
    const limit = Math.min(Number(dto.limit) || 10, 25);
    const term = `%${dto.q}%`;

    const [customers, cddRequests, documents] = await Promise.all([
      this.customerRepo.find({
        where: [
          { name: ILike(term) },
          { email: ILike(term) },
          { externalRef: ILike(term) },
        ],
        take: limit,
        order: { name: 'ASC' },
      }),
      this.cddRepo
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.customer', 'customer')
        .where('r.referenceNumber ILIKE :term', { term })
        .orWhere('customer.name ILIKE :term', { term })
        .take(limit)
        .getMany(),
      this.documentRepo.find({
        where: { fileName: ILike(term) },
        take: limit,
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      query: dto.q,
      results: {
        customers: customers.map((c) => ({
          id: c.id,
          type: 'customer',
          title: c.name,
          subtitle: c.email,
          link: `/customers/${c.id}`,
        })),
        cddRequests: cddRequests.map((r) => ({
          id: r.id,
          type: 'cdd-request',
          title: r.referenceNumber,
          subtitle: r.customer?.name,
          link: `/cdd-requests/${r.id}`,
        })),
        documents: documents.map((d) => ({
          id: d.id,
          type: 'document',
          title: d.fileName,
          subtitle: d.documentType,
          link: `/documents/${d.id}`,
        })),
      },
      totalCount: customers.length + cddRequests.length + documents.length,
    };
  }
}
