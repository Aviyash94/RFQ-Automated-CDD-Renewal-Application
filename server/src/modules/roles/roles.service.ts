import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permissionRepo: Repository<Permission>,
  ) {}

  async findAllRoles() {
    return this.roleRepo.find({
      relations: { rolePermissions: { permission: true } },
      order: { name: 'ASC' },
    });
  }

  async findRole(id: string) {
    return this.roleRepo.findOne({
      where: { id },
      relations: { rolePermissions: { permission: true }, userRoles: true },
    });
  }

  async findAllPermissions() {
    return this.permissionRepo.find({ order: { module: 'ASC', key: 'ASC' } });
  }
}
