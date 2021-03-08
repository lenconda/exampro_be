import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import _ from 'lodash';

export interface RoleTreeItem {
  id: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  children: RoleTreeItem[];
}

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async createRole(id: string, description?: string) {
    return await this.roleRepository.save({ id, description });
  }

  async getFlattenedRoles() {
    return await this.roleRepository.find();
  }

  async getTreedRoles() {
    const roles = await this.getFlattenedRoles();
    const roleObject = {};
    for (const role of roles) {
      const { description, createdAt, updatedAt, id } = role;
      const segments = id.split('/');
      for (let i = 0; i < segments.length; i += 1) {
        _.set(roleObject, `${segments.slice(0, i + 1).join('.')}.metadata`, {
          createdAt,
          updatedAt,
          ...(i === segments.length - 1 ? { description } : {}),
        });
      }
      _.set(roleObject, `${role.id.split('/').join('.')}.isLeaf`, true);
    }
    const traverse = (raw: Record<string, any>): RoleTreeItem[] => {
      const result = Object.keys(raw)
        .filter((key) => key !== 'metadata' && key !== 'isLeaf')
        .map((key) => {
          const value = raw[key];
          if (value.isLeaf) {
            return { id: key, children: [], ...value.metadata };
          } else {
            return { id: key, children: traverse(value), ...value.metadata };
          }
        });
      return result || [];
    };
    return traverse(roleObject);
  }
}
